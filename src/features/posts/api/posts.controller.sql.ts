import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  UseGuards
} from "@nestjs/common"
import { CommandBus } from "@nestjs/cqrs"
import { AccessMiddleware } from "../../../infrastructure/guards/access-middleware.guard"
import { AccessGuard } from "../../../infrastructure/guards/access.guard"
import { ErrorEnums } from "../../../infrastructure/utils/error-enums"
import { DeviceSessionOptionalReqInputModel } from "./models/input/device-session-optional.req.input-model"
import { DeviceSessionReqInputModel } from "./models/input/device-session.req.input-model"
import { GetCommentsParamInputModel } from "./models/input/get-comments.param.input-model"
import { GetCommentsQueryInputModel } from "./models/input/get-comments.query.input-model"
import { GetPostsQueryInputModel } from "./models/input/get-posts.query.input-model"
import { IdParamInputModel } from "./models/input/id.param.input-model"
import { LikeStatusBodyInputModel } from "./models/input/like-status.body.input-model"
import { CommentsQueryRepository } from "../../comments/repository/mongoose/comments.query.repository"
import { DeviceSessionOptional } from "../../../infrastructure/decorators/device-session-optional.decorator"
import { callErrorMessage } from "../../../infrastructure/adapters/exception-message.adapter"
import { UpdateCommentBodyInputModel } from "../../comments/api/models/input/update-comment.body.input-model"
import { DeviceSession } from "../../../infrastructure/decorators/device-session.decorator"
import { CreateCommentCommand } from "../application/use-cases/create-comment.use-case"
import { UpdatePostLikeCommand } from "../application/use-cases/update-post-like.use-case"
import { PostsQueryRepositorySql } from "../repository/sql/posts.query.repository.sql"
import { IdParamInputModelSql } from "./models/input/id.param.input-model.sql"

@Controller("posts")
export class PostsControllerSql {
  constructor(
    private commandBus: CommandBus,
    protected postsSqlQueryRepository: PostsQueryRepositorySql,
    protected commentsQueryRepository: CommentsQueryRepository,
  ) {
  }

  @UseGuards(AccessMiddleware)
  @Get()
  async getPosts(
    @DeviceSessionOptional() deviceSession: DeviceSessionOptionalReqInputModel,
    @Query() queryPost: GetPostsQueryInputModel
  ) {
    const postsView = await this.postsSqlQueryRepository.findPosts(queryPost, deviceSession?.userId)
    return postsView
  }

  @UseGuards(AccessMiddleware)
  @Get(":id")
  async getPost(
    @DeviceSessionOptional() deviceSession: DeviceSessionOptionalReqInputModel,
    @Param() param: IdParamInputModelSql,
  ) {
    const postView = await this.postsSqlQueryRepository.findPost(param.id, deviceSession?.userId)
    if (!postView) throw new NotFoundException(
      callErrorMessage(ErrorEnums.POST_NOT_FOUND, "id")
    )
    return postView
  }


  @UseGuards(AccessMiddleware)
  @Get(":postId/comments")
  async getComments(
    @DeviceSessionOptional() deviceSession: DeviceSessionOptionalReqInputModel,
    @Param() param: GetCommentsParamInputModel,
    @Query() queryComment: GetCommentsQueryInputModel,
  ) {
    const commentsContract = await this.commentsQueryRepository.findComments(
      param.postId,
      queryComment,
      deviceSession?.userId
    )
    if (commentsContract.error === ErrorEnums.POST_NOT_FOUND) throw new NotFoundException(
      callErrorMessage(ErrorEnums.POST_NOT_FOUND, "postId")
    )
    return commentsContract.data
  }

  @UseGuards(AccessGuard)
  @Post(":postId/comments")
  async createComment(
    @DeviceSession() deviceSession: DeviceSessionReqInputModel,
    @Param() param: GetCommentsParamInputModel,
    @Body() bodyComment: UpdateCommentBodyInputModel,
  ) {
    const commentContract = await this.commandBus.execute(
      new CreateCommentCommand(
        deviceSession?.userId,
        param.postId,
        bodyComment.content
      )
    )
    if (commentContract.error === ErrorEnums.USER_NOT_FOUND) throw new NotFoundException(
      callErrorMessage(ErrorEnums.USER_NOT_FOUND, "userId")
    )
    if (commentContract.error === ErrorEnums.USER_IS_BANNED) throw new ForbiddenException()

    if (commentContract.error === ErrorEnums.POST_NOT_FOUND) throw new NotFoundException(
      callErrorMessage(ErrorEnums.POST_NOT_FOUND, "postId")
    )
    if (commentContract.error === ErrorEnums.COMMENT_NOT_FOUND) throw new InternalServerErrorException()
    return commentContract.data
  }

  @UseGuards(AccessGuard)
  @Put(":postId/like-status")
  @HttpCode(HttpStatus.NO_CONTENT)
  async likeStatus(
    @DeviceSessionOptional() deviceSession: DeviceSessionOptionalReqInputModel,
    @Param() postId: GetCommentsParamInputModel,
    @Body() bodyLike: LikeStatusBodyInputModel,
  ) {
    const commentContract = await this.commandBus.execute(
      new UpdatePostLikeCommand(
        deviceSession.userId,
        postId.postId,
        bodyLike.likeStatus
      )
    )
    if (commentContract.error === ErrorEnums.POST_NOT_FOUND) throw new NotFoundException(
      callErrorMessage(ErrorEnums.POST_NOT_FOUND, "postId")
    )
    if (commentContract.error === ErrorEnums.USER_NOT_FOUND) throw new NotFoundException(
      callErrorMessage(ErrorEnums.USER_NOT_FOUND, "userId")
    )
    return true
  }


}