import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfig } from 'src/config/database.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: () => ({
        ...databaseConfig(),
        autoLoadEntities: true,

        migrations: [__dirname + '../../database/migrations/*.{js,ts}'],
        migrationsRun: true, // ✅ auto-run migrations on app start
        synchronize: false, // ❌ never use TRUE in production
      }),
    }),
  ],
})
export class DatabaseModule {}
