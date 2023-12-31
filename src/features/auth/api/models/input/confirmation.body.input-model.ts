import { Transform, TransformFnParams } from "class-transformer"
import { IsNotEmpty, IsString } from "class-validator"
import { trimValue } from "../../../../../infrastructure/decorators/trim.decorator"

export class ConfirmationBodyInputModel {
  @Transform(({ value }) => trimValue(value, "code"))
  @IsString()
  @IsNotEmpty()
  code: string
}
