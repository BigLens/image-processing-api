import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UploadsModule } from './uploads/uploads.module';
import { ProcessorModule } from './processor/processor.module';
import { config } from './config/config';

@Module({
  imports: [
    // TypeORM Configuration for PostgreSQL
    TypeOrmModule.forRoot({
      type: config.database.type,
      host: config.database.host,
      port: config.database.port,
      username: config.database.username,
      password: config.database.password,
      database: config.database.database,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // For development only
    }),
    // BullMQ Configuration for Redis
    BullModule.forRoot({
      connection: {
        host: config.redis.host,
        port: config.redis.port,
      },
    }),
    // BullMQ queues configured in individual modules
    UploadsModule,
    ProcessorModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
