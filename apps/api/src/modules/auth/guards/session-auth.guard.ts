import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { PrismaService } from '../../../infrastructure/database/prisma.service';

export interface AuthenticatedRequest extends Request { auth?: { userId: string; sessionId: string }; }
@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService, private readonly prisma: PrismaService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const bearer = request.headers.authorization?.replace(/^Bearer\s+/i, '');
    const token = request.cookies?.access_token ?? bearer;
    if (!token) throw new UnauthorizedException('Authentication is required.');
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; sid: string }>(token);
      const session = await this.prisma.session.findUnique({ where: { id: payload.sid } });
      if (!session || session.userId !== payload.sub || session.revokedAt || session.expiresAt < new Date()) throw new UnauthorizedException('Session is no longer valid.');
      request.auth = { userId: payload.sub, sessionId: payload.sid };
      return true;
    } catch { throw new UnauthorizedException('Authentication is required.'); }
  }
}
