import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Removes properties that are not defined in your DTO.
      forbidNonWhitelisted: true, // Instead of silently removing unknown properties, throws an error when they are sent.
      transform: true, // This tells NestJS to transform incoming request data into the DTO's expected types/classes.
    }),
  );

  const allowedOrigins = [
    'http://localhost:5173',
    process.env.FRONTEND_URL,
  ].filter((origin): origin is string => Boolean(origin));

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('AuroraBank')
    .setDescription('Aurora Bank API Description')
    .setVersion('1.0')
    .addTag('Aurora')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/api/v1/openapi', app, document);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
