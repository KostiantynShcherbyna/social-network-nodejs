import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { InjectModel } from "@nestjs/mongoose"
import { PostsComments, PostsCommentsModel } from "../../../../posts/application/entites/mongoose/posts-comments.schema"
import { PostsCommentsRepository } from "../../../../blogger/repository/mongoose/posts-comments.repository"
import { CommentsRepository } from "../../../repository/mongoose/comments.repository"
import { UsersRepository } from "../../../../sa/repository/mongoose/users.repository"
import { Contract } from "../../../../../infrastructure/utils/contract"
import { ErrorEnums } from "../../../../../infrastructure/utils/error-enums"


export class UpdateCommentLikeCommand {
  constructor(
    public userId: string,
    public commentId: string,
    public newLikeStatus: string
  ) {
  }
}


@CommandHandler(UpdateCommentLikeCommand)
export class UpdateCommentLike implements ICommandHandler<UpdateCommentLikeCommand> {
  constructor(
    @InjectModel(PostsComments.name) protected PostsCommentsModel: PostsCommentsModel,
    protected postsCommentsRepository: PostsCommentsRepository,
    protected commentsRepository: CommentsRepository,
    protected usersRepository: UsersRepository,
  ) {
  }

  async execute(command: UpdateCommentLikeCommand): Promise<Contract<boolean | null>> {

    // const foundUser = await this.usersRepository.findUser(["_id", new Types.ObjectId(command.userId)])
    // if (foundUser === null)
    //     return new Contract(null, ErrorEnums.USER_NOT_FOUND)
    // if (foundUser.accountData.banInfo.isBanned === true)
    //     return new Contract(null, ErrorEnums.USER_IS_BANNED)

    const comment = await this.commentsRepository.findComment(command.commentId)
    if (comment === null) return new Contract(null, ErrorEnums.COMMENT_NOT_FOUND)
    // if (comment.commentatorInfo.userId !== command.userId) return new Contract(null, ErrorEnums.FOREIGN_COMMENT);


    const postComment = await this.postsCommentsRepository.findPostComment(command.commentId)
    if (postComment === null) return new Contract(null, ErrorEnums.COMMENT_NOT_FOUND)
    // if (postComment.commentatorInfo.userId !== command.userId) return new Contract(null, ErrorEnums.FOREIGN_COMMENT);


    // Create a new Like if there is no Like before or update Like if there is one
    comment.createOrUpdateLike(command.userId, command.newLikeStatus)
    postComment.createOrUpdateLike(command.userId, command.newLikeStatus)

    await this.commentsRepository.saveDocument(comment)
    await this.postsCommentsRepository.saveDocument(postComment)

    return new Contract(true, null)
  }


}