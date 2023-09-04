import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import {
  Users,
  UsersDocument,
  UsersModel
} from "../../application/entities/mongoose/users.schema"
import { DataSource, QueryRunner } from "typeorm"
import { InjectDataSource } from "@nestjs/typeorm"
import { AccountEntity } from "../../application/entities/sql/account.entity"
import { EmailConfirmationEntity } from "../../application/entities/sql/email-confirmation.entity"
import { BanInfoEntity } from "../../application/entities/sql/ban-info.entity"
import { SentConfirmationCodeDateEntity } from "../../application/entities/sql/sent-confirmation-code-date.entity"
import { DeviceEntity } from "../../../devices/application/entites/sql/device.entity"

interface ICreateConfirmationCodeDto {
  userId: string,
  confirmationCode: string,
  expirationDate: string,
  isConfirmed: boolean
}

interface IEmailConfirmationDto {
  emailConfirmationDto: {
    userId: string;
    confirmationCode: string | null;
    expirationDate: string | null;
    isConfirmed: boolean
  }
  queryRunner: QueryRunner
}

@Injectable()
export class UsersRepositoryOrm {
  constructor(
    @InjectDataSource() protected dataSource: DataSource
  ) {
  }

  async createUser({ login, email, passwordHash, createdAt }: any, queryRunner: QueryRunner) {
    const result = await queryRunner.manager.createQueryBuilder(AccountEntity, "a")
      .insert()
      .values({
        Login: login,
        Email: email,
        PasswordHash: passwordHash,
        CreatedAt: createdAt
      })
      .execute()
    return result.identifiers[0].UserId
  }

  async createEmailConfirmation({ emailConfirmationDto, queryRunner }: IEmailConfirmationDto) {
    await queryRunner.manager.createQueryBuilder(EmailConfirmationEntity, "e")
      .insert()
      .values({
        UserId: emailConfirmationDto.userId,
        ConfirmationCode: emailConfirmationDto.confirmationCode || "",
        ExpirationDate: emailConfirmationDto.expirationDate || "",
        IsConfirmed: emailConfirmationDto.isConfirmed
      })
      .execute()
  }

  // async createBanInfo(userId: string, queryRunner: QueryRunner) {
  //   await queryRunner.manager.createQueryBuilder(BanInfoEntity, "b")
  //     .insert()
  //     .values({
  //       UserId: userId,
  //       IsBanned: false,
  //       BanReason: "",
  //       BanDate: ""
  //     })
  //     .execute()
  // }

  async createConfirmationCode(confirmationCodeDto: ICreateConfirmationCodeDto) {
    console.log("newConfirmationCode", confirmationCodeDto.confirmationCode)
    const createResult = await this.dataSource.createQueryBuilder(EmailConfirmationEntity, "e")
      .insert()
      .values({
        UserId: confirmationCodeDto.userId,
        ConfirmationCode: confirmationCodeDto.confirmationCode,
        ExpirationDate: confirmationCodeDto.expirationDate,
        IsConfirmed: confirmationCodeDto.isConfirmed
      })
      .execute()
    return createResult ? createResult : null
  }

  async createSentConfirmCodeDate(userId: string, sentDate: string) {
    await this.dataSource.createQueryBuilder(SentConfirmationCodeDateEntity, "s")
      .insert()
      .values({
        UserId: userId,
        SentDate: sentDate
      })
      .execute()
  }

  async findUserByUserId(userId: string) {
    const user = await this.dataSource.createQueryBuilder(AccountEntity, "a")
      .select([
        `a.UserId as "userId"`,
        `a.Login as "login"`,
        `a.Email as "email"`,
        `a.PasswordHash as "passwordHash"`,
        `a.CreatedAt as "createdAt"`,
        `b.IsBanned as "isBanned"`,
        `b.BanDate as "banDate"`,
        `b.BanReason as "banReason"`,
        `c.ConfirmationCode as "confirmationCode"`,
        `c.ExpirationDate as "expirationDate"`,
        `c.IsConfirmed as "isConfirmed"`
      ])
      .leftJoin(BanInfoEntity, "b", `b.UserId = a.UserId`)
      .leftJoin(EmailConfirmationEntity, "c", `c.UserId = a.UserId`)
      .where(`a.UserId = :userId`, { userId })
      .getRawOne()
    return user ? user : null
  }

  async findUserByConfirmCode(confirmationCode: string) {
    const user = await this.dataSource.createQueryBuilder(AccountEntity, "a")
      .select([
        `a.UserId as "userId"`,
        `a.Login as "login"`,
        `a.Email as "email"`,
        `a.PasswordHash as "passwordHash"`,
        `a.CreatedAt as "createdAt"`,
        `b.IsBanned as "isBanned"`,
        `b.BanDate as "banDate"`,
        `b.BanReason as "banReason"`,
        `e.ConfirmationCode as "confirmationCode"`,
        `e.ExpirationDate as "expirationDate"`,
        `e.IsConfirmed as "isConfirmed"`
      ])
      .leftJoin(BanInfoEntity, "b", `b.UserId = a.UserId`)
      .leftJoin(EmailConfirmationEntity, "e", `e.UserId = a.UserId`)
      .where(`a.ConfirmationCode = :confirmationCode`, { confirmationCode })
      .getRawOne()
    return user ? user : null
  }

