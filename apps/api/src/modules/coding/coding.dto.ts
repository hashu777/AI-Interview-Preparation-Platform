import { CodingLanguage } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

export class ExecuteCodingDto {
  @IsEnum(CodingLanguage) language!: CodingLanguage;
  @IsString() @MinLength(1) @MaxLength(50000) sourceCode!: string;
}
