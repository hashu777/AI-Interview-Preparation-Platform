import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './modules/health/health.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuthModule } from './modules/auth/auth.module';

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), HealthModule, DashboardModule, AuthModule] })
export class AppModule {}
