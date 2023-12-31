import { Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose"
import {
  BLOGS_DESCRIPTION_MAX_LENGTH,
  BLOGS_NAME_MAX_LENGTH,
  BLOGS_WEBSITEURL_MAX_LENGTH, BLOGS_WEBSITEURL_REGEX
} from "../../../../../infrastructure/utils/constants"
import { CreateBlogCommand } from "../../../../blogger/application/use-cases/mongoose/create-blog.use-case"
import { PostsModel } from "../../../../posts/application/entites/mongoose/posts.schema"
import { Contract } from "../../../../../infrastructure/utils/contract"
import { ErrorEnums } from "../../../../../infrastructure/utils/error-enums"
import { HydratedDocument, Model, Types } from "mongoose"
import { UpdateBlogBodyInputModel } from "../../../../blogger/api/models/input/update-blog.body.input-model"


export interface IBlogOwnerInfo {
  userLogin: string | null
  userId: string | null
}
export interface IBanInfo {
  isBanned: boolean
  banDate: string | null
}
// export interface IBannedUsers {
//   userId: string
//   userLogin: string
//   isBanned: boolean
//   banReason: string | null
//   banDate: string | null
// }


@Schema()
export class Blogs {
  @Prop({
    type: String,
    required: true,
    maxlength: BLOGS_NAME_MAX_LENGTH,
  })
  name: string

  @Prop({
    type: String,
    required: true,
    maxlength: BLOGS_DESCRIPTION_MAX_LENGTH,
  })
  description: string

  @Prop({
    type: String,
    required: true,
    maxlength: BLOGS_WEBSITEURL_MAX_LENGTH,
    match: BLOGS_WEBSITEURL_REGEX,
  })
  websiteUrl: string

  @Prop({
    type: String,
    required: true,
  })
  createdAt: string

  @Prop({
    type: Boolean,
    required: true,
  })
  isMembership: boolean

  @Prop(
    raw({
      userLogin: {
        type: String,
        required: true,
      },
      userId: {
        type: String,
        required: true,
      }
    })
  )
  blogOwnerInfo: IBlogOwnerInfo

  @Prop(
    raw({
      isBanned: {
        type: Boolean,
        required: true,
      },
      banDate: {
        type: String
      }
    }))
  banInfo: IBanInfo


  static createBlog(bodyBlog: CreateBlogCommand, login: string, BlogsModel: BlogsModel,): BlogsDocument {
    const date = new Date().toISOString()

    const newBlogDto = {
      name: bodyBlog.name,
      description: bodyBlog.description,
      websiteUrl: bodyBlog.websiteUrl,
      createdAt: date,
      isMembership: false,
      blogOwnerInfo: {
        userId: bodyBlog.userId,
        userLogin: login,
      },
      banInfo: {
        isBanned: false,
        banDate: null,
      },
    }
    const newBlog = new BlogsModel(newBlogDto)
    return newBlog
  }

  static async deleteBlog(id: string, BlogsModel: BlogsModel, PostsModel: PostsModel,): Promise<Contract<null | number>> {
    const deleteBlogResult = await BlogsModel.deleteOne({ _id: new Types.ObjectId(id) })
    if (deleteBlogResult.deletedCount === 0)
      return new Contract(null, ErrorEnums.BLOG_NOT_DELETED)

    const deletePostsResult = await PostsModel.deleteMany({ blogId: id })
    if (deletePostsResult.deletedCount === 0)
      return new Contract(null, ErrorEnums.POSTS_NOT_DELETED)

    return new Contract(deleteBlogResult.deletedCount, null)
  }

  updateBlog(newBlogDto: UpdateBlogBodyInputModel): void {
    this.name = newBlogDto.name
    this.description = newBlogDto.description
    this.websiteUrl = newBlogDto.websiteUrl
  }

  bindBlog(userId: string): void {
    this.blogOwnerInfo.userId = userId
  }

  banBlog(): void {
    this.banInfo.isBanned = true
    this.banInfo.banDate = new Date().toISOString()
  }

  unbanBlog(): void {
    this.banInfo.isBanned = false
    this.banInfo.banDate = null
  }

  // banUser(userId: string, login: string, banReason: string): void {
  //   this.bannedUsers.push(
  //     {
  //       userId: userId,
  //       userLogin: login,
  //       isBanned: true,
  //       banReason: banReason,
  //       banDate: new Date().toISOString(),
  //     }
  //   )
  // }

  // unbanUser(userId: string) {
  //   const foundBannedUser = this.bannedUsers.find(user => user.userId === userId)
  //   if (foundBannedUser === undefined) return null
  //   foundBannedUser.isBanned = false
  //   foundBannedUser.banReason = null
  //   foundBannedUser.banDate = null
  // }
  // unbanUser(userId: string): void {
  //   const documentIdx = this.bannedUsers.findIndex(user => user.userId === userId)
  //   this.bannedUsers.splice(documentIdx, 1)
  // }

}
interface BlogsStatics {
  createBlog(bodyBlogModel: CreateBlogCommand, login: string, BlogsModel: BlogsModel,): BlogsDocument
  deleteBlog(id: string, BlogsModel: BlogsModel, PostsModel: PostsModel,): Promise<Contract<null | number>>
}

export const BlogsSchema = SchemaFactory.createForClass(Blogs)
BlogsSchema.statics.createBlog = Blogs.createBlog
BlogsSchema.methods.updateBlog = Blogs.prototype.updateBlog
BlogsSchema.methods.bindBlog = Blogs.prototype.bindBlog
BlogsSchema.methods.banBlog = Blogs.prototype.banBlog
BlogsSchema.methods.unbanBlog = Blogs.prototype.unbanBlog
// BlogsSchema.methods.banUser = Blogs.prototype.banUser
// BlogsSchema.methods.unbanUser = Blogs.prototype.unbanUser

export type BlogsDocument = HydratedDocument<Blogs>
export type BlogsModel = Model<BlogsDocument> & BlogsStatics
