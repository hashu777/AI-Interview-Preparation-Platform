import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import type { Request } from 'express';

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', { lazyConnect: true, maxRetriesPerRequest: 1 });
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const key = `rate-limit:auth:${request.ip}:${request.route.path}`;
    try {
      if (this.redis.status === 'wait') await this.redis.connect();
      const count = await this.redis.incr(key);
      if (count === 1) await this.redis.expire(key, 60);
      if (count > 5) throw new HttpException('Too many attempts. Please try again in a minute.', HttpStatus.TOO_MANY_REQUESTS);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      // Fail open only when the development rate-limit service is unavailable.
      if (process.env.NODE_ENV === 'production') throw error;
    }
    return true;
  }
}
