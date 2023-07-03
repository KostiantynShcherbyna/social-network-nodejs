import { Injectable, Inject } from "@nestjs/common"
import { BlogsRepository } from "../blogs.repository"
import { InjectModel } from "@nestjs/mongoose"
import { queryBlogModel } from "src/models/query/queryBlogModel"
import { blogView, blogsView } from "src/views/blogView"
import { BlogsModel, Blogs } from "src/schemas/blogs.schema"
import { dtoModify } from "src/utils/modify/dtoModify"
import { Types } from "mongoose"
import { queryPostModel } from "src/models/query/queryPostModel"
import { postsView } from "src/views/postView"
import { Posts, PostsModel } from "src/schemas/posts.schema"
// import { Posts, PostsModel } from "src/schemas/posts.schema"

@Injectable()
export class PostsQueryRepository {
    constructor(
        @InjectModel(Posts.name) protected PostsModel: PostsModel,
        @Inject(BlogsRepository) protected blogsRepositoryMngs: BlogsRepository
    ) { }

    async findPosts(blogId: string, query: queryPostModel, userId?: string): Promise<null | postsView> {

        if (blogId) {
            const blog = await this.blogsRepositoryMngs.findBlog(blogId)
            if (blog === null) return null
        }

        const PAGE_SIZE_DEFAULT = 10
        const PAGE_NUMBER_DEFAULT = 1
        const SORT_BY_DEFAULT = 'createdAt'
        const SORT_DIRECTION_DEFAULT = -1

        const pageSize = +query.pageSize || PAGE_SIZE_DEFAULT
        const pageNumber = +query.pageNumber || PAGE_NUMBER_DEFAULT
        const sortBy = query.sortBy || SORT_BY_DEFAULT
        const sortDirection = query.sortDirection === "asc" ? 1 : SORT_DIRECTION_DEFAULT

        const skippedPostsCount = (pageNumber - 1) * pageSize

        const totalCount = blogId ? await this.PostsModel.countDocuments({ blogId: blogId }) : await this.PostsModel.countDocuments({})

        const pagesCount = Math.ceil(totalCount / pageSize)

        const foundedPosts = await this.PostsModel
            .find({ blogId: blogId })
            .sort({ [sortBy]: sortDirection })
            .limit(pageSize)
            .skip(skippedPostsCount)
            .lean()


        const mappedPosts = dtoModify.changePostsViewMngs(foundedPosts, userId)

        const postsView = {
            pagesCount: pagesCount,
            page: pageNumber,
            pageSize: pageSize,
            totalCount: totalCount,
            items: mappedPosts
        }

        return postsView
    }




}