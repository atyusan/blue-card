import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private configService: ConfigService) {
    const nodeEnv = configService.get<string>('app.nodeEnv') || 'development';
    const dbLogQuery =
      configService.get<boolean>('databaseLogging.query') ??
      nodeEnv === 'development';
    const dbLogError =
      configService.get<boolean>('databaseLogging.error') ?? true;
    const dbLogWarn =
      configService.get<boolean>('databaseLogging.warn') ??
      nodeEnv === 'development';
    const dbLogInfo =
      configService.get<boolean>('databaseLogging.info') ?? false;

    const logLevels: Array<'query' | 'error' | 'warn' | 'info'> = [];
    // if (dbLogQuery) logLevels.push('query');
    if (dbLogError) logLevels.push('error');
    // if (dbLogWarn) logLevels.push('warn');
    // if (dbLogInfo) logLevels.push('info');

    super({
      log: logLevels.length > 0 ? logLevels : ['error'],
      errorFormat: 'pretty',
    });
  }

  async onModuleInit() {
    await this.$connect();
    console.log('✅ Database connected successfully');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('🔌 Database disconnected');
  }

  async cleanDatabase() {
    const nodeEnv = this.configService.get<string>('app.nodeEnv');
    if (nodeEnv === 'test') {
      const tablenames = await this.$queryRaw<
        Array<{ tablename: string }>
      >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

      const tables = tablenames
        .map(({ tablename }) => tablename)
        .filter((name) => name !== '_prisma_migrations')
        .map((name) => `"public"."${name}"`)
        .join(', ');

      try {
        await this.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
      } catch (error) {
        console.log({ error });
      }
    }
  }
}
