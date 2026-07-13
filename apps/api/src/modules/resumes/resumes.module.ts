import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ResumesController } from './resumes.controller';
import { ResumesService } from './resumes.service';
import { LocalResumeStorageService } from '../../infrastructure/storage/local-resume-storage.service';
import { AtsModule } from '../ats/ats.module';
@Module({ imports: [AuthModule, AtsModule], controllers: [ResumesController], providers: [ResumesService, LocalResumeStorageService] })
export class ResumesModule {}
