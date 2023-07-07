import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Inject,
  Ip,
  Headers,
  Post,
  HttpStatus,
} from '@nestjs/common';
import { BodyAuthModel } from 'src/models/body/BodyAuthModel';
import { BodyNewPasswordModel } from 'src/models/body/BodyNewPasswordModel';
import { BodyPasswordRecoveryModel } from 'src/models/body/BodyPasswordRecoveryModel';
import { BodyRegistrationConfirmationModel } from 'src/models/body/BodyRegistrationConfirmationModel';
import { BodyRegistrationConfirmationResendModel } from 'src/models/body/BodyRegistrationResendModel';
import { AuthService } from 'src/services/auth.service';
import { ErrorEnums } from 'src/utils/errors/errorEnums';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) protected AuthService: AuthService) {}

  @Post('login')
  async toLogin(
    @Headers('user-agent') userAgent: string,
    @Ip() ip: string,
    @Body() bodyAuth: BodyAuthModel,
  ) {
    const tokensContract = await this.AuthService.toLogin(
      bodyAuth,
      ip,
      userAgent,
    );
    if (tokensContract.error === ErrorEnums.NOT_FOUND_USER)
      throw new BadRequestException();
    if (tokensContract.error === ErrorEnums.USER_EMAIL_NOT_CONFIRMED)
      throw new BadRequestException();
    if (tokensContract.error === ErrorEnums.PASSWORD_NOT_COMPARED)
      throw new BadRequestException();
    return tokensContract.data;
  }

  // @Post()
  // async refreshToken(
  //   @Headers('user-agent') userAgent: string,
  //   @Ip() ip: string,
  //   @Body() bodyAuthModel: bodyAuthModel,
  // ) {
  //   const tokensContract = await this.AuthService.refreshToken(bodyAuthModel, ip, userAgent)
  //   if (tokensContract.error === ErrorEnums.NOT_FOUND_USER) throw new NotFoundException()
  //   if (tokensContract.error === ErrorEnums.USER_EMAIL_NOT_CONFIRMED) throw new NotFoundException()
  //   if (tokensContract.error === ErrorEnums.PASSWORD_NOT_COMPARED) throw new NotFoundException()
  //   return tokensContract.data
  // }

  @Post('registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registration(@Body() bodyRegistration: BadRequestException) {
    const tokensContract = await this.AuthService.registration(
      bodyRegistration,
    );
    if (tokensContract.error === ErrorEnums.USER_EMAIL_EXIST)
      throw new BadRequestException();
    if (tokensContract.error === ErrorEnums.USER_LOGIN_EXIST)
      throw new BadRequestException();
    if (tokensContract.error === ErrorEnums.NOT_DELETE_USER)
      throw new BadRequestException();
    if (tokensContract.error === ErrorEnums.NOT_SEND_EMAIL)
      throw new BadRequestException();
    return;
  }

  @Post('registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmation(
    @Body() bodyRegistrationConfirmation: BodyRegistrationConfirmationModel,
  ) {
    const tokensContract = await this.AuthService.confirmation(
      bodyRegistrationConfirmation.code,
    );
    if (tokensContract.error === ErrorEnums.NOT_FOUND_USER)
      throw new BadRequestException();
    if (tokensContract.error === ErrorEnums.USER_EMAIL_CONFIRMED)
      throw new BadRequestException();
    if (tokensContract.error === ErrorEnums.CONFIRMATION_CODE_EXPIRED)
      throw new BadRequestException();
    return;
  }

  @Post('registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async confirmationResend(
    @Body()
    bodyRegistrationConfirmationResend: BodyRegistrationConfirmationResendModel,
  ) {
    const tokensContract = await this.AuthService.confirmationResend(
      bodyRegistrationConfirmationResend.email,
    );
    if (tokensContract.error === ErrorEnums.NOT_FOUND_USER)
      throw new BadRequestException();
    if (tokensContract.error === ErrorEnums.USER_EMAIL_CONFIRMED)
      throw new BadRequestException();
    if (tokensContract.error === ErrorEnums.CONFIRMATION_CODE_EXPIRED)
      throw new BadRequestException();
    return;
  }

  @Post('password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async passwordRecovery(
    @Body() bodyPasswordRecovery: BodyPasswordRecoveryModel,
  ) {
    const tokensContract = await this.AuthService.passwordRecovery(
      bodyPasswordRecovery.email,
    );
    if (tokensContract.error === ErrorEnums.RECOVERY_CODE_NOT_DELETE)
      throw new BadRequestException();
    if (tokensContract.error === ErrorEnums.NOT_SEND_EMAIL)
      throw new BadRequestException();
    return;
  }

  @Post('new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async newPassword(@Body() bodyNewPassword: BodyNewPasswordModel) {
    const tokensContract = await this.AuthService.newPassword(
      bodyNewPassword.newPassword,
      bodyNewPassword.recoveryCode,
    );
    if (tokensContract.error === ErrorEnums.TOKEN_NOT_VERIFY)
      throw new BadRequestException();
    if (tokensContract.error === ErrorEnums.RECOVERY_CODE_NOT_FOUND)
      throw new BadRequestException();
    if (tokensContract.error === ErrorEnums.RECOVERY_CODE_INVALID)
      throw new BadRequestException();
    if (tokensContract.error === ErrorEnums.NOT_FOUND_USER)
      throw new BadRequestException();
    return;
  }
}