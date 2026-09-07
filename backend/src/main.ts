import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Every route starts with /api
  app.setGlobalPrefix('api');

  // Checks incoming request bodies against the DTO classes.
  // whitelist strips any extra fields the client sent that we did not ask for.
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // The browser blocks requests to a different origin unless we allow it.
  // FRONTEND_URL can list more than one address separated by commas, which is
  // useful when the same API serves both a local and a deployed frontend.
  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({ origin: allowedOrigins });

  const port = process.env.PORT ?? 4000;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}/api`);
}

void bootstrap();
