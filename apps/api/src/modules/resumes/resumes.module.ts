import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { LocalResumeStorageService } from '../../infrastructure/storage/local-resume-storage.service';
@Module({ imports: [AuthModule], controllers: [ResumesController], providers: [ResumesService, LocalResumeStorageService] })
export class ResumesModule {}
