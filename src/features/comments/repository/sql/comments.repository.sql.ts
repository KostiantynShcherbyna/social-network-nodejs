import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { Types } from "mongoose"
import { Comments, CommentsDocument, CommentsModel } from "../../application/entities/mongoose/comments.schema"
import { Contract } from "../../../../infrastructure/utils/contract"
import { InjectDataSource } from "@nestjs/typeorm"
import { DataSource, QueryRunner } from "typeorm"
import { LikeStatus } from "../../../../infrastructure/utils/constants"


@Injectable()
export class CommentsRepositorySql {
  constructor(
    @InjectDataSource() protected dataSource: DataSource
  ) {
  }

  async findComment(commentId: string) {
    const result = await this.dataSource.query(`
    select "CommentId" as "commentId", "PostId" as "postId", "Content" as "content",
           "UserId" as "userId", "UserLogin" as "userLogin", "CreatedAt" as "createdAt",
           (
           select count(*)
           from public."comment_like_entity" a
           left join public."ban_info_entity" b on b."UserId" = a."UserId"
           where "CommentId" = $1
           and "Status" = 'Like'
           and b."IsBanned" = 'false'
           ) as "likesCount", 
           (
           select count(*)
           from public."comment_like_entity" a
           left join public."ban_info_entity" b on b."UserId" = a."UserId"
           where "CommentId" = $1
           and "Status" = 'Dislike'
           and b."IsBanned" = 'false'
           ) as "dislikesCount"
    from public."comment_entity"
    where "CommentId" = $1
    `, [commentId])
    return result.length ? result[0] : null
  }

  async findCommentLike({ commentId, userId }) {
    const result = await this.dataSource.query(`
    select a."Status" as "myStatus", "CommentId" as "commentId", "LikeId" as "likeId", "UserId" as "userId"
    from public."comment_like_entity" a
    where "CommentId" = $1
    and "UserId" = $2
    `, [commentId, userId])
    return result.length ? result[0] : null
  }

  async updateComment({ commentId, content }, queryRunner: QueryRunner): Promise<string> {
    const result = await queryRunner.query(`
    update public."comment_entity"
    set "Content" = $2
    where "CommentId" = $1
    `, [commentId, content])
    return result.length ? result[1] : null
  }

  async createLike({ status, commentId, userId }, queryRunner: QueryRunner): Promise<string> {
    const result = await queryRunner.query(`
    insert into public."comment_like_entity"("Status", "CommentId", "UserId")
    values($1, $2, $3)
    `, [status, commentId, userId])
    return result.length ? result[1] : null
  }

  async updateLike({ status, commentId, userId }, queryRunner: QueryRunner): Promise<string> {
    const queryForm = `
    update public."comment_like_entity"
    set "Status" = $1
    where "CommentId" = $2
    and "UserId" = $3
    `
    const result = await queryRunner.query(queryForm, [status, commentId, userId])
    return result.length ? result[1] : null
  }


  async deleteComment(commentId: string, queryRunner: QueryRunner) {
    const result = await queryRunner.query(`
    delete from public."comment_entity"
    where "CommentId" = $1
    `, [commentId])
    return result[1]
  }

  async deleteLike(commentId: string, queryRunner: QueryRunner) {
    const result = await queryRunner.query(`
    delete from public."comment_like_entity"
    where "CommentId" = $1
    `, [commentId])
    return result[1]
  }

}
