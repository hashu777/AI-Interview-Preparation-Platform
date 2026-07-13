import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { InterviewQuestionService } from './interview-question.service';
import { InterviewsController } from './interviews.controller';
import { InterviewsService } from './interviews.service';

@Module({ imports: [AuthModule], controllers: [InterviewsController], providers: [InterviewsService, InterviewQuestionService], exports: [InterviewsService] })
export class InterviewsModule {}
