import { Body, Controller, Get, Param, Post, Req, UploadedFile, UseGuards, UseInterceptors, UnsupportedMediaTypeException } from '@nestjs/common';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { FileInterceptor } from '@nestjs/platform-express';
import type { AuthenticatedRequest } from '../auth/guards/session-auth.guard';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { ResumesService } from './resumes.service';
class CreateResumeDto { @IsString() @MinLength(1) @MaxLength(120) title!: string; }
@Controller('resumes') @UseGuards(SessionAuthGuard)
export class ResumesController {
  constructor(private readonly resumes: ResumesService) {}
  @Get() list(@Req() request: AuthenticatedRequest) { return this.resumes.list(request.auth!.userId); }
  @Post() create(@Req() request: AuthenticatedRequest, @Body() input: CreateResumeDto) { return this.resumes.create(request.auth!.userId, input.title); }
  @Post(':resumeId/versions') @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_request, file, done) => done(file.mimetype === 'application/pdf' ? null : new UnsupportedMediaTypeException('Only PDF files are supported.'), file.mimetype === 'application/pdf') }))
  addVersion(@Req() request: AuthenticatedRequest, @UploadedFile() file: { originalname: string; mimetype: string; size: number; buffer: Buffer } | undefined, @Param('resumeId') resumeId: string) { if (!file) throw new UnsupportedMediaTypeException('A PDF file is required.'); return this.resumes.addVersion(request.auth!.userId, resumeId, { originalName: file.originalname, mimeType: file.mimetype, size: file.size, buffer: file.buffer }); }
  @Post('versions/:versionId/extract') extract(@Req() request: AuthenticatedRequest, @Param('versionId') versionId: string) { return this.resumes.extractText(request.auth!.userId, versionId); }
}
