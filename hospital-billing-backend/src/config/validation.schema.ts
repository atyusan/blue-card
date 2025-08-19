import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Database Configuration
  DATABASE_URL: Joi.string().required(),

  // JWT Configuration
  JWT_SECRET: Joi.string().required().min(32),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  JWT_ISSUER: Joi.string().default('hospital-billing-system'),
  JWT_AUDIENCE: Joi.string().default('hospital-users'),

  // Application Configuration
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  API_PREFIX: Joi.string().default('api/v1'),
  API_DOCS_PATH: Joi.string().default('api/docs'),

  // CORS Configuration
  CORS_ORIGIN_PRODUCTION: Joi.string().default('https://yourdomain.com'),
  CORS_ORIGIN_DEVELOPMENT: Joi.string().default('http://localhost:3000,http://localhost:3001'),

  // Paystack Integration
  PAYSTACK_SECRET_KEY: Joi.string().required(),
  PAYSTACK_PUBLIC_KEY: Joi.string().optional(),
  PAYSTACK_BASE_URL: Joi.string().uri().default('https://api.paystack.co'),

  // Redis Configuration
  REDIS_URL: Joi.string().default('redis://localhost:6379'),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').default(''),
  REDIS_DB: Joi.number().default(0),

  // Email Configuration
  SMTP_HOST: Joi.string().default('smtp.gmail.com'),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().email().optional(),
  SMTP_PASS: Joi.string().optional(),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_FROM: Joi.string().email().default('noreply@hospital.com'),

  // File Upload Configuration
  MAX_FILE_SIZE: Joi.number().default(5242880),
  UPLOAD_PATH: Joi.string().default('./uploads'),
  ALLOWED_FILE_TYPES: Joi.string().default('jpg,jpeg,png,pdf,doc,docx'),

  // Security Configuration
  BCRYPT_ROUNDS: Joi.number().default(12),
  SESSION_SECRET: Joi.string().optional(),
  SESSION_COOKIE_MAX_AGE: Joi.number().default(86400000),
  SESSION_COOKIE_SECURE: Joi.boolean().default(false),
  SESSION_COOKIE_HTTP_ONLY: Joi.boolean().default(true),

  // Rate Limiting Configuration
  RATE_LIMIT_WINDOW: Joi.number().default(900000),
  RATE_LIMIT_MAX: Joi.number().default(100),
  RATE_LIMIT_TTL: Joi.number().default(60000),
  RATE_LIMIT_LIMIT: Joi.number().default(100),

  // Logging Configuration
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  LOG_FORMAT: Joi.string().valid('combined', 'common', 'dev', 'short', 'tiny').default('combined'),
  LOG_FILE_PATH: Joi.string().default('./logs/app.log'),

  // Validation Configuration
  VALIDATION_WHITELIST: Joi.boolean().default(true),
  VALIDATION_FORBID_NON_WHITELISTED: Joi.boolean().default(true),
  VALIDATION_TRANSFORM: Joi.boolean().default(true),
  VALIDATION_TRANSFORM_IMPLICIT: Joi.boolean().default(true),

  // Swagger Configuration
  SWAGGER_TITLE: Joi.string().default('Hospital Billing System API'),
  SWAGGER_DESCRIPTION: Joi.string().default('Comprehensive API for managing hospital billing, patients, services, and payments'),
  SWAGGER_VERSION: Joi.string().default('1.0'),
  SWAGGER_PERSIST_AUTHORIZATION: Joi.boolean().default(true),

  // Database Logging Configuration
  DB_LOG_QUERY: Joi.boolean().default(false),
  DB_LOG_ERROR: Joi.boolean().default(true),
  DB_LOG_WARN: Joi.boolean().default(false),
  DB_LOG_INFO: Joi.boolean().default(false),

  // Webhook Configuration
  WEBHOOK_TIMEOUT: Joi.number().default(30000),
  WEBHOOK_MAX_RETRIES: Joi.number().default(3),
  WEBHOOK_RETRY_DELAY: Joi.number().default(5000),

  // Payment Configuration
  PAYMENT_TIMEOUT: Joi.number().default(60000),
  PAYMENT_MAX_RETRIES: Joi.number().default(3),
  PAYMENT_RETRY_DELAY: Joi.number().default(10000),

  // Notification Configuration
  NOTIFICATION_TIMEOUT: Joi.number().default(30000),
  NOTIFICATION_MAX_RETRIES: Joi.number().default(3),
  NOTIFICATION_RETRY_DELAY: Joi.number().default(5000),

  // Encryption Configuration
  ENCRYPTION_KEY: Joi.string().optional(),
  ENCRYPTION_ALGORITHM: Joi.string().default('aes-256-gcm'),
});
