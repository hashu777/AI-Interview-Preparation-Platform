import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({ imports: [HealthModule, DashboardModule] })
export class AppModule {}
