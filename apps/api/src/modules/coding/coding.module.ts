import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CodingController } from './coding.controller';
import { CodingService } from './coding.service';
import { Judge0ExecutorService } from './judge0-executor.service';

@Module({ imports: [AuthModule], controllers: [CodingController], providers: [CodingService, Judge0ExecutorService] })
export class CodingModule {}
