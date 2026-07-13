import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { AuthRateLimitGuard } from './guards/auth-rate-limit.guard';

@Module({ imports: [JwtModule.register({ secret: process.env.JWT_SECRET ?? 'development-only-secret-change-me', signOptions: { expiresIn: '15m' } })], controllers: [AuthController], providers: [AuthService, PrismaService, SessionAuthGuard, AuthRateLimitGuard], exports: [AuthService, PrismaService, JwtModule, SessionAuthGuard] })
export class AuthModule {}
