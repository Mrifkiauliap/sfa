import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { setupSwagger } from './common/config/swagger.config';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── CORS ─────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // ── Global Pipes ──────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Global Interceptors ───────────────────────────────────────────────────
  app.useGlobalInterceptors(new TransformInterceptor());

  // ── Swagger ───────────────────────────────────────────────────────────────
  setupSwagger(app);

  // ── Start ─────────────────────────────────────────────────────────────────
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Backend  : http://localhost:${port}`);
  console.log(`📚 Swagger  : http://localhost:${port}/docs`);
}
bootstrap();
