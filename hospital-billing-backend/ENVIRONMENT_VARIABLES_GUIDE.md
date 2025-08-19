# Environment Variables Guide

## 🌍 **Overview**

This document provides a comprehensive guide to all environment variables used throughout the Hospital Billing System. The application has been updated to use environment variables for all configuration settings, making it more secure, flexible, and production-ready.

## 🔧 **Configuration Structure**

The application uses a centralized configuration system with the following structure:

```
src/config/
├── configuration.ts      # Main configuration loader
├── validation.schema.ts # Joi validation schema
└── index.ts            # Configuration exports
```

## 📋 **Environment Variables Reference**

### **Database Configuration**

```bash
# Required - Database connection string
DATABASE_URL="postgresql://username:password@localhost:5432/hospital_billing?schema=public"
```

### **JWT Configuration**

```bash
# Required - JWT secret key (minimum 32 characters)
JWT_SECRET="your-super-secret-jwt-key-here"

# Optional - JWT token expiration
JWT_EXPIRES_IN="24h"

# Optional - JWT issuer
JWT_ISSUER="hospital-billing-system"

# Optional - JWT audience
JWT_AUDIENCE="hospital-users"
```

### **Application Configuration**

```bash
# Optional - Server port
PORT=3000

# Optional - Node environment
NODE_ENV="development"

# Optional - API prefix
API_PREFIX="api/v1"

# Optional - API documentation path
API_DOCS_PATH="api/docs"
```

### **CORS Configuration**

```bash
# Optional - Production CORS origins
CORS_ORIGIN_PRODUCTION="https://yourdomain.com"

# Optional - Development CORS origins
CORS_ORIGIN_DEVELOPMENT="http://localhost:3000,http://localhost:3001"
```

### **Paystack Integration**

```bash
# Required - Paystack secret key
PAYSTACK_SECRET_KEY="sk_test_your_paystack_secret_key_here"

# Optional - Paystack public key
PAYSTACK_PUBLIC_KEY="pk_test_your_paystack_public_key_here"

# Optional - Paystack API base URL
PAYSTACK_BASE_URL="https://api.paystack.co"
```

### **Redis Configuration**

```bash
# Optional - Redis connection URL
REDIS_URL="redis://localhost:6379"

# Optional - Redis host
REDIS_HOST="localhost"

# Optional - Redis port
REDIS_PORT=6379

# Optional - Redis password
REDIS_PASSWORD=""

# Optional - Redis database number
REDIS_DB=0
```

### **Email Configuration**

```bash
# Optional - SMTP host
SMTP_HOST="smtp.gmail.com"

# Optional - SMTP port
SMTP_PORT=587

# Optional - SMTP username
SMTP_USER="your-email@gmail.com"

# Optional - SMTP password
SMTP_PASS="your-app-password"

# Optional - SMTP secure connection
SMTP_SECURE=false

# Optional - From email address
SMTP_FROM="noreply@hospital.com"
```

### **File Upload Configuration**

```bash
# Optional - Maximum file size in bytes
MAX_FILE_SIZE=5242880

# Optional - Upload directory path
UPLOAD_PATH="./uploads"

# Optional - Allowed file types
ALLOWED_FILE_TYPES="jpg,jpeg,png,pdf,doc,docx"
```

### **Security Configuration**

```bash
# Optional - Bcrypt rounds for password hashing
BCRYPT_ROUNDS=12

# Optional - Session secret key
SESSION_SECRET="your-session-secret-key-here"

# Optional - Session cookie max age
SESSION_COOKIE_MAX_AGE=86400000

# Optional - Secure cookies
SESSION_COOKIE_SECURE=false

# Optional - HTTP-only cookies
SESSION_COOKIE_HTTP_ONLY=true
```

### **Rate Limiting Configuration**

```bash
# Optional - Rate limit window in milliseconds
RATE_LIMIT_WINDOW=900000

# Optional - Maximum requests per window
RATE_LIMIT_MAX=100

# Optional - Rate limit TTL in milliseconds
RATE_LIMIT_TTL=60000

# Optional - Rate limit count
RATE_LIMIT_LIMIT=100
```

