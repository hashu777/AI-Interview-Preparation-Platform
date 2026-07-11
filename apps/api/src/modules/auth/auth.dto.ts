import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
export class RegisterDto { @IsString() @MinLength(2) @MaxLength(100) name!: string; @IsEmail() email!: string; @IsString() @MinLength(12) @MaxLength(128) password!: string; }
export class LoginDto { @IsEmail() email!: string; @IsString() password!: string; }
export class TokenDto { @IsString() @MinLength(20) token!: string; }
export class ForgotPasswordDto { @IsEmail() email!: string; }
export class ResetPasswordDto extends TokenDto { @IsString() @MinLength(12) @MaxLength(128) password!: string; }
