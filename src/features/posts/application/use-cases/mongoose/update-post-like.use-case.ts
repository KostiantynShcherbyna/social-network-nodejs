import { CommandHandler, ICommandHandler } from "@nestjs/cqrs"
import { Types } from "mongoose"
import { PostsRepository } from "../../../repository/mongoose/posts.repository"
import { UsersRepository } from "../../../../sa/repository/mongoose/users.repository"
import { Contract } from "../../../../../infrastructure/utils/contract"
import { ErrorEnums } from "../../../../../infrastructure/utils/error-enums"


export class UpdatePostLikeCommand {
  constructor(
    public userId: string,
    public postId: string,
    public newLikeStatus: string,
  ) {
  }
}

@CommandHandler(UpdatePostLikeCommand)
export class UpdatePostLike implements ICommandHandler<UpdatePostLikeCommand> {
  constructor(
    protected postsRepository: PostsRepository,
    protected usersRepository: UsersRepository,
  ) {
  }

  async execute(comamnd: UpdatePostLikeCommand) {
    const post = await this.postsRepository.findPost(comamnd.postId)
    if (post === null) return new Contract(null, ErrorEnums.POST_NOT_FOUND)

    const userDto = ["_id", new Types.ObjectId(comamnd.userId)]
    const user = await this.usersRepository.findUser(userDto)
    if (user === null) return new Contract(null, ErrorEnums.USER_NOT_FOUND)

    // Create a new Like if there is no Like before or update Like if there is one
    post.createOrUpdateLike(user, comamnd.newLikeStatus)
    await this.postsRepository.saveDocument(post)

    return new Contract(true, null)
  }


}