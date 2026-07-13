import { InterviewDifficulty, InterviewDomain } from '@prisma/client';
import { IsEnum, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CreateInterviewDto {
  @IsEnum(InterviewDomain) domain!: InterviewDomain;
  @IsEnum(InterviewDifficulty) difficulty!: InterviewDifficulty;
  @IsInt() @Min(5) @Max(60) durationMinutes!: number;
}

export class SaveAnswerDto {
  @IsString() @MinLength(0) @MaxLength(10000) content!: string;
}
