import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix
  app.setGlobalPrefix('api/v1');

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS configuration
  app.enableCors({
    origin:
      configService.get('NODE_ENV') === 'production'
        ? ['https://yourdomain.com']
        : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  });

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Hospital Billing System API')
    .setDescription(
      'Comprehensive API for managing hospital billing, patients, services, and payments',
    )
    .setVersion('1.0')
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
    .addTag('Authentication', 'User authentication and authorization')
    .addTag('Patients', 'Patient management operations')
    .addTag('Services', 'Service catalog and pricing management')
    .addTag('Billing', 'Invoice and charge management')
    .addTag('Consultations', 'Outpatient consultation management')
    .addTag('Laboratory', 'Lab orders and test management')
    .addTag('Pharmacy', 'Prescription and medication management')
    .addTag('Admissions & Wards', 'Inpatient admission and ward management')
    .addTag('Surgical Services', 'Surgical services management')
    .addTag('Users', 'User and staff management')
    .addTag('Payment Processing', 'Payment processing and verification')
    .addTag('Reporting & Analytics', 'Financial and operational reporting')
    .addTag(
      'Cash Office Integration',
      'Cash office operations and reconciliation',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Global exception filter
  app.useGlobalFilters();

  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  console.log(
    `🚀 Hospital Billing System is running on: http://localhost:${port}`,
  );
  console.log(
    `📚 API Documentation available at: http://localhost:${port}/api/docs`,
  );
}

bootstrap();
