import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Upload, UploadStatus } from './entities/upload.entity';

@Injectable()
export class UploadsService {
    constructor(
        @InjectRepository(Upload)
        private readonly uploadRepository: Repository<Upload>,
        @InjectQueue('image-processing')
        private readonly imageQueue: Queue,
    ) { }

    /**
     * Create a new upload record and add job to processing queue
     */
    async createUpload(
        file: Express.Multer.File,
        filePath: string,
    ): Promise<Upload> {
        // Create upload record with PENDING status
        const upload = this.uploadRepository.create({
            originalFilename: file.originalname,
            originalPath: filePath,
            mimeType: file.mimetype,
            fileSize: file.size,
            status: UploadStatus.PENDING,
        });

        const savedUpload = await this.uploadRepository.save(upload);

        // Add job to image processing queue
        await this.imageQueue.add('process-image', {
            uploadId: savedUpload.id,
            filePath: filePath,
        });

        console.log(
            `Upload created: ${savedUpload.id}, queued for processing`,
        );

        return savedUpload;
    }

    /**
     * Get upload status by ID
     */
    async getUploadStatus(id: string): Promise<Upload> {
        const upload = await this.uploadRepository.findOne({
            where: { id },
        });

        if (!upload) {
            throw new NotFoundException(`Upload with ID ${id} not found`);
        }

        return upload;
    }

    /**
     * Get upload result (only for completed uploads)
     */
    async getUploadResult(id: string): Promise<Upload> {
        const upload = await this.uploadRepository.findOne({
            where: { id },
        });

        if (!upload) {
            throw new NotFoundException(`Upload with ID ${id} not found`);
        }

        if (upload.status !== UploadStatus.COMPLETED) {
            throw new NotFoundException(
                `Upload ${id} is not completed yet. Current status: ${upload.status}`,
            );
        }

        return upload;
    }

    /**
     * Update upload status and paths
     */
    async updateUploadStatus(
        id: string,
        status: UploadStatus,
        paths?: {
            resizedPath?: string;
            compressedPath?: string;
            thumbnailPath?: string;
        },
        errorMessage?: string,
    ): Promise<Upload> {
        const upload = await this.uploadRepository.findOne({
            where: { id },
        });

        if (!upload) {
            throw new NotFoundException(`Upload with ID ${id} not found`);
        }

        // Update status
        upload.status = status;

        // Update paths if provided
        if (paths) {
            if (paths.resizedPath) upload.resizedPath = paths.resizedPath;
            if (paths.compressedPath) upload.compressedPath = paths.compressedPath;
            if (paths.thumbnailPath) upload.thumbnailPath = paths.thumbnailPath;
        }

        // Update error message if provided
        if (errorMessage) {
            upload.errorMessage = errorMessage;
        }

        const updatedUpload = await this.uploadRepository.save(upload);

        console.log(`Upload ${id} status updated to: ${status}`);

        return updatedUpload;
    }
}
