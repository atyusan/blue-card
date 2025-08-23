import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from './logging.service';
import * as newrelic from 'newrelic';

@Injectable()
export class PerformanceMonitorService
  implements OnModuleInit, OnModuleDestroy
{
  private metricsInterval: NodeJS.Timeout;
  private readonly isProduction: boolean;
  private readonly metricsEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    private readonly loggingService: LoggingService,
  ) {
    this.isProduction =
      this.configService.get<string>('app.nodeEnv') === 'production';
    this.metricsEnabled =
      this.configService.get<boolean>('monitoring.metricsEnabled') ?? true;
  }

  onModuleInit() {
    if (this.metricsEnabled && this.isProduction) {
      this.startMetricsCollection();
    }
  }

  onModuleDestroy() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
    }
  }

  /**
   * Start collecting system metrics
   */
  private startMetricsCollection(): void {
    this.metricsInterval = setInterval(() => {
      this.collectSystemMetrics();
    }, 60000); // Collect metrics every minute
  }

  /**
   * Collect system performance metrics
   */
  private collectSystemMetrics(): void {
    try {
      const metrics = this.getSystemMetrics();

      // Log metrics locally
      this.loggingService.logPerformanceMetric(
        'system_memory_usage',
        metrics.memoryUsage,
        'MB',
      );

      this.loggingService.logPerformanceMetric(
        'system_cpu_usage',
        metrics.cpuUsage,
        '%',
      );

      this.loggingService.logPerformanceMetric(
        'system_uptime',
        metrics.uptime,
        'seconds',
      );

      // Send to New Relic
      if (this.isProduction && newrelic) {
        this.sendMetricsToNewRelic(metrics);
      }
    } catch (error) {
      this.loggingService.error(
        'Failed to collect system metrics',
        error.stack,
        'PERFORMANCE_MONITORING',
      );
    }
  }

  /**
   * Get current system metrics
   */
  private getSystemMetrics(): any {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      memoryUsage: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
      memoryTotal: Math.round(memUsage.heapTotal / 1024 / 1024), // MB
      memoryExternal: Math.round(memUsage.external / 1024 / 1024), // MB
      cpuUsage: process.cpuUsage(),
      uptime: Math.round(uptime),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Send metrics to New Relic
   */
  private sendMetricsToNewRelic(metrics: any): void {
    try {
      // Memory metrics
      newrelic.recordMetric(
        'Custom/System/Memory/HeapUsed',
        metrics.memoryUsage,
      );
      newrelic.recordMetric(
        'Custom/System/Memory/HeapTotal',
        metrics.memoryTotal,
      );
      newrelic.recordMetric(
        'Custom/System/Memory/External',
        metrics.memoryExternal,
      );

      // CPU metrics
      newrelic.recordMetric('Custom/System/CPU/User', metrics.cpuUsage.user);
      newrelic.recordMetric(
        'Custom/System/CPU/System',
        metrics.cpuUsage.system,
      );

      // Uptime metric
      newrelic.recordMetric('Custom/System/Uptime', metrics.uptime);

      // Custom event with all metrics
      newrelic.recordCustomEvent('SystemMetrics', {
        timestamp: metrics.timestamp,
        memoryUsage: metrics.memoryUsage,
        memoryTotal: metrics.memoryTotal,
        memoryExternal: metrics.memoryExternal,
        cpuUser: metrics.cpuUsage.user,
        cpuSystem: metrics.cpuUsage.system,
        uptime: metrics.uptime,
      });
    } catch (error) {
      this.loggingService.error(
        'Failed to send metrics to New Relic',
        error.stack,
        'NEW_RELIC_METRICS',
      );
    }
  }

  /**
   * Record custom metric
   */
  recordCustomMetric(
    name: string,
    value: number,
    attributes?: Record<string, any>,
  ): void {
    this.loggingService.logPerformanceMetric(name, value, 'units', attributes);

    if (this.isProduction && newrelic) {
      try {
        newrelic.recordMetric(`Custom/${name}`, value);

        if (attributes) {
          newrelic.recordCustomEvent('CustomMetric', {
            metric: name,
            value,
            ...attributes,
          });
        }
      } catch (error) {
        this.loggingService.error(
          `Failed to record custom metric ${name} in New Relic`,
          error.stack,
          'NEW_RELIC_METRICS',
        );
      }
    }
  }

  /**
   * Record business metric
   */
  recordBusinessMetric(
    category: string,
    operation: string,
    value: number,
    attributes?: Record<string, any>,
  ): void {
    const metricName = `Business/${category}/${operation}`;

    this.loggingService.logPerformanceMetric(
      metricName,
      value,
      'units',
      attributes,
    );

    if (this.isProduction && newrelic) {
      try {
        newrelic.recordMetric(`Custom/${metricName}`, value);

        newrelic.recordCustomEvent('BusinessMetric', {
          category,
          operation,
          value,
          ...attributes,
        });
      } catch (error) {
        this.loggingService.error(
          `Failed to record business metric ${metricName} in New Relic`,
          error.stack,
          'NEW_RELIC_METRICS',
        );
      }
    }
  }

  /**
   * Record error metric
   */
  recordErrorMetric(
    errorType: string,
    count: number = 1,
    attributes?: Record<string, any>,
  ): void {
    const metricName = `Errors/${errorType}`;

    this.loggingService.logPerformanceMetric(
      metricName,
      count,
      'count',
      attributes,
    );

    if (this.isProduction && newrelic) {
      try {
        newrelic.recordMetric(`Custom/${metricName}`, count);

        newrelic.recordCustomEvent('ErrorMetric', {
          errorType,
          count,
          ...attributes,
        });
      } catch (error) {
        this.loggingService.error(
          `Failed to record error metric ${metricName} in New Relic`,
          error.stack,
          'NEW_RELIC_METRICS',
        );
      }
    }
  }

  /**
   * Record throughput metric
   */
  recordThroughputMetric(
    operation: string,
    count: number,
    attributes?: Record<string, any>,
  ): void {
    const metricName = `Throughput/${operation}`;

    this.loggingService.logPerformanceMetric(
      metricName,
      count,
      'requests',
      attributes,
    );

    if (this.isProduction && newrelic) {
      try {
        newrelic.recordMetric(`Custom/${metricName}`, count);

        newrelic.recordCustomEvent('ThroughputMetric', {
          operation,
          count,
          ...attributes,
        });
      } catch (error) {
        this.loggingService.error(
          `Failed to record throughput metric ${metricName} in New Relic`,
          error.stack,
          'NEW_RELIC_METRICS',
        );
      }
    }
  }

  /**
   * Start custom segment for performance monitoring
   */
  async monitorOperation<T>(
    operationName: string,
    operation: () => Promise<T>,
    attributes?: Record<string, any>,
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      // Log successful operation
      this.loggingService.logPerformanceMetric(
        `Operation/${operationName}`,
        duration,
        'ms',
        { ...attributes, success: true },
      );

      // Record metric in New Relic
      if (this.isProduction && newrelic) {
        try {
          newrelic.recordMetric(`Custom/Operation/${operationName}`, duration);
        } catch (error) {
          // Silently fail for New Relic errors
        }
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Log failed operation
      this.loggingService.error(
        `Operation ${operationName} failed after ${duration}ms`,
        error.stack,
        'PERFORMANCE_MONITORING',
        { ...attributes, success: false, duration },
      );

      // Record error metric
      this.recordErrorMetric(operationName, 1, { ...attributes, duration });

      throw error;
    }
  }
}
