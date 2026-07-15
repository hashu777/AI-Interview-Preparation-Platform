import { InterviewDifficulty, InterviewDomain } from '@prisma/client';
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateInterviewDto {
  @IsEnum(InterviewDomain) domain!: InterviewDomain;
  @IsEnum(InterviewDifficulty) difficulty!: InterviewDifficulty;
  @IsInt() @Min(5) @Max(60) durationMinutes!: number;
  @IsBoolean() @IsOptional() isVoice?: boolean;
}

export class SaveAnswerDto {
  @IsString() @MinLength(0) @MaxLength(10000) content!: string;
}
