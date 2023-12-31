import { Injectable } from "@nestjs/common"
import { Contract } from "../../../../infrastructure/utils/contract"
import { GetCommentsOutputModel } from "../../api/models/output/get-comments.output-model"
import { ErrorEnums } from "../../../../infrastructure/utils/error-enums"
import {
  LikeStatus,
  PAGE_NUMBER_DEFAULT,
  PAGE_SIZE_DEFAULT,
  SORT_BY_DEFAULT_SQL,
  SortDirection,
  SortDirectionOrm
} from "../../../../infrastructure/utils/constants"
import { GetPostsCommentsQueryInputModel } from "../../../blogs/api/models/input/get-posts-comments.query.input-model"
import { InjectDataSource } from "@nestjs/typeorm"
import { DataSource, SelectQueryBuilder } from "typeorm"
import { UsersRepositoryOrm } from "../../../sa/repository/typeorm/users.repository.orm"
import { PostsQueryRepositoryOrm } from "../../../posts/repository/typeorm/posts.query.repository.orm"
import { CommentEntity } from "../../application/entities/sql/comment.entity"
import { CommentLikeEntity } from "../../application/entities/sql/comment-like.entity"
import { BanInfoEntity } from "../../../sa/application/entities/sql/ban-info.entity"
import { PostEntity } from "../../../posts/application/entites/typeorm/post.entity"
import { BlogEntity } from "../../../blogs/application/entities/sql/blog.entity"


