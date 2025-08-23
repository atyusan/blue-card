// Load New Relic agent first
import 'newrelic';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Global prefix from environment variable
  const apiPrefix = configService.get<string>('app.apiPrefix') || 'api/v1';
  app.setGlobalPrefix(apiPrefix);

  // Global validation pipe with environment variable configuration
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: configService.get<boolean>('validation.whitelist') ?? true,
      forbidNonWhitelisted:
        configService.get<boolean>('validation.forbidNonWhitelisted') ?? true,
      transform: configService.get<boolean>('validation.transform') ?? true,
      transformOptions: {
        enableImplicitConversion:
          configService.get<boolean>('validation.transformImplicit') ?? true,
      },
    }),
  );

  // CORS configuration from environment variables
  const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';
  const corsOrigins =
    nodeEnv === 'production'
      ? configService.get<string>('cors.originProduction')?.split(',') || [
          'https://yourdomain.com',
        ]
      : configService.get<string>('cors.originDevelopment')?.split(',') || [
          'http://localhost:3000',
          'http://localhost:3001',
        ];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  // Swagger documentation with environment variable configuration
  const swaggerTitle =
    configService.get<string>('swagger.title') || 'Hospital Billing System API';
  const swaggerDescription =
    configService.get<string>('swagger.description') ||
    'Comprehensive API for managing hospital billing, patients, services, and payments';
  const swaggerVersion = configService.get<string>('swagger.version') || '1.0';
  const swaggerPersistAuth =
    configService.get<boolean>('swagger.persistAuthorization') ?? true;

  const config = new DocumentBuilder()
    .setTitle(swaggerTitle)
    .setDescription(swaggerDescription)
    .setVersion(swaggerVersion)
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
    .addTag('Paystack Integration', 'Paystack Terminal payment processing')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  const apiDocsPath =
    configService.get<string>('app.apiDocsPath') || 'api/docs';

  SwaggerModule.setup(apiDocsPath, app, document, {
    swaggerOptions: {
      persistAuthorization: swaggerPersistAuth,
    },
  });

  // Global exception filter
  app.useGlobalFilters();

  // Port configuration from environment variable
  const port = configService.get<number>('app.port') || 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(
    `📚 API Documentation available at: http://localhost:${port}/${apiDocsPath}`,
  );
  console.log(`🌍 Environment: ${nodeEnv}`);
  console.log(`🔗 API Base URL: ${apiPrefix}`);
}

bootstrap();
