import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { ProcessorService } from './processor.service';
import { Upload } from '../uploads/entities/upload.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Upload]),
    BullModule.registerQueue({
      name: 'image-processing',
    }),
  ],
  providers: [ProcessorService],
})
export class ProcessorModule { }
