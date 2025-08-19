# 🚀 **Production-Ready Logging System with New Relic Integration**

## 📋 **Overview**

This document provides a comprehensive guide to the robust and production-ready logging system implemented in the Hospital Billing System. The system integrates Winston logging with New Relic for comprehensive application monitoring, performance tracking, and observability.

## 🏗️ **Architecture**

### **Core Components**

```
src/logging/
├── logging.service.ts           # Main logging service
├── logging.module.ts            # Logging module configuration
├── http-logging.interceptor.ts  # HTTP request/response logging
├── database-logging.interceptor.ts # Database operation logging
└── performance-monitor.service.ts  # Performance monitoring
```

### **Technology Stack**

- **Winston**: Multi-transport logging library
- **New Relic**: Application Performance Monitoring (APM)
- **Daily Rotate File**: Log file rotation and management
- **NestJS Interceptors**: Automatic logging integration

## 🔧 **Features**

### **1. Multi-Transport Logging**

- **Console**: Development-friendly colored output
- **File**: Daily rotating log files with compression
- **New Relic**: Production monitoring and alerting
- **Error Files**: Separate error and exception logging

### **2. Structured Logging**

- JSON format for machine readability
- Context-aware logging with metadata
- Request ID tracking across operations
- Sensitive data sanitization

### **3. Performance Monitoring**

- HTTP request/response timing
- Database operation performance
- Business operation tracking
- Custom metrics and thresholds

### **4. Security & Compliance**

- Sensitive data redaction
- Audit trail for business operations
- Security event logging
- GDPR-compliant data handling

## 🚀 **Quick Start**

### **1. Environment Configuration**

```bash
# .env
NEW_RELIC_ENABLED=true
NEW_RELIC_LICENSE_KEY="your-license-key"
NEW_RELIC_APP_NAME="Hospital Billing System"
NEW_RELIC_API_KEY="your-api-key"

LOG_LEVEL="info"
LOG_FILE_PATH="./logs/app.log"
MONITORING_METRICS_ENABLED=true
```

### **2. Basic Usage**

```typescript
import { LoggingService } from './logging/logging.service';

@Injectable()
export class MyService {
  constructor(private readonly loggingService: LoggingService) {}

  async processData(data: any) {
    // Basic logging
    this.loggingService.log('Processing data', 'DATA_PROCESSING', {
      dataSize: data.length,
    });

    // Business operation logging
    this.loggingService.logBusinessOperation('PROCESS', 'Data', 'batch-123', {
      userId: 'user-456',
      timestamp: new Date().toISOString(),
    });

    // Performance monitoring
    return this.loggingService.startCustomSegment(
      'DataProcessing',
      async () => {
        // Your processing logic here
        return processedData;
      },
    );
  }
}
```

## 📊 **Logging Levels**

### **Available Levels**

- **error**: Application errors and exceptions
- **warn**: Warning conditions
- **info**: General information (default)
- **debug**: Detailed debugging information
- **verbose**: Very detailed debugging information

### **Level Configuration**

```bash
# Development
LOG_LEVEL="debug"

# Production
LOG_LEVEL="info"

# Testing
LOG_LEVEL="warn"
```

## 📁 **Log File Structure**

### **File Organization**

```
logs/
├── app-2024-01-15.log          # Application logs
├── app-error-2024-01-15.log    # Error logs
├── app-access-2024-01-15.log   # HTTP access logs
├── app-exceptions-2024-01-15.log # Uncaught exceptions
└── app-rejections-2024-01-15.log # Unhandled rejections
```

### **Rotation Settings**

- **Max Size**: 20MB per file
- **Retention**: 14 days for regular logs, 30 days for errors
- **Compression**: Automatic ZIP compression
- **Date Pattern**: YYYY-MM-DD

## 🔍 **HTTP Request Logging**

### **Automatic Logging**

The `HttpLoggingInterceptor` automatically logs all HTTP requests and responses:

```typescript
// Request logging
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "message": "Incoming POST request to /api/v1/patients",
  "context": "HTTP_REQUEST_START",
  "requestId": "req_1705312200000_abc123def",
  "method": "POST",
  "url": "/api/v1/patients",
  "ip": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "headers": { /* sanitized headers */ },
  "body": { /* sanitized body */ }
}

// Response logging
{
  "timestamp": "2024-01-15T10:30:01.500Z",
  "level": "info",
  "message": "POST /api/v1/patients 201 1500ms",
  "context": "HTTP_REQUEST",
  "method": "POST",
  "endpoint": "/api/v1/patients",
  "statusCode": 201,
  "responseTime": 1500,
  "requestId": "req_1705312200000_abc123def"
}
```

### **Business Operation Detection**

The interceptor automatically detects and logs business operations:

- **Patient Operations**: CREATE, UPDATE, DELETE
- **Billing Operations**: Invoice creation, updates
- **Payment Operations**: Payment processing
- **Paystack Operations**: Payment gateway interactions

## 🗄️ **Database Logging**

### **Operation Tracking**

The `DatabaseLoggingInterceptor` monitors all database operations:

```typescript
{
  "timestamp": "2024-01-15T10:30:01.000Z",
  "level": "info",
  "message": "DB create on Patient took 150ms",
  "context": "DATABASE_OPERATION",
  "operation": "create",
  "table": "Patient",
  "duration": 150,
  "resultCount": 1,
  "success": true
}
```

### **Performance Thresholds**

- **Slow Query Warning**: Operations > 1 second
- **Performance Metrics**: Response time tracking
- **New Relic Integration**: Custom database metrics

## 📈 **Performance Monitoring**

### **System Metrics**

The `PerformanceMonitorService` collects system metrics every minute:

```typescript
{
  "memoryUsage": 245,        // MB
  "memoryTotal": 512,        // MB
  "memoryExternal": 12,      // MB
  "cpuUsage": { "user": 150, "system": 50 },
  "uptime": 86400,           // seconds
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **Custom Metrics**

```typescript
// Record custom business metrics
this.performanceMonitor.recordBusinessMetric('Billing', 'InvoiceCreated', 1, {
  amount: 5000,
  currency: 'NGN',
});

// Record error metrics
this.performanceMonitor.recordErrorMetric('PaymentFailed', 1, {
  paymentMethod: 'card',
  amount: 1000,
});

// Monitor operation performance
const result = await this.performanceMonitor.monitorOperation(
  'ComplexCalculation',
  async () => performCalculation(),
  { userId: 'user-123', complexity: 'high' },
);
```

## 🔗 **New Relic Integration**

### **Configuration**

```javascript
// newrelic.js
exports.config = {
  app_name: ['Hospital Billing System'],
  license_key: process.env.NEW_RELIC_LICENSE_KEY,
  distributed_tracing: { enabled: true },
  transaction_tracer: {
    enabled: true,
    threshold: 4.0,
    record_sql: 'obfuscated',
  },
  error_collector: { enabled: true },
  application_logging: {
    enabled: true,
    forwarding: { enabled: true },
    metrics: { enabled: true },
  },
};
```

### **Automatic Integration**

- **Transaction Tracing**: HTTP request performance
- **Error Collection**: Exception and error tracking
- **Custom Metrics**: Business and performance metrics
- **Custom Events**: Structured event data
- **Distributed Tracing**: Microservice call tracking

### **Custom Attributes**

```typescript
// Set custom attributes for the current transaction
this.loggingService.setCustomAttributes({
  userId: 'user-123',
  tenant: 'hospital-abc',
  environment: 'production',
});
```

### **Custom Segments**

```typescript
// Monitor custom business logic
const result = await this.loggingService.startCustomSegment(
  'PaymentProcessing',
  async () => {
    // Your payment processing logic
    return await processPayment(paymentData);
  },
);
```

## 🛡️ **Security Features**

### **Data Sanitization**

- **Headers**: Authorization, cookies, API keys redacted
- **Body**: Passwords, tokens, secrets redacted
- **Query Parameters**: Sensitive data filtered
- **Error Messages**: Stack traces sanitized

### **Audit Trail**

```typescript
// Log security events
this.loggingService.logSecurityEvent('LoginAttempt', 'medium', {
  userId: 'user-123',
  ip: '192.168.1.100',
  success: false,
  reason: 'Invalid credentials',
});
```

## 📊 **Monitoring & Alerting**

### **Performance Thresholds**

```bash
# Environment variables
MONITORING_SLOW_QUERY_THRESHOLD=1000      # 1 second
MONITORING_SLOW_REQUEST_THRESHOLD=5000     # 5 seconds
MONITORING_MEMORY_WARNING_THRESHOLD=500    # 500 MB
```

### **Automatic Alerts**

- **Slow Queries**: Database operations > threshold
- **Slow Requests**: HTTP requests > threshold
- **Memory Warnings**: Memory usage > threshold
- **Error Spikes**: Error rate increases

## 🔧 **Configuration Options**

### **Logging Configuration**

```bash
# Log level and format
LOG_LEVEL="info"                    # error, warn, info, debug, verbose
LOG_FORMAT="combined"               # combined, common, dev, short, tiny
LOG_FILE_PATH="./logs/app.log"      # Log file path

# File rotation
LOG_MAX_SIZE="20m"                  # Max file size
LOG_MAX_FILES="14d"                 # Retention period
```

### **New Relic Configuration**

```bash
# Basic settings
NEW_RELIC_ENABLED=true
NEW_RELIC_LICENSE_KEY="your-key"
NEW_RELIC_APP_NAME="Hospital Billing System"

# Transaction tracing
NEW_RELIC_TRANSACTION_TRACER_ENABLED=true
NEW_RELIC_TRANSACTION_TRACER_THRESHOLD=4.0
NEW_RELIC_TRANSACTION_TRACER_RECORD_SQL="obfuscated"

# Error collection
NEW_RELIC_ERROR_COLLECTOR_ENABLED=true
NEW_RELIC_ERROR_COLLECTOR_IGNORE_ERRORS="ValidationError,NotFoundError"

# Application logging
NEW_RELIC_APPLICATION_LOGGING_ENABLED=true
NEW_RELIC_APPLICATION_LOGGING_FORWARDING_ENABLED=true
```

### **Monitoring Configuration**

```bash
# Metrics collection
MONITORING_METRICS_ENABLED=true
MONITORING_METRICS_INTERVAL=60000  # 1 minute

# Performance thresholds
MONITORING_SLOW_QUERY_THRESHOLD=1000
MONITORING_SLOW_REQUEST_THRESHOLD=5000
MONITORING_MEMORY_WARNING_THRESHOLD=500
```

## 🚀 **Production Deployment**

### **1. Environment Setup**

```bash
# Production environment
NODE_ENV=production
LOG_LEVEL=info
NEW_RELIC_ENABLED=true
MONITORING_METRICS_ENABLED=true
```

### **2. Log Directory Permissions**

```bash
# Create logs directory with proper permissions
mkdir -p /var/log/hospital-billing
chown node:node /var/log/hospital-billing
chmod 755 /var/log/hospital-billing
```

### **3. Log Rotation (System Level)**

```bash
# /etc/logrotate.d/hospital-billing
/var/log/hospital-billing/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 node node
    postrotate
        systemctl reload hospital-billing
    endscript
}
```

### **4. Health Checks**

```bash
# Check log file health
ls -la /var/log/hospital-billing/
tail -f /var/log/hospital-billing/app-$(date +%Y-%m-%d).log
```

## 📊 **Dashboard & Visualization**

### **New Relic Dashboards**

- **Application Overview**: Response time, throughput, error rate
- **Database Performance**: Query performance, slow queries
- **Business Metrics**: Payment success, patient registrations
- **Infrastructure**: Memory usage, CPU utilization

### **Custom Metrics**

- **Business Operations**: Patient, billing, payment metrics
- **Performance Metrics**: Response times, throughput
- **Error Metrics**: Error types, frequency, impact
- **Security Metrics**: Login attempts, security events

## 🔍 **Troubleshooting**

### **Common Issues**

#### **1. New Relic Not Connecting**

```bash
# Check environment variables
echo $NEW_RELIC_LICENSE_KEY
echo $NEW_RELIC_APP_NAME

# Check New Relic agent logs
tail -f /var/log/newrelic/newrelic-agent.log
```

#### **2. Log Files Not Rotating**

```bash
# Check file permissions
ls -la /var/log/hospital-billing/

# Check disk space
df -h /var/log/hospital-billing/

# Manual rotation test
node -e "require('winston-daily-rotate-file')"
```

#### **3. High Memory Usage**

```bash
# Check memory usage
ps aux | grep node
free -h

# Check for memory leaks
node --inspect your-app.js
```

### **Debug Mode**

```bash
# Enable debug logging
LOG_LEVEL="debug"
NEW_RELIC_LOGGING_LEVEL="debug"

# Check interceptor logs
tail -f logs/app-debug-$(date +%Y-%m-%d).log
```

## 📚 **Best Practices**

### **1. Logging Guidelines**

- **Use appropriate levels**: error, warn, info, debug
- **Include context**: Always provide relevant metadata
- **Sanitize sensitive data**: Never log passwords, tokens, PII
- **Structured logging**: Use consistent JSON format
- **Performance impact**: Minimize logging overhead

### **2. Monitoring Guidelines**

- **Set realistic thresholds**: Based on actual performance
- **Monitor business metrics**: Track key business operations
- **Alert on anomalies**: Unusual patterns and spikes
- **Regular review**: Analyze logs and metrics regularly

### **3. Security Guidelines**

- **Audit logging**: Log all security-relevant events
- **Data protection**: Sanitize and encrypt sensitive data
- **Access control**: Restrict log file access
- **Compliance**: Meet regulatory requirements

## 🔮 **Future Enhancements**

### **Planned Features**

- **Elasticsearch Integration**: Centralized log aggregation
- **Kibana Dashboards**: Advanced log visualization
- **Machine Learning**: Anomaly detection and prediction
- **Real-time Alerts**: Instant notification system
- **Log Analytics**: Advanced pattern recognition

### **Scalability Improvements**

- **Distributed Logging**: Multi-instance log aggregation
- **Stream Processing**: Real-time log analysis
- **Cloud Integration**: AWS CloudWatch, Azure Monitor
- **Container Support**: Docker and Kubernetes logging

## 📖 **Additional Resources**

- [Winston Documentation](https://github.com/winstonjs/winston)
- [New Relic Node.js Agent](https://docs.newrelic.com/docs/agents/nodejs-agent/)
- [NestJS Interceptors](https://docs.nestjs.com/interceptors)
- [Production Logging Best Practices](https://12factor.net/logs)
- [Observability Patterns](https://microservices.io/patterns/observability/)

---

**Note**: This logging system is designed for production use with comprehensive monitoring, security, and compliance features. Always test thoroughly in staging environments before deploying to production.
