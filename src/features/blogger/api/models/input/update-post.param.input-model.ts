import { IsMongoId, IsNotEmpty, IsString, MaxLength } from "class-validator"

export class UpdatePostParamInputModel {
  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  @IsMongoId()
  blogId: string

  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  postId: string
}
