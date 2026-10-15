import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { REDIS_CLIENT } from 'src/shared/constants/redis.constants';
import Redis from 'ioredis';

@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        return new Redis({
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT) || 6379,
          // password: process.env.REDIS_PASSWORD, // in production password usage is mandatory
          retryStrategy: (times) => Math.min(times * 500, 2000),
        });
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