### **Logging Configuration**

```bash
# Optional - Log level
LOG_LEVEL="info"

# Optional - Log format
LOG_FORMAT="combined"

# Optional - Log file path
LOG_FILE_PATH="./logs/app.log"
```

### **Validation Configuration**

```bash
# Optional - Enable validation whitelist
VALIDATION_WHITELIST=true

# Optional - Forbid non-whitelisted properties
VALIDATION_FORBID_NON_WHITELISTED=true

# Optional - Enable validation transform
VALIDATION_TRANSFORM=true

# Optional - Enable implicit conversion
VALIDATION_TRANSFORM_IMPLICIT=true
```

### **Swagger Configuration**

```bash
# Optional - API title
SWAGGER_TITLE="Hospital Billing System API"

# Optional - API description
SWAGGER_DESCRIPTION="Comprehensive API for managing hospital billing, patients, services, and payments"

# Optional - API version
SWAGGER_VERSION="1.0"

# Optional - Persist authorization
SWAGGER_PERSIST_AUTHORIZATION=true
```

### **Database Logging Configuration**

```bash
# Optional - Log database queries
DB_LOG_QUERY=true

# Optional - Log database errors
DB_LOG_ERROR=true

# Optional - Log database warnings
DB_LOG_WARN=true

# Optional - Log database info
DB_LOG_INFO=false
```

### **Webhook Configuration**

```bash
# Optional - Webhook timeout in milliseconds
WEBHOOK_TIMEOUT=30000

# Optional - Maximum webhook retries
WEBHOOK_MAX_RETRIES=3

# Optional - Webhook retry delay in milliseconds
WEBHOOK_RETRY_DELAY=5000
```

### **Payment Configuration**

```bash
# Optional - Payment timeout in milliseconds
PAYMENT_TIMEOUT=60000

# Optional - Maximum payment retries
PAYMENT_MAX_RETRIES=3

# Optional - Payment retry delay in milliseconds
PAYMENT_RETRY_DELAY=10000
```

### **Notification Configuration**

```bash
# Optional - Notification timeout in milliseconds
NOTIFICATION_TIMEOUT=30000

# Optional - Maximum notification retries
NOTIFICATION_MAX_RETRIES=3

# Optional - Notification retry delay in milliseconds
NOTIFICATION_RETRY_DELAY=5000
```

### **Encryption Configuration**

```bash
# Optional - Encryption key
ENCRYPTION_KEY="your-32-character-encryption-key-here"

# Optional - Encryption algorithm
ENCRYPTION_ALGORITHM="aes-256-gcm"
```

## 🚀 **Usage Examples**

### **Development Environment**

```bash
# .env.development
NODE_ENV=development
PORT=3000
DATABASE_URL="postgresql://dev:password@localhost:5432/hospital_billing_dev"
JWT_SECRET="dev-secret-key-minimum-32-characters-long"
PAYSTACK_SECRET_KEY="sk_test_dev_key"
DB_LOG_QUERY=true
DB_LOG_WARN=true
```

### **Production Environment**

```bash
# .env.production
NODE_ENV=production
PORT=8080
DATABASE_URL="postgresql://prod:secure_password@prod-db:5432/hospital_billing_prod"
JWT_SECRET="production-secret-key-minimum-32-characters-long"
PAYSTACK_SECRET_KEY="sk_live_production_key"
CORS_ORIGIN_PRODUCTION="https://yourdomain.com,https://www.yourdomain.com"
DB_LOG_QUERY=false
DB_LOG_WARN=false
```

### **Testing Environment**

```bash
# .env.test
NODE_ENV=test
PORT=3001
DATABASE_URL="postgresql://test:password@localhost:5432/hospital_billing_test"
JWT_SECRET="test-secret-key-minimum-32-characters-long"
PAYSTACK_SECRET_KEY="sk_test_test_key"
DB_LOG_QUERY=false
DB_LOG_WARN=false
```

## 🔒 **Security Best Practices**

### **Required Variables**

- `DATABASE_URL` - Database connection string
- `JWT_SECRET` - JWT signing secret (minimum 32 characters)
- `PAYSTACK_SECRET_KEY` - Paystack API secret key

### **Sensitive Variables**

- Database credentials
- JWT secrets
- API keys
- SMTP credentials
- Encryption keys

### **Environment-Specific Variables**

- CORS origins
- Database URLs
- API endpoints
- Logging levels

## 📁 **File Structure**

### **Configuration Files**

```
src/
├── config/
│   ├── configuration.ts      # Main configuration
│   ├── validation.schema.ts # Validation schema
│   └── index.ts            # Exports
├── main.ts                 # Application bootstrap
├── app.module.ts          # Root module
└── database/
    └── prisma.service.ts  # Database service
```

### **Environment Files**

```
hospital-billing-backend/
├── .env                    # Local environment (gitignored)
├── .env.example           # Example configuration
├── .env.development       # Development environment
├── .env.production        # Production environment
└── .env.test             # Testing environment
```

## 🔍 **Configuration Access**

### **In Services**

```typescript
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MyService {
  constructor(private configService: ConfigService) {}

  getConfig() {
    // Access nested configuration
    const port = this.configService.get<number>('app.port');
    const jwtSecret = this.configService.get<string>('jwt.secret');
    const paystackKey = this.configService.get<string>('paystack.secretKey');
  }
}
```

### **In Modules**

```typescript
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        expiresIn: configService.get<string>('jwt.expiresIn'),
      }),
      inject: [ConfigService],
    }),
  ],
})
export class AuthModule {}
```

## ✅ **Validation**

The application uses Joi for environment variable validation:

- **Required variables** are validated on startup
- **Type validation** ensures correct data types
- **Default values** are provided for optional variables
- **Validation errors** prevent application startup with invalid config

## 🚨 **Error Handling**

### **Missing Required Variables**

```
Error: JWT_SECRET is not defined in configuration
Error: PAYSTACK_SECRET_KEY is required
Error: DATABASE_URL is required
```

### **Invalid Variable Types**

```
Error: PORT must be a number
Error: JWT_SECRET must be at least 32 characters long
Error: NODE_ENV must be one of [development, production, test]
```

## 🔄 **Configuration Updates**

### **Adding New Variables**

1. Add to `src/config/configuration.ts`
2. Add to `src/config/validation.schema.ts`
3. Update `.env.example`
4. Update this documentation

### **Modifying Existing Variables**

1. Update configuration files
2. Update validation schema
3. Update environment files
4. Test configuration loading

## 📊 **Monitoring & Debugging**

### **Configuration Logging**

```typescript
// Log configuration on startup
console.log('🌍 Environment:', configService.get('app.nodeEnv'));
console.log('🔗 API Base URL:', configService.get('app.apiPrefix'));
console.log('📚 Docs Path:', configService.get('app.apiDocsPath'));
```

### **Configuration Validation**

```bash
# Validate environment variables
npm run build

# Check configuration loading
npm run start:dev
```

## 🎯 **Benefits**

### **Security**

- No hardcoded secrets
- Environment-specific configurations
- Secure credential management

### **Flexibility**

- Easy environment switching
- Configurable application behavior
- Runtime configuration changes

### **Maintainability**

- Centralized configuration
- Validation and error handling
- Clear documentation

### **Production Ready**

- Environment-specific settings
- Secure defaults
- Comprehensive validation

## 📚 **Additional Resources**

- [NestJS Configuration](https://docs.nestjs.com/techniques/configuration)
- [Joi Validation](https://joi.dev/)
- [Environment Variables Best Practices](https://12factor.net/config)
- [Security Configuration Guidelines](https://owasp.org/www-project-api-security/)

---

**Note**: Always keep your `.env` files secure and never commit them to version control. Use `.env.example` as a template for other developers.
