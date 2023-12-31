import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min
} from "class-validator"
import { Transform, Type } from "class-transformer"
import {
  PAGE_NUMBER_DEFAULT,
  PAGE_SIZE_DEFAULT,
  POSTS_CONTENT_MAX_LENGTH,
  POSTS_SHORTDESCRIPTION_MAX_LENGTH,
  POSTS_TITLE_MAX_LENGTH,
  PublishedStatus,
  SORT_BY_DEFAULT_SQL,
  SortDirectionOrm
} from "../../../../../../infrastructure/utils/constants"
import { trimValue } from "../../../../../../infrastructure/decorators/trim.decorator"


export class QuestionPublishBodyInputModelSql {
  @IsNotEmpty()
  @IsBoolean()
  published: boolean
}
