import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Student Finance Analyzer API')
    .setDescription(
      'REST API untuk manajemen keuangan mahasiswa — autentikasi, transaksi, dan analisis.',
    )
    .setVersion('1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      name: 'Authorization',
      description: 'Masukkan JWT token',
      in: 'header',
    })
    .addTag('Auth', 'Registrasi, login, refresh token, dan info user')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true, // token tetap tersimpan saat refresh halaman
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });
}
