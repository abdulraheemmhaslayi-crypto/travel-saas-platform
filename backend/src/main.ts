import { otelSDK } from './observability/otel';
otelSDK.start();

import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import helmet from 'helmet';
import compression from 'compression';
import { join } from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@common/filters/http-exception.filter';
import { LoggingInterceptor } from '@common/interceptors/logging.interceptor';
import { TransformInterceptor } from '@common/interceptors/transform.interceptor';
import { LoggerService } from '@common/services/logger.service';

async function bootstrap() {
  const logger = new LoggerService();
  
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    logger,
    rawBody: true,
    cors: {
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    },
  });

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 3000);
  const apiPrefix = configService.get<string>('API_PREFIX', '/api/v1');

  // Security
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
  }));
  app.use(compression());

  // Global pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }));

  // Global filters & interceptors
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // API prefix
  app.setGlobalPrefix(apiPrefix);

  // WebSocket adapter
  app.useWebSocketAdapter(new IoAdapter(app));

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Travel SaaS Platform API')
    .setDescription('Complete API documentation for Travel SaaS Platform')
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management')
    .addTag('Vehicles', 'Vehicle registration & management')
    .addTag('Trips', 'Trip creation & search')
    .addTag('Bookings', 'Seat booking system')
    .addTag('Payments', 'Payment processing')
    .addTag('Tracking', 'Real-time GPS tracking')
    .addTag('Admin', 'Admin dashboard APIs')
    .addTag('Fleet', 'Fleet management')
    .addTag('Analytics', 'Reports & analytics')
    .addTag('Support', 'Support tickets')
    .addTag('Notifications', 'Push/SMS/Email notifications')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  await app.listen(port);
  logger.log(`🚀 Server running on http://localhost:${port}${apiPrefix}`, 'Bootstrap');
  logger.log(`📚 API Docs available at http://localhost:${port}/api/docs`, 'Bootstrap');
}

bootstrap();