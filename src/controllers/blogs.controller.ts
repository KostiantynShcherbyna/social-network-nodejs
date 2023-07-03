import { Body, Controller, Delete, Get, Post, Put, Query, Param, NotFoundException, HttpCode, Inject } from '@nestjs/common';
import { BlogsService } from '../services/blogs.service';
import { BlogsQueryRepository } from '../repositories/query/blogsQuery.repository';
import { bodyBlogModel } from '../models/body/bodyBlogModel';
import { queryBlogModel } from '../models/query/queryBlogModel';
import { idModel } from '../models/uri/idModel';
import { PostsQueryRepository } from 'src/repositories/query/postsQuery.repository';
import { PostsService } from 'src/services/posts.service';
import { bodyPostModel } from 'src/models/body/bodyPostModel';
import { queryPostModel } from 'src/models/query/queryPostModel';

@Controller("blogs")
export class BlogsController {
  constructor(
    @Inject(BlogsService) protected BlogsService: BlogsService,
    @Inject(BlogsQueryRepository) protected BlogsQueryRepository: BlogsQueryRepository,
    @Inject(PostsQueryRepository) protected PostsQueryRepository: PostsQueryRepository,
    @Inject(PostsService) protected PostsService: PostsService,
  ) { }

  @Get()
  async findBlogs(
    @Query() queryBlogModel: queryBlogModel,
  ) {
    return await this.BlogsQueryRepository.findBlogsView(queryBlogModel);
  }

  @Get(':id')
  async findBlog(
    @Param('id') id: string,
  ) {
    const foundBlogView = await this.BlogsQueryRepository.findBlogView(id)
    if (foundBlogView === null) throw new NotFoundException()
    return foundBlogView
  }

  @Post()
  async createBlog(
    @Body() bodyBlogModel: bodyBlogModel,
  ) {
    return await this.BlogsService.createBlog(bodyBlogModel);
  }

  @Put()
  @HttpCode(204)
  async updateBlog(
    @Param() id: string,
    @Body() bodyBlogModel: bodyBlogModel,
  ) {
    const result = await this.BlogsService.updateBlog(id, bodyBlogModel);
    if (result.error !== null) throw new NotFoundException()
    return
  }

  @Delete()
  @HttpCode(204)
  async deleteBlog(
    @Param() id: string,
  ) {
    const result = await this.BlogsService.deleteBlog(id);
    if (result.error !== null) throw new NotFoundException()
    return
  }




  @Get(':blogId/posts')
  async findPosts(
    @Param('blogId') blogId: string,
    @Query() queryPostModel: queryPostModel
  ) {
    const foundPostsView = await this.PostsQueryRepository.findPosts(blogId, queryPostModel)
    if (foundPostsView === null) throw new NotFoundException()
    return foundPostsView
  }

  @Post(':blogId/posts')
  async createPost(
    @Param('blogId') blogId: string,
    @Body() bodyPostModel: bodyPostModel,
  ) {
    const result = await this.BlogsService.createPost(bodyPostModel, blogId);
    if (result.error !== null) throw new NotFoundException()
    return
  }
}