import { IsEmail, IsNotEmpty, IsString, Length, Matches } from "class-validator"
import {
  EMAIL_REGISTRATION_REGEX,
  LOGIN_MAX_LENGTH,
  LOGIN_MIN_LENGTH,
  LOGIN_REGEX,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH
} from "../../../../../infrastructure/utils/constants"
import { Transform, TransformFnParams } from "class-transformer"
import { trimValue } from "../../../../../infrastructure/decorators/trim.decorator"

export class RegistrationBodyInputModel {
  @Transform(({ value }) => trimValue(value, "login"))
  @IsString()
  @Length(LOGIN_MIN_LENGTH, LOGIN_MAX_LENGTH)
  @Matches(LOGIN_REGEX)
  login: string

  @Transform(({ value }) => trimValue(value, "password"))
  @IsString()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH)
  password: string

  @Transform(({ value }) => trimValue(value, "email"))
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Matches(EMAIL_REGISTRATION_REGEX)
  email: string
}
