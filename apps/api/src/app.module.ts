import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuthModule } from './modules/auth/auth.module';
import { ResumesModule } from './modules/resumes/resumes.module';
import { AtsModule } from './modules/ats/ats.module';
import { InterviewsModule } from './modules/interviews/interviews.module';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), HealthModule, DashboardModule, AuthModule, ResumesModule, AtsModule, InterviewsModule] })
export class AppModule {}
