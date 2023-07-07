import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/mongoose"
import { Types } from "mongoose"
import { BlogsModel, Blogs } from "src/schemas/blogs.schema"
import { RecoveryCodes, RecoveryCodesModel } from "src/schemas/recoveryCode.schema"

@Injectable()
export class AuthRepository {
    constructor(
        @InjectModel(RecoveryCodes.name) protected RecoveryCodesModel: RecoveryCodesModel,
    ) { }

    async findRecoveryCode(email: string) {

        const recoveryCode = await this.RecoveryCodesModel.findOne({ email: email })
        if (recoveryCode === null) return null

        return recoveryCode
    }

    async saveDocument(document: any) {

        await document.save()
    }

}