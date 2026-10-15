import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { RegistrationModule } from './modules/registration/registration.module';
import { DatabaseModule } from './modules/database/database.module';
import { ConfigModule } from '@nestjs/config';
import { RedisModule } from './shared/modules/redis/redis.module';
import { MailService } from './shared/modules/mail/mail.service';
import { MailModule } from './shared/modules/mail/mail.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // without this we have to import ConfigModule inside every Module
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    RegistrationModule,
    DatabaseModule,
    RedisModule,
    MailModule,
  ],
  controllers: [AppController],
  providers: [AppService, MailService],
})
export class AppModule {}