@Injectable()
export class CommentsQueryRepositoryOrm {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    protected usersSqlRepository: UsersRepositoryOrm,
    protected postsQueryRepositorySql: PostsQueryRepositoryOrm,
  ) {
  }

  async findAllBlogComments(query: GetPostsCommentsQueryInputModel, userId: string) {
    const pageSize = +query.pageSize || PAGE_SIZE_DEFAULT
    const pageNumber = +query.pageNumber || PAGE_NUMBER_DEFAULT
    const sortDirection = query.sortDirection === SortDirection.Asc ? SortDirectionOrm.Asc : SortDirectionOrm.Desc
    const sortBy = query.sortBy.charAt(0).toUpperCase() + query.sortBy.slice(1) || SORT_BY_DEFAULT_SQL
    const offset = (pageNumber - 1) * pageSize

    const commentsTotalCount = await this.dataSource.createQueryBuilder(CommentEntity, "c")
      .leftJoin(PostEntity, "p", `p.PostId = c.PostId`)
      .leftJoin(BlogEntity, "b", `b.BlogId = p.BlogId`)
      .where(`b.UserId = :userId`, { userId })
      .getCount()

    const pagesCount = Math.ceil(commentsTotalCount / pageSize)

    const comments = await this.dataSource.createQueryBuilder(CommentEntity, "c")
      .addSelect(qb => this.likesCountBuilder(qb, "cl", LikeStatus.Like, userId), "likesCount")
      .addSelect(qb => this.likesCountBuilder(qb, "cdl", LikeStatus.Dislike, userId), "dislikesCount")
      .addSelect(qb => this.myLikeStatusBuilder(qb, "ms", userId), "myStatus")
      .leftJoinAndSelect(PostEntity, "p", `p.PostId = c.PostId`)
      .leftJoin(BlogEntity, "b", `b.BlogId = p.BlogId`)
      .where(`b.UserId = :userId`, { userId })
      .orderBy(`c.${sortBy}`, sortDirection)
      .limit(pageSize)
      .offset(offset)
      .getRawMany()

    const blogCommentsView = this.blogCommentsView(comments)

    return {
      pagesCount: pagesCount,
      page: pageNumber,
      pageSize: pageSize,
      totalCount: Number(commentsTotalCount),
      items: blogCommentsView
    }
  }


  async findComments({ postId, query, userId }) {

    const foundPost = await this.postsQueryRepositorySql.findPost(postId, userId)
    if (!foundPost) return new Contract(null, ErrorEnums.POST_NOT_FOUND)

    const pageSize = +query.pageSize || PAGE_SIZE_DEFAULT
    const pageNumber = +query.pageNumber || PAGE_NUMBER_DEFAULT
    const sortBy = query.sortBy.charAt(0).toUpperCase() + query.sortBy.slice(1) || SORT_BY_DEFAULT_SQL
    const sortDirection = query.sortDirection === SortDirection.Asc ? SortDirectionOrm.Asc : SortDirectionOrm.Desc
    const offset = (pageNumber - 1) * pageSize

    const totalCount = await this.dataSource.createQueryBuilder()
      .from(CommentEntity, "a")
      .where(`a.PostId = :postId`, { postId })
      .getCount()

    const comments = await this.dataSource.createQueryBuilder()
      .select([
        `a."PostId" as "postId"`,
        `a."Content" as "content"`,
        `a."CreatedAt" as "createdAt"`,
        `a."CommentId" as "commentId"`,
        `a."UserId" as "userId"`,
        `a."UserLogin" as "userLogin"`,
        `le.Status as "myStatus"`
      ])
      .addSelect(qb => this.likesCountBuilder1(qb), `likesCount`)
      .addSelect(qb => this.likesCountBuilder2(qb), `dislikesCount`)
      .leftJoin(CommentLikeEntity, "le", `le.CommentId = a.CommentId and le.UserId = :userId`, { userId })
      .from(CommentEntity, "a")
      .where(`a.PostId = :postId`, { postId })
      .orderBy(`a.${sortBy}`, sortDirection)
      .limit(pageSize)
      .offset(offset)
      .getRawMany()

    const commentsView = this.postCommentsView(comments)
    const pagesCount = Math.ceil(totalCount / pageSize)

    return new Contract({
      pagesCount: pagesCount,
      page: pageNumber,
      pageSize: pageSize,
      totalCount: Number(totalCount),
      items: commentsView
    }, null)
  }

  async findComment({ commentId, userId }) {
    const comment = await this.dataSource.createQueryBuilder(CommentEntity, "a")
      .select([
        `a."PostId" as "postId"`,
        `a."Content" as "content"`,
        `a."CreatedAt" as "createdAt"`,
        `a."CommentId" as "commentId"`,
        `a."UserId" as "userId"`,
        `a."UserLogin" as "userLogin"`,
        `le.Status as "myStatus"`,
        `b.IsBanned as "isBanned"`
      ])
      .addSelect(qb => this.likesCountBuilder1(qb), `likesCount`)
      .addSelect(qb => this.likesCountBuilder2(qb), `dislikesCount`)
      .leftJoin(CommentLikeEntity, "le", `le.CommentId = a.CommentId and le.UserId = :userId`, { userId })
      .leftJoin(BanInfoEntity, "b", `b.UserId = a.UserId`)
      .where(`a.CommentId = :commentId`, { commentId })
      .getRawOne()

    if (!comment) return new Contract(null, ErrorEnums.COMMENT_NOT_FOUND)
    if (comment.isBanned === true) return new Contract(null, ErrorEnums.USER_IS_BANNED)
    return new Contract(this.changeCommentView(comment), null)
  }


  private blogCommentsView(comments: any[]) {

    return comments.map(comment => {
      return {
        id: comment.c_CommentId,
        content: comment.c_Content,
        commentatorInfo: {
          userId: comment.c_UserId,
          userLogin: comment.c_UserLogin,
        },
        createdAt: comment.c_CreatedAt,
        likesInfo: {
          likesCount: Number(comment.likesCount),
          dislikesCount: Number(comment.dislikesCount),
          myStatus: comment.myStatus || LikeStatus.None,
        },
        postInfo: {
          id: comment.p_PostId,
          title: comment.p_Title,
          blogId: comment.p_BlogId,
          blogName: comment.p_BlogName,
        }
      }
    })
  }

  private postCommentsView(comments: any[]): GetCommentsOutputModel[] {
    // Looking for a myStatus of Like in each comment

    return comments.map(comment => {
      return {
        id: comment.commentId,
        content: comment.content,
        commentatorInfo: {
          userId: comment.userId,
          userLogin: comment.userLogin,
        },
        createdAt: comment.createdAt,
        likesInfo: {
          likesCount: Number(comment.likesCount),
          dislikesCount: Number(comment.dislikesCount),
          myStatus: comment.myStatus || LikeStatus.None,
        },
      }
    })
  }

  private changeCommentView(comment: any): GetCommentsOutputModel {
    return {
      id: comment.commentId,
      content: comment.content,
      commentatorInfo: {
        userId: comment.userId,
        userLogin: comment.userLogin,
      },
      createdAt: comment.createdAt,
      likesInfo: {
        likesCount: Number(comment.likesCount),
        dislikesCount: Number(comment.dislikesCount),
        myStatus: comment.myStatus || LikeStatus.None,
      },
    }
  }


  private likesCountBuilder1(qb: SelectQueryBuilder<any>) {
    return qb
      .select(`count(*)`)
      .from(CommentLikeEntity, "le1")
      .leftJoin(BanInfoEntity, "b", `b.UserId = le1.UserId`)
      .where(`le1.CommentId = a.CommentId`)
      .andWhere(`le1.Status = 'Like'`)
      .andWhere(`b.IsBanned = :isBanned`, { isBanned: false })
  }

  private likesCountBuilder2(qb: SelectQueryBuilder<any>) {
    return qb
      .select(`count(*)`)
      .from(CommentLikeEntity, "le2")
      .leftJoin(BanInfoEntity, "b", `b.UserId = le2.UserId`)
      .where(`le2.CommentId = a.CommentId`)
      .andWhere(`le2.Status = 'Dislike'`)
      .andWhere(`b.IsBanned = :isBanned`, { isBanned: false })
  }

  private likesCountBuilder(qb: SelectQueryBuilder<any>, alias: string, ls: LikeStatus, userId: string) {
    return qb
      .select(`count(*)`)
      .from(CommentLikeEntity, alias)
      .leftJoin(BanInfoEntity, "bi", `bi.UserId = ${alias}.UserId`)
      .where(`${alias}.Status = '${ls}'`)
      .andWhere(`c.CommentId = ${alias}.CommentId`)
      .andWhere(`p.PostId = c.PostId`)
      .andWhere(`b.BlogId = p.BlogId`)
      .andWhere(`b.UserId = :userId`, { userId })
      .andWhere(`bi.IsBanned = :isBanned`, { isBanned: false })
  }

  private myLikeStatusBuilder(qb: SelectQueryBuilder<any>, alias1: string, userId: string) {
    return qb
      .select(`${alias1}.Status`)
      .from(CommentLikeEntity, alias1)
      .where(`${alias1}.CommentId = c.CommentId`)
      .andWhere(`${alias1}.UserId = :userId`, { userId })
  }


}