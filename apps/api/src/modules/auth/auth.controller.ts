import { Body, Controller, HttpCode, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto, TokenDto } from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}
  @Post('register') async register(@Body() input: RegisterDto) { return this.auth.register(input); }
  @Post('login') @HttpCode(200) async login(@Body() input: LoginDto, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(input);
    const secure = process.env.NODE_ENV === 'production';
    response.cookie('access_token', result.accessToken, { httpOnly: true, sameSite: 'lax', secure, maxAge: 15 * 60 * 1000, path: '/' });
    response.cookie('session_token', result.sessionToken, { httpOnly: true, sameSite: 'lax', secure, maxAge: 30 * 86400000, path: '/' });
    return { user: result.user };
  }
  @Post('verify-email') @HttpCode(204) async verifyEmail(@Body() input: TokenDto) { await this.auth.verifyEmail(input.token); }
  @Post('forgot-password') @HttpCode(200) async forgotPassword(@Body() input: ForgotPasswordDto) { const token = await this.auth.requestPasswordReset(input.email); return { message: 'If an account exists, a reset link has been sent.', ...(process.env.NODE_ENV === 'production' ? {} : { resetToken: token }) }; }
  @Post('reset-password') @HttpCode(204) async resetPassword(@Body() input: ResetPasswordDto) { await this.auth.resetPassword(input.token, input.password); }
}
