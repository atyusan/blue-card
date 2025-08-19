import * as Joi from 'joi';

export const validationSchema = Joi.object({
  // Database Configuration
  DATABASE_URL: Joi.string().required(),

  // JWT Configuration
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('24h'),
  JWT_ISSUER: Joi.string().default('hospital-billing-system'),
  JWT_AUDIENCE: Joi.string().default('hospital-users'),

  // Application Configuration
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  API_PREFIX: Joi.string().default('api/v1'),
  API_DOCS_PATH: Joi.string().default('api/docs'),
  APP_VERSION: Joi.string().default('1.0.0'),

  // CORS Configuration
  CORS_ORIGIN_PRODUCTION: Joi.string().optional(),
  CORS_ORIGIN_DEVELOPMENT: Joi.string().optional(),

  // Paystack Configuration
  PAYSTACK_SECRET_KEY: Joi.string().required(),
  PAYSTACK_PUBLIC_KEY: Joi.string().optional(),
  PAYSTACK_BASE_URL: Joi.string().uri().default('https://api.paystack.co'),

  // Redis Configuration
  REDIS_URL: Joi.string().uri().optional(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().default(0),

  // Email Configuration
  SMTP_HOST: Joi.string().optional(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().email().optional(),
  SMTP_PASS: Joi.string().optional(),
  SMTP_SECURE: Joi.boolean().default(false),
  SMTP_FROM: Joi.string().email().optional(),

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
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info'),
  LOG_FORMAT: Joi.string()
    .valid('combined', 'common', 'dev', 'short', 'tiny')
    .default('combined'),
  LOG_FILE_PATH: Joi.string().default('./logs/app.log'),

  // New Relic Configuration
  NEW_RELIC_ENABLED: Joi.boolean().default(true),
  NEW_RELIC_LICENSE_KEY: Joi.string().optional(),
  NEW_RELIC_APP_NAME: Joi.string().default('Hospital Billing System'),
  NEW_RELIC_SERVICE_NAME: Joi.string().default('Hospital Billing System'),
  NEW_RELIC_API_KEY: Joi.string().optional(),
  NEW_RELIC_DISTRIBUTED_TRACING_ENABLED: Joi.boolean().default(true),
  NEW_RELIC_TRANSACTION_TRACER_ENABLED: Joi.boolean().default(true),
  NEW_RELIC_TRANSACTION_TRACER_THRESHOLD: Joi.number().default(4.0),
  NEW_RELIC_TRANSACTION_TRACER_STACK_TRACE_THRESHOLD: Joi.number().default(0.5),
  NEW_RELIC_TRANSACTION_TRACER_RECORD_SQL: Joi.string()
    .valid('off', 'obfuscated', 'raw')
    .default('obfuscated'),
  NEW_RELIC_TRANSACTION_TRACER_EXPLAIN_THRESHOLD: Joi.number().default(0.5),
  NEW_RELIC_TRANSACTION_TRACER_LOG_QUERIES: Joi.boolean().default(false),
  NEW_RELIC_ERROR_COLLECTOR_ENABLED: Joi.boolean().default(true),
  NEW_RELIC_ERROR_COLLECTOR_IGNORE_ERRORS: Joi.string().allow('').optional(),
  NEW_RELIC_BROWSER_MONITORING_ENABLED: Joi.boolean().default(true),
  NEW_RELIC_APPLICATION_LOGGING_ENABLED: Joi.boolean().default(true),
  NEW_RELIC_APPLICATION_LOGGING_FORWARDING_ENABLED: Joi.boolean().default(true),
  NEW_RELIC_APPLICATION_LOGGING_METRICS_ENABLED: Joi.boolean().default(true),
  NEW_RELIC_PROXY_HOST: Joi.string().allow('').optional(),
  NEW_RELIC_PROXY_PORT: Joi.string().allow('').optional(),
  NEW_RELIC_PROXY_USER: Joi.string().allow('').optional(),
  NEW_RELIC_PROXY_PASS: Joi.string().allow('').optional(),
  NEW_RELIC_LOGGING_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug')
    .default('info'),

  // Monitoring Configuration
  MONITORING_METRICS_ENABLED: Joi.boolean().default(true),
  MONITORING_METRICS_INTERVAL: Joi.number().default(60000),
  MONITORING_SLOW_QUERY_THRESHOLD: Joi.number().default(1000),
  MONITORING_SLOW_REQUEST_THRESHOLD: Joi.number().default(5000),
  MONITORING_MEMORY_WARNING_THRESHOLD: Joi.number().default(500),

  // Validation Configuration
  VALIDATION_WHITELIST: Joi.boolean().default(true),
  VALIDATION_FORBID_NON_WHITELISTED: Joi.boolean().default(true),
  VALIDATION_TRANSFORM: Joi.boolean().default(true),
  VALIDATION_TRANSFORM_IMPLICIT: Joi.boolean().default(true),

  // Swagger Configuration
  SWAGGER_TITLE: Joi.string().default('Hospital Billing System API'),
  SWAGGER_DESCRIPTION: Joi.string().default(
    'Comprehensive API for managing hospital billing, patients, services, and payments',
  ),
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
