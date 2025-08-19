export default () => ({
  // Database Configuration
  database: {
    url: process.env.DATABASE_URL,
  },

  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    issuer: process.env.JWT_ISSUER || 'hospital-billing-system',
    audience: process.env.JWT_AUDIENCE || 'hospital-users',
  },

  // Application Configuration
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    apiPrefix: process.env.API_PREFIX || 'api/v1',
    apiDocsPath: process.env.API_DOCS_PATH || 'api/docs',
  },

  // CORS Configuration
  cors: {
    originProduction: process.env.CORS_ORIGIN_PRODUCTION || 'https://yourdomain.com',
    originDevelopment: process.env.CORS_ORIGIN_DEVELOPMENT || 'http://localhost:3000,http://localhost:3001',
  },

  // Paystack Integration
  paystack: {
    secretKey: process.env.PAYSTACK_SECRET_KEY,
    publicKey: process.env.PAYSTACK_PUBLIC_KEY,
    baseUrl: process.env.PAYSTACK_BASE_URL || 'https://api.paystack.co',
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  // Email Configuration
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    secure: process.env.SMTP_SECURE === 'true',
    from: process.env.SMTP_FROM || 'noreply@hospital.com',
  },

  // File Upload Configuration
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10),
    uploadPath: process.env.UPLOAD_PATH || './uploads',
    allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
  },

  // Security Configuration
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
    sessionSecret: process.env.SESSION_SECRET,
    sessionCookieMaxAge: parseInt(process.env.SESSION_COOKIE_MAX_AGE || '86400000', 10),
    sessionCookieSecure: process.env.SESSION_COOKIE_SECURE === 'true',
    sessionCookieHttpOnly: process.env.SESSION_COOKIE_HTTP_ONLY !== 'false',
  },

  // Rate Limiting Configuration
  rateLimit: {
    window: parseInt(process.env.RATE_LIMIT_WINDOW || '900000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    ttl: parseInt(process.env.RATE_LIMIT_TTL || '60000', 10),
    limit: parseInt(process.env.RATE_LIMIT_LIMIT || '100', 10),
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'combined',
    filePath: process.env.LOG_FILE_PATH || './logs/app.log',
  },

  // Validation Configuration
  validation: {
    whitelist: process.env.VALIDATION_WHITELIST !== 'false',
    forbidNonWhitelisted: process.env.VALIDATION_FORBID_NON_WHITELISTED !== 'false',
    transform: process.env.VALIDATION_TRANSFORM !== 'false',
    transformImplicit: process.env.VALIDATION_TRANSFORM_IMPLICIT !== 'false',
  },

  // Swagger Configuration
  swagger: {
    title: process.env.SWAGGER_TITLE || 'Hospital Billing System API',
    description: process.env.SWAGGER_DESCRIPTION || 'Comprehensive API for managing hospital billing, patients, services, and payments',
    version: process.env.SWAGGER_VERSION || '1.0',
    persistAuthorization: process.env.SWAGGER_PERSIST_AUTHORIZATION !== 'false',
  },

  // Database Logging Configuration
  databaseLogging: {
    query: process.env.DB_LOG_QUERY === 'true',
    error: process.env.DB_LOG_ERROR !== 'false',
    warn: process.env.DB_LOG_WARN === 'true',
    info: process.env.DB_LOG_INFO === 'true',
  },

  // Webhook Configuration
  webhook: {
    timeout: parseInt(process.env.WEBHOOK_TIMEOUT || '30000', 10),
    maxRetries: parseInt(process.env.WEBHOOK_MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.WEBHOOK_RETRY_DELAY || '5000', 10),
  },

  // Payment Configuration
  payment: {
    timeout: parseInt(process.env.PAYMENT_TIMEOUT || '60000', 10),
    maxRetries: parseInt(process.env.PAYMENT_MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.PAYMENT_RETRY_DELAY || '10000', 10),
  },

  // Notification Configuration
  notification: {
    timeout: parseInt(process.env.NOTIFICATION_TIMEOUT || '30000', 10),
    maxRetries: parseInt(process.env.NOTIFICATION_MAX_RETRIES || '3', 10),
    retryDelay: parseInt(process.env.NOTIFICATION_RETRY_DELAY || '5000', 10),
  },

  // Encryption Configuration
  encryption: {
    key: process.env.ENCRYPTION_KEY,
    algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
  },
});
