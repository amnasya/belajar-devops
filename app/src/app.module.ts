import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthModule } from './health/health.module.js';
import { MetricsModule } from './metrics/metrics.module.js';
import { TasksModule } from './tasks/tasks.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST', 'localhost'),
        port: Number(config.get<string>('DB_PORT', '5432')),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'tasks'),
        autoLoadEntities: true,
        // Shortcut belajar: skema dibuat otomatis, tanpa migrasi.
        synchronize: true,
        // Postgres mungkin belum siap saat app start (Compose/K8s): coba ulang.
        retryAttempts: 20,
        retryDelay: 3000,
      }),
    }),
    ServeStaticModule.forRoot({
      rootPath: join(import.meta.dirname, '..', 'public'),
      exclude: ['/tasks', '/tasks/*path', '/health', '/metrics'],
    }),
    TasksModule,
    HealthModule,
    MetricsModule,
  ],
})
export class AppModule {}
