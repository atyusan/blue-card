import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingService } from './logging.service';
import { HttpLoggingInterceptor } from './http-logging.interceptor';
import { DatabaseLoggingInterceptor } from './database-logging.interceptor';
import { PerformanceMonitorService } from './performance-monitor.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    LoggingService,
    PerformanceMonitorService,
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpLoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: DatabaseLoggingInterceptor,
    },
  ],
  exports: [LoggingService, PerformanceMonitorService],
})
export class LoggingModule {}
