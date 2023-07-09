import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TokensService } from './services/tokens.service';
import { settings } from './settings';
import { Request } from 'express';

@Injectable()
export class RefreshGuard implements CanActivate {
  constructor(
    protected jwtCustomService: TokensService
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {

    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException('Not found token in request');
    }
    try {
      const payload = await this.jwtCustomService.verifyToken(token, settings.REFRESH_JWT_SECRET);
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
    } catch {
      throw new UnauthorizedException('Not verify token');
    }
    return true;
  }

  private extractTokenFromHeader(request: Request): string {
    return request.cookies.refreshToken;
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