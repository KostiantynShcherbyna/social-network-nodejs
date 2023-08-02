import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { InjectModel } from "@nestjs/mongoose/dist/common"
import { Contract } from "src/infrastructure/utils/contract"
import { BlogsRepository } from "src/features/blogs/infrastructure/blogs.repository"
import { Blogs, BlogsModel } from "src/infrastructure/schemas/blogs.schema"
import { Posts, PostsModel } from "src/infrastructure/schemas/posts.schema"
import { ErrorEnums } from "src/infrastructure/utils/error-enums"


export class DeleteBlogCommand {
  constructor(
    public blogId: string,
    public userId: string
  ) {
  }
}

@CommandHandler(DeleteBlogCommand)
export class DeleteBlogBlogger implements ICommandHandler<DeleteBlogCommand> {
  constructor(
    @InjectModel(Blogs.name) protected BlogsModel: BlogsModel,
    @InjectModel(Posts.name) protected PostsModel: PostsModel,
    protected blogsRepository: BlogsRepository,
  ) {
  }

  async execute(command: DeleteBlogCommand): Promise<Contract<null | boolean>> {

    const foundBlog = await this.blogsRepository.findBlog(command.blogId)
    if (foundBlog === null) return new Contract(null, ErrorEnums.BLOG_NOT_FOUND)
    if (foundBlog.blogOwnerInfo.userId !== command.userId) return new Contract(null, ErrorEnums.FOREIGN_BLOG)

    const deleteBlogContract = await Blogs.deleteBlog(
      command.blogId,
      this.BlogsModel,
      this.PostsModel
    )
    if (deleteBlogContract.error !== null)
      return new Contract(null, deleteBlogContract.error)

    return new Contract(true, null)
  }
}