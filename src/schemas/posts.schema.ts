import { Prop, Schema, SchemaFactory, raw } from "@nestjs/mongoose";
import { HydratedDocument, Model, Types } from "mongoose";
import { BodyPostModel } from "src/models/body/BodyPostModel";
import {
  POSTS_CONTENT_MAX_LENGTH,
  POSTS_SHORTDESCRIPTION_MAX_LENGTH,
  POSTS_TITLE_MAX_LENGTH,
  myStatusEnum
} from "src/utils/constants/constants";
import { UsersDocument } from "./users.schema";


// @Schema()
// export class ExtendedLikesInfo {

//     @Prop({
//         type: Number,
//         required: true,
//         default: 0,
//         min: 0,
//     })
//     likesCount: number

//     @Prop({
//         type: Number,
//         required: true,
//         default: 0,
//         min: 0,
//     })
//     dislikesCount: number

//     @Prop(
//         raw([
//             {
//                 userId: {
//                     type: String,
//                     required: true,
//                 },
//                 status: {
//                     type: String,
//                     required: true,
//                     enum: myStatusEnum,
//                     default: myStatusEnum.None,
//                 }
//             }
//         ])
//     )
//     like: string

//     @Prop(
//         raw([
//             {
//                 addedAt: {
//                     type: String,
//                     required: true,
//                 },
//                 userId: {
//                     type: String,
//                     required: true,
//                 },
//                 login: {
//                     type: String,
//                     required: true,
//                 }
//             }
//         ]))
//     newestLikes: 

// }
// export const PostsSchema = SchemaFactory.createForClass(Posts);


export interface IExtendedLikesInfo {
  likesCount: number;
  dislikesCount: number;
  like: ILike[];
  newestLikes: INewestLikes[];
}

export interface ILike {
  userId: string;
  status: string;
}

export interface INewestLikes {
  addedAt: string;
  userId: string;
  login: string;
}


@Schema()
export class Posts {

  _id: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    maxlength: POSTS_TITLE_MAX_LENGTH
  })
  title: string;

  @Prop({
    type: String,
    required: true,
    maxlength: POSTS_SHORTDESCRIPTION_MAX_LENGTH
  })
  shortDescription: string;

  @Prop({
    type: String,
    maxlength: POSTS_CONTENT_MAX_LENGTH
  })
  content: string;

  @Prop({
    type: String,
    required: true
  })
  blogId: string;

  @Prop({
    type: String,
    required: true
  })
  blogName: string;

  @Prop({
    type: String,
    required: true
  })
  createdAt: string;

  @Prop(
    raw({
      likesCount: {
        type: Number,
        required: true,
        default: 0,
        min: 0
      },
      dislikesCount: {
        type: Number,
        required: true,
        default: 0,
        min: 0
      },
      like: [
        {
          userId: {
            type: String,
            required: true
          },
          status: {
            type: String,
            required: true,
            enum: myStatusEnum,
            default: myStatusEnum.None
          }
        }
      ],
      newestLikes: [
        {
          addedAt: {
            type: String,
            required: true
          },
          userId: {
            type: String,
            required: true
          },
          login: {
            type: String,
            required: true
          }
        }
      ]
    }))
  extendedLikesInfo: IExtendedLikesInfo;

  static createPost(bodyPostModel: BodyPostModel, blogName: string, PostsModel: PostsModel) {

    const date = new Date().toISOString();

    const newPostDto = {
      _id: new Types.ObjectId(),
      title: bodyPostModel.title,
      shortDescription: bodyPostModel.shortDescription,
      content: bodyPostModel.content,
      blogId: bodyPostModel.blogId,
      blogName: blogName,
      createdAt: date,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        like: [],
        newestLikes: []
      }
    };

    const newPost = new PostsModel(newPostDto);
    return newPost;
  }

  updatePost(bodyPostDto: BodyPostModel) {
    this.title = bodyPostDto.title;
    this.shortDescription = bodyPostDto.shortDescription;
    this.content = bodyPostDto.content;
    this.blogId = bodyPostDto.blogId;
  }

  createOrUpdateLike(user: UsersDocument, newLikeStatus: string) {

    const like = this.extendedLikesInfo.like.find(like => like.userId === user._id.toString());
    if (!like) {
      const newLikeDto = {
        userId: user._id.toString(),
        status: newLikeStatus
      };

      if (newLikeStatus === myStatusEnum.Like) {
        this.extendedLikesInfo.likesCount++;

        const newDate = new Date(Date.now()).toISOString();
        const newestLikesDto = {
          addedAt: newDate,
          userId: user._id.toString(),
          login: user.accountData.login //    TODO
        };
        this.extendedLikesInfo.like.push(newLikeDto);
        this.extendedLikesInfo.newestLikes.push(newestLikesDto);

      } else {
        this.extendedLikesInfo.dislikesCount++;
        this.extendedLikesInfo.like.push(newLikeDto);
      }

      return;
    }

    if (like.status === newLikeStatus) return;

    // Looking for matches in Old status and New status
    if (like.status === myStatusEnum.None && newLikeStatus === myStatusEnum.Like) {
      this.extendedLikesInfo.likesCount++;
      like.status = newLikeStatus;

      const newDate = new Date(Date.now()).toISOString();
      const newestLikesDto = {
        addedAt: newDate,
        userId: user._id.toString(),
        login: user.accountData.login
      };
      this.extendedLikesInfo.newestLikes.push(newestLikesDto);

      return;
    }
    if (like.status === myStatusEnum.None && newLikeStatus === myStatusEnum.Dislike) {
      this.extendedLikesInfo.dislikesCount++;
      like.status = newLikeStatus;
      return;
    }
    if (like.status === myStatusEnum.Like && newLikeStatus === myStatusEnum.None) {
      const newArray = this.extendedLikesInfo.newestLikes.filter(like => like.userId !== user._id.toString());
      this.extendedLikesInfo.newestLikes = newArray;
      this.extendedLikesInfo.likesCount--;
      like.status = newLikeStatus;
      return;
    }
    if (like.status === myStatusEnum.Like && newLikeStatus === myStatusEnum.Dislike) {
      const newArray = this.extendedLikesInfo.newestLikes.filter(like => like.userId !== user._id.toString());
      this.extendedLikesInfo.newestLikes = newArray;
      this.extendedLikesInfo.likesCount--;
      this.extendedLikesInfo.dislikesCount++;
      like.status = newLikeStatus;
      return;
    }
    if (like.status === myStatusEnum.Dislike && newLikeStatus === myStatusEnum.None) {
      this.extendedLikesInfo.dislikesCount--;
      like.status = newLikeStatus;
      return;
    }
    if (like.status === myStatusEnum.Dislike && newLikeStatus === myStatusEnum.Like) {
      this.extendedLikesInfo.dislikesCount--;
      this.extendedLikesInfo.likesCount++;
      like.status = newLikeStatus;

      const newDate = new Date(Date.now()).toISOString();
      const newestLikesDto = {
        addedAt: newDate,
        userId: user._id.toString(),
        login: user.accountData.login
      };
      this.extendedLikesInfo.newestLikes.push(newestLikesDto);

      return;
    }
  }

}

export const PostsSchema = SchemaFactory.createForClass(Posts);

interface PostsStatics {
  createPost(bodyPostModel: BodyPostModel, blogName: string, PostsModel: PostsModel): Posts;
}

PostsSchema.statics.createPost = Posts.createPost;
PostsSchema.methods.updatePost = Posts.prototype.updatePost;
PostsSchema.methods.createOrUpdateLike = Posts.prototype.createOrUpdateLike;


export type PostsDocument = HydratedDocument<Posts>;
export type PostsModel = Model<PostsDocument> & PostsStatics
