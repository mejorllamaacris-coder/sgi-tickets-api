import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 1. CORS habilitado para que el frontend pueda consumir la API
  app.enableCors({
    origin: true, // En producción, cambiar por el dominio real del frontend
    credentials: true,
  });

  // 2. Validación Global: Transforma y valida todos los DTOs automáticamente
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades que no están en el DTO
      forbidNonWhitelisted: true, // Rechaza la petición si hay propiedades extra
      transform: true, // Transforma tipos (ej: string a number)
    }),
  );

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 SGI Tickets API corriendo en: http://localhost:${port}`);
}
bootstrap();