  async findUserByEmail(email: string) {
    const user = await this.dataSource.createQueryBuilder(AccountEntity, "a")
      .select([
        `a.UserId as "userId"`,
        `a.Login as "login"`,
        `a.Email as "email"`,
        `a.PasswordHash as "passwordHash"`,
        `a.CreatedAt as "createdAt"`,
        `b.IsBanned as "isBanned"`,
        `b.BanDate as "banDate"`,
        `b.BanReason as "banReason"`,
        `e.ConfirmationCode as "confirmationCode"`,
        `e.ExpirationDate as "expirationDate"`,
        `e.IsConfirmed as "isConfirmed"`
      ])
      .leftJoin(BanInfoEntity, "b", `b.UserId = a.UserId`)
      .leftJoin(EmailConfirmationEntity, "e", `e.UserId = a.UserId`)
      .where(`a.Email = :email`, { email })
      .getRawOne()
    return user ? user : null
  }

  async findUserByLoginOrEmail(userAuthData: { login: string, email: string }) {
    const foundUser = await this.dataSource.createQueryBuilder(AccountEntity, "a")
      .select([
        `a.UserId as "userId"`,
        `a.Login as "login"`,
        `a.Email as "email"`,
        `a.PasswordHash as "passwordHash"`,
        `a.CreatedAt as "createdAt"`,
        `b.IsBanned as "isBanned"`,
        `b.BanDate as "banDate"`,
        `b.BanReason as "banReason"`,
        `e.ConfirmationCode as "confirmationCode"`,
        `e.ExpirationDate as "expirationDate"`,
        `e.IsConfirmed as "isConfirmed"`
      ])
      .leftJoin(BanInfoEntity, "b", `b.UserId = a.UserId`)
      .leftJoin(EmailConfirmationEntity, "e", `e.UserId = a.UserId`)
      .where(`a.Login = :login`, { login: userAuthData.login })
      .orWhere(`a.Email = :email`, { email: userAuthData.email })
      .getRawOne()
    return foundUser.length ? foundUser[0] : null
  }

  async deleteEmailConfirmation(userId: string, queryRunner: QueryRunner) {
    const result = await queryRunner.manager.createQueryBuilder(EmailConfirmationEntity, "e")
      .delete()
      .where(`e.UserId = :userId`, { userId })
      .execute()
    return result.affected ? result.affected : null
  }

  // async deleteBanInfo(userId: string, queryRunner: QueryRunner) {
  //   const result = await queryRunner.manager.createQueryBuilder(BanInfoEntity, "b")
  //     .delete()
  //     .where(`b.UserId = :userId`, { userId })
  //     .execute()
  //   return result.affected ? result.affected : null
  // }

  async deleteSentConfirmationCodeDates(userId: string, queryRunner: QueryRunner) {
    const result = await queryRunner.manager.createQueryBuilder(SentConfirmationCodeDateEntity, "s")
      .delete()
      .where(`s.UserId = :userId`, { userId })
      .execute()
    return result.affected ? result.affected : null
  }

  async deleteDevices(userId: string, queryRunner: QueryRunner) {
    const result = await queryRunner.manager.createQueryBuilder(DeviceEntity, "d")
      .delete()
      .where(`d.UserId = :userId`, { userId })
      .execute()
    return result.affected ? result.affected : null
  }

  async deleteAccountData(userId: string, queryRunner: QueryRunner) {
    const result = await queryRunner.manager.createQueryBuilder(AccountEntity, "a")
      .delete()
      .where(`a.UserId = :userId`, { userId })
      .execute()
    return result.affected ? result.affected : null
  }

  // async updateUserBan(userId, isBanned, banReason?, banDate?) {
  //   const updateResult = isBanned
  //     ? await this.dataSource.query(`
  //       update public."ban_info_entity"
  //       set "IsBanned" = $2, "BanReason" = $3, "BanDate" = $4
  //       where "UserId" = $1
  //       `, [userId, isBanned, banReason, banDate])
  //     : await this.dataSource.query(`
  //       update public."ban_info_entity"
  //       set "IsBanned" = $2, "BanReason" = null, "BanDate" = null
  //       where "UserId" = $1
  //       `, [userId, isBanned])
  //   return updateResult.length ? updateResult[1] : null
  // }

  async updatePasswordHash(userId: string, passwordHash: string) {
    const result = await this.dataSource.createQueryBuilder(AccountEntity, "a")
      .update()
      .set({ PasswordHash: passwordHash })
      .where(`a.UserId = :userId`, { userId })
      .execute()
    return result.affected ? result.affected : null
  }

  async updateConfirmation(props: { userId: string, isConfirm: boolean }) {
    await this.dataSource.createQueryBuilder(EmailConfirmationEntity, "e")
      .update()
      .set({ IsConfirmed: props.isConfirm })
      .where(`e.UserId = :userId`, { userId: props.userId })
      .execute()
  }


}
