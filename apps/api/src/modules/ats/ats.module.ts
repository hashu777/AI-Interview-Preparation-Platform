import { Module } from '@nestjs/common';
import { AtsController } from './ats.controller';
import { AtsService } from './ats.service';
import { AuthModule } from '../auth/auth.module';

@Module({ imports: [AuthModule], controllers: [AtsController], providers: [AtsService], exports: [AtsService] })
export class AtsModule {}
