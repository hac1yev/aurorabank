import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { databaseConfig } from '../config/database.config';

export const dataSource = new DataSource({
  ...databaseConfig(),

  // Fix: Explicitly point to src for development AND dist for production
  entities: [__dirname + '/../modules/**/*.entity.{js,ts}'],

  // Also ensure your migrations path points correctly
  migrations: [__dirname + '/../database/migrations/*.{js,ts}'],

  synchronize: false,
});
