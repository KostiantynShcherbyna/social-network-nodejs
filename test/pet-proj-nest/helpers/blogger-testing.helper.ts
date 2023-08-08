import { CreateBlogBodyInputModel } from "../../../src/features/blogger/api/models/input/create-blog.body.input-model"
import request from "supertest"
import { endpoints } from "./routing.helper"
import { faker } from "@faker-js/faker"
import { CreatePostBodyInputModel } from "../../../src/features/blogger/api/models/input/create-post.body.input-model"
import {
  CreateBloggerBlogOutputModel
} from "../../../src/features/blogger/api/models/output/create-blogger-blog.output-model"
import { superUser } from "../../ht16/helpers/prepeared-data"
import { CreatePostParamInputModel } from "../../../src/features/blogger/api/models/input/create-post.param.input-model"
import {
  CreateBloggerPostOutputModel
} from "../../../src/features/blogger/api/models/output/create-blogger-post.output-model"

export class BloggerTestingHelper {
  constructor(private readonly server: any) {
  }

  private createInputBlogData() {
    return {
      name: faker.word.noun({ length: { min: 1, max: 15 } }),
      description: faker.word.words(),
      websiteUrl: faker.internet.url(),
    }
  }

  private createInputPostData() {
    return {
      title: faker.word.noun({ length: { min: 1, max: 30 } }),
      shortDescription: faker.word.words(),
      content: faker.word.words({ count: { min: 1, max: 10 } }),
    }
  }

  // BLOGS ↓↓↓
  async getBlogs(accessToken: string) {
    const response = await request(this.server)
      .get(endpoints.bloggerController.getBlogs())
      .auth(accessToken, { type: "bearer" })

    return { status: response.status, body: response.body }
  }

  async createBlog(accessToken: string) {
    const inputBlogData = this.createInputBlogData()
    const response = await request(this.server)
      .post(endpoints.bloggerController.postBlog())
      .auth(accessToken, { type: "bearer" })
      .send(inputBlogData)

    return { status: response.status, body: response.body, inputBlogData }
  }

  async createPost(accessToken: string, blogId: string) {
    const inputPostData = this.createInputPostData()
    const response = await request(this.server)
      .post(endpoints.bloggerController.postPost(blogId))
      .auth(accessToken, { type: "bearer" })
      .send(inputPostData)

    return { status: response.status, body: response.body, inputPostData }
  }

  async createBlogs(accessToken: string, countOfBlogs: number) {
    const blogsView: {
      status: number,
      body: CreateBloggerBlogOutputModel,
      inputBlogData: CreateBlogBodyInputModel
    }[] = []

    for (let i = 0; i < countOfBlogs; i++) {
      const inputBlogData = {
        name: `name${i}`,
        description: `description${i}`,
        websiteUrl: `websiteUrl${i}.com`,
      }
      const response = await request(this.server)
        .post(endpoints.bloggerController.postBlog())
        .auth(accessToken, { type: "bearer" })
        .send(inputBlogData)

      console.log("status", response.status, "body", response.body)
      blogsView.push({ status: response.status, body: response.body, inputBlogData })
    }
    console.log("blogsView", blogsView)
    return blogsView
  }

  async createPostsOfBlog(accessToken: string, blogId: string, countOfPosts: number,) {
    const posts: {
      status: number,
      body: CreateBloggerPostOutputModel,
      inputPostData: CreatePostBodyInputModel
    }[] = []
    for (let i = 0; i < countOfPosts; i++) {
      const inputPostData = {
        title: `title${i}`,
        shortDescription: `shortDescription${i}`,
        content: `content${i}`,
      }
      const response = await request(this.server)
        .post(endpoints.bloggerController.postPost(blogId))
        .auth(accessToken, { type: "bearer" })
        .send(inputPostData)
      posts.push({ status: response.status, body: response.body, inputPostData })
    }
    return posts
  }


}