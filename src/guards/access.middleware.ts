import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common"
import { Observable } from "rxjs"
import { TokensService } from "../services/tokens.service"
import { configuration } from "../configuration"
import { Request } from "express"
import { ConfigService } from "@nestjs/config"

@Injectable()
export class AccessMiddleware implements CanActivate {
  constructor(
    protected jwtCustomService: TokensService,
    protected configService: ConfigService,
  ) {
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const accessJwtSecret = this.configService.get('ACCESS_JWT_SECRET')
    const request = context.switchToHttp().getRequest()
    const token = this.extractTokenFromHeader(request)
    if (!token) return true

    const payload = await this.jwtCustomService.verifyToken(token, accessJwtSecret)
    if (payload === null) return true
    request["deviceSession"] = payload
    return true
  }

  private extractTokenFromHeader(request: Request): string | null {
    const [type, token] = request.headers.authorization?.split(" ") ?? []
    return type === "Bearer" ? token : null
  }

  // private extractTokenFromHeader(request: Request): string | undefined {
  //   const [type, token] = request.headers.authorization?.split(' ') ?? [];
  //   return type === 'Bearer' ? token : undefined;
  // }
}


// if (!request.cookies.refreshToken) {
//   throw new UnauthorizedException("refreshToken don't exist in cookies");
// }

// const deviceSession = this.jwtCustomService.verifyToken(request.cookies.refreshToken, settings.REFRESH_JWT_SECRET)
// if (deviceSession === null) {
//   throw new UnauthorizedException("refreshToken invalid or expired");
// }

// request.deviceSession = deviceSession

// return true;