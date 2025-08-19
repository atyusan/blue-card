import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import NewRelicTransport from 'winston-newrelic-logs-transport';
import * as newrelic from 'newrelic';

export interface LogContext {
  [key: string]: any;
}

export interface LogMetadata {
  userId?: string;
  requestId?: string;
  sessionId?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  database?: string;
  table?: string;
  operation?: string;
  [key: string]: any;
}

@Injectable()
export class LoggingService implements LoggerService {
  private logger: winston.Logger;
  private readonly isProduction: boolean;
  private readonly isDevelopment: boolean;
  private readonly isTest: boolean;

  constructor(private readonly configService: ConfigService) {
    this.isProduction =
      this.configService.get<string>('app.nodeEnv') === 'production';
    this.isDevelopment =
      this.configService.get<string>('app.nodeEnv') === 'development';
    this.isTest = this.configService.get<string>('app.nodeEnv') === 'test';

    this.initializeLogger();
  }

  private initializeLogger(): void {
    const logLevel = this.configService.get<string>('logging.level') || 'info';
    const logFilePath =
      this.configService.get<string>('logging.filePath') || './logs/app.log';
    const newRelicEnabled =
      this.configService.get<boolean>('newrelic.enabled') ?? true;

    // Define log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS',
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length
          ? JSON.stringify(meta, null, 2)
          : '';
        return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
      }),
    );

    // Define console format for development
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'HH:mm:ss',
      }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length
          ? JSON.stringify(meta, null, 2)
          : '';
        return `${timestamp} [${level}]: ${message} ${metaStr}`;
      }),
    );

    // Create transports array
    const transports: winston.transport[] = [];

    // Console transport (always enabled)
    transports.push(
      new winston.transports.Console({
        level: this.isDevelopment ? 'debug' : 'info',
        format: this.isDevelopment ? consoleFormat : logFormat,
        handleExceptions: true,
        handleRejections: true,
      }),
    );

    // File transport for all environments
    if (!this.isTest) {
      // Daily rotate file transport for application logs
      transports.push(
        new DailyRotateFile({
          filename: logFilePath.replace('.log', '-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          level: logLevel,
          format: logFormat,
          handleExceptions: true,
          handleRejections: true,
        }),
      );

      // Error log file
      transports.push(
        new DailyRotateFile({
          filename: logFilePath.replace('.log', '-error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '30d',
          level: 'error',
          format: logFormat,
          handleExceptions: true,
          handleRejections: true,
        }),
      );

      // Access log file for HTTP requests
      transports.push(
        new DailyRotateFile({
          filename: logFilePath.replace('.log', '-access-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          zippedArchive: true,
          maxSize: '20m',
          maxFiles: '14d',
          level: 'info',
          format: logFormat,
          handleExceptions: true,
          handleRejections: true,
        }),
      );
    }

    // New Relic transport for production
    if (newRelicEnabled && this.isProduction) {
      const licenseKey = this.configService.get<string>('newrelic.licenseKey');
      if (licenseKey) {
        try {
          const newRelicTransport = new NewRelicTransport({
            licenseKey,
            apiUrl: 'https://log-api.newrelic.com',
            level: 'info',
          });
          transports.push(newRelicTransport);
        } catch (error) {
          console.error('Failed to initialize New Relic transport:', error);
        }
      } else {
        console.warn(
          'New Relic license key not provided, skipping New Relic transport',
        );
      }
    }

    // Create the logger
    this.logger = winston.createLogger({
      level: logLevel,
      format: logFormat,
      defaultMeta: {
        service: 'hospital-billing-system',
        environment: this.configService.get<string>('app.nodeEnv'),
        version: this.configService.get<string>('app.version') || '1.0.0',
      },
      transports,
      exitOnError: false,
    });

    // Handle uncaught exceptions and unhandled rejections
    this.logger.exceptions.handle(
      new DailyRotateFile({
        filename: logFilePath.replace('.log', '-exceptions-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        format: logFormat,
      }),
    );

    this.logger.rejections.handle(
      new DailyRotateFile({
        filename: logFilePath.replace('.log', '-rejections-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        zippedArchive: true,
        maxSize: '20m',
        maxFiles: '30d',
        format: logFormat,
      }),
    );
  }

  /**
   * Log a message with the specified level
   */
  log(
    message: string,
    context?: string | LogContext,
    metadata?: LogMetadata,
  ): void {
    this.logger.info(message, this.formatLogData(context, metadata));
  }

  /**
   * Log an error message
   */
  error(
    message: string,
    trace?: string,
    context?: string | LogContext,
    metadata?: LogMetadata,
  ): void {
    const logData = this.formatLogData(context, metadata);
    if (trace) {
      logData.trace = trace;
    }

    this.logger.error(message, logData);

    // Send to New Relic if enabled
    if (this.isProduction && newrelic) {
      try {
        newrelic.noticeError(new Error(message), logData);
      } catch (error) {
        // Fallback if New Relic fails
        console.error('Failed to send error to New Relic:', error);
      }
    }
  }

  /**
   * Log a warning message
   */
  warn(
    message: string,
    context?: string | LogContext,
    metadata?: LogMetadata,
  ): void {
    this.logger.warn(message, this.formatLogData(context, metadata));
  }

  /**
   * Log a debug message
   */
  debug(
    message: string,
    context?: string | LogContext,
    metadata?: LogMetadata,
  ): void {
    this.logger.debug(message, this.formatLogData(context, metadata));
  }

  /**
   * Log a verbose message
   */
  verbose(
    message: string,
    context?: string | LogContext,
    metadata?: LogMetadata,
  ): void {
    this.logger.verbose(message, this.formatLogData(context, metadata));
  }

  /**
   * Log HTTP request information
   */
  logHttpRequest(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    metadata?: LogMetadata,
  ): void {
    const logData = this.formatLogData('HTTP_REQUEST', {
      ...metadata,
      method,
      endpoint: url,
      statusCode,
      responseTime,
    });

    // Log to access log
    this.logger.info(
      `${method} ${url} ${statusCode} ${responseTime}ms`,
      logData,
    );

    // Send performance metrics to New Relic
    if (this.isProduction && newrelic) {
      try {
        newrelic.recordMetric(`Custom/HTTP/${method}`, responseTime);
        newrelic.recordMetric(`Custom/HTTP/Status/${statusCode}`, 1);
      } catch (error) {
        // Fallback if New Relic fails
        console.error('Failed to send metrics to New Relic:', error);
      }
    }
  }

  /**
   * Log database operation
   */
  logDatabaseOperation(
    operation: string,
    table: string,
    duration: number,
    metadata?: LogMetadata,
  ): void {
    const logData = this.formatLogData('DATABASE_OPERATION', {
      ...metadata,
      operation,
      table,
      duration,
    });

    this.logger.info(`DB ${operation} on ${table} took ${duration}ms`, logData);

    // Send database metrics to New Relic
    if (this.isProduction && newrelic) {
      try {
        newrelic.recordMetric(
          `Custom/Database/${operation}/${table}`,
          duration,
        );
      } catch (error) {
        console.error('Failed to send database metrics to New Relic:', error);
      }
    }
  }

  /**
   * Log business operation
   */
  logBusinessOperation(
    operation: string,
    entity: string,
    entityId: string,
    metadata?: LogMetadata,
  ): void {
    const logData = this.formatLogData('BUSINESS_OPERATION', {
      ...metadata,
      operation,
      entity,
      entityId,
    });

    this.logger.info(
      `Business operation: ${operation} on ${entity} ${entityId}`,
      logData,
    );

    // Send business metrics to New Relic
    if (this.isProduction && newrelic) {
      try {
        newrelic.recordMetric(`Custom/Business/${operation}/${entity}`, 1);
        newrelic.recordCustomEvent('BusinessOperation', logData);
      } catch (error) {
        console.error('Failed to send business metrics to New Relic:', error);
      }
    }
  }

  /**
   * Log payment operation
   */
  logPaymentOperation(
    operation: string,
    amount: number,
    currency: string,
    paymentMethod: string,
    metadata?: LogMetadata,
  ): void {
    const logData = this.formatLogData('PAYMENT_OPERATION', {
      ...metadata,
      operation,
      amount,
      currency,
      paymentMethod,
    });

    this.logger.info(
      `Payment ${operation}: ${amount} ${currency} via ${paymentMethod}`,
      logData,
    );

    // Send payment metrics to New Relic
    if (this.isProduction && newrelic) {
      try {
        newrelic.recordMetric(
          `Custom/Payment/${operation}/${paymentMethod}`,
          amount,
        );
        newrelic.recordCustomEvent('PaymentOperation', logData);
      } catch (error) {
        console.error('Failed to send payment metrics to New Relic:', error);
      }
    }
  }

  /**
   * Log security event
   */
  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    metadata?: LogMetadata,
  ): void {
    const logData = this.formatLogData('SECURITY_EVENT', {
      ...metadata,
      event,
      severity,
    });

    this.logger.warn(`Security event: ${event} (${severity})`, logData);

    // Send security metrics to New Relic
    if (this.isProduction && newrelic) {
      try {
        newrelic.recordMetric(`Custom/Security/${event}`, 1);
        newrelic.recordCustomEvent('SecurityEvent', logData);
      } catch (error) {
        console.error('Failed to send security metrics to New Relic:', error);
      }
    }
  }

  /**
   * Log performance metric
   */
  logPerformanceMetric(
    metric: string,
    value: number,
    unit: string = 'ms',
    metadata?: LogMetadata,
  ): void {
    const logData = this.formatLogData('PERFORMANCE_METRIC', {
      ...metadata,
      metric,
      value,
      unit,
    });

    this.logger.info(`Performance: ${metric} = ${value}${unit}`, logData);

    // Send performance metrics to New Relic
    if (this.isProduction && newrelic) {
      try {
        newrelic.recordMetric(`Custom/Performance/${metric}`, value);
      } catch (error) {
        console.error(
          'Failed to send performance metrics to New Relic:',
          error,
        );
      }
    }
  }

  /**
   * Set custom attributes for New Relic
   */
  setCustomAttributes(attributes: Record<string, any>): void {
    if (this.isProduction && newrelic) {
      try {
        Object.entries(attributes).forEach(([key, value]) => {
          newrelic.addCustomAttribute(key, value);
        });
      } catch (error) {
        console.error('Failed to set custom attributes in New Relic:', error);
      }
    }
  }

  /**
   * Start a custom segment for New Relic
   */
  startCustomSegment(name: string, callback: () => Promise<any>): Promise<any> {
    if (this.isProduction && newrelic) {
      try {
        return newrelic.startSegment(name, true, callback);
      } catch (error) {
        console.error('Failed to start custom segment in New Relic:', error);
        return callback();
      }
    }
    return callback();
  }

  /**
   * Format log data for consistent structure
   */
  private formatLogData(
    context?: string | LogContext,
    metadata?: LogMetadata,
  ): any {
    const logData: any = {
      timestamp: new Date().toISOString(),
      pid: process.pid,
      memory: process.memoryUsage(),
      uptime: process.uptime(),
    };

    if (typeof context === 'string') {
      logData.context = context;
    } else if (context && typeof context === 'object') {
      Object.assign(logData, context);
    }

    if (metadata) {
      Object.assign(logData, metadata);
    }

    return logData;
  }

  /**
   * Get the underlying Winston logger
   */
  getWinstonLogger(): winston.Logger {
    return this.logger;
  }

  /**
   * Close all transports
   */
  async close(): Promise<void> {
    await this.logger.close();
  }
}
