import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthTokenType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';

const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const token = () => randomBytes(32).toString('base64url');
@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}
  async register(input: RegisterDto) { const email = input.email.trim().toLowerCase(); if (await this.prisma.user.findUnique({ where: { email } })) throw new ConflictException('An account already exists for this email.'); const user = await this.prisma.user.create({ data: { email, name: input.name.trim(), passwordHash: await bcrypt.hash(input.password, 12) } }); const verificationToken = await this.issueToken(user.id, AuthTokenType.EMAIL_VERIFICATION); return { user: { id: user.id, email: user.email, name: user.name }, verificationToken }; }
  async login(input: LoginDto) { const user = await this.prisma.user.findUnique({ where: { email: input.email.trim().toLowerCase() } }); if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) throw new UnauthorizedException('Invalid email or password.'); const sessionToken = token(); const session = await this.prisma.session.create({ data: { userId: user.id, tokenHash: digest(sessionToken), expiresAt: new Date(Date.now() + 30 * 86400000) } }); return { accessToken: await this.jwt.signAsync({ sub: user.id, sid: session.id }), sessionToken, user: { id: user.id, name: user.name, email: user.email } }; }
  async verifyEmail(raw: string) { const row = await this.consumeToken(raw, AuthTokenType.EMAIL_VERIFICATION); await this.prisma.user.update({ where: { id: row.userId }, data: { emailVerifiedAt: new Date() } }); }
  async requestPasswordReset(emailInput: string) { const user = await this.prisma.user.findUnique({ where: { email: emailInput.trim().toLowerCase() } }); return user ? this.issueToken(user.id, AuthTokenType.PASSWORD_RESET) : undefined; }
  async resetPassword(raw: string, password: string) { const row = await this.consumeToken(raw, AuthTokenType.PASSWORD_RESET); await this.prisma.$transaction([this.prisma.user.update({ where: { id: row.userId }, data: { passwordHash: await bcrypt.hash(password, 12) } }), this.prisma.session.updateMany({ where: { userId: row.userId, revokedAt: null }, data: { revokedAt: new Date() } })]); }
  private async issueToken(userId: string, type: AuthTokenType) { const raw = token(); await this.prisma.authToken.create({ data: { userId, type, tokenHash: digest(raw), expiresAt: new Date(Date.now() + 86400000) } }); return raw; }
  private async consumeToken(raw: string, type: AuthTokenType) { const row = await this.prisma.authToken.findUnique({ where: { tokenHash: digest(raw) } }); if (!row || row.type !== type || row.consumedAt || row.expiresAt < new Date()) throw new UnauthorizedException('This link is invalid or expired.'); await this.prisma.authToken.update({ where: { id: row.id }, data: { consumedAt: new Date() } }); return row; }
}
