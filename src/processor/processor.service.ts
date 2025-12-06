import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from 'bullmq';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';
import { Upload, UploadStatus } from '../uploads/entities/upload.entity';

@Injectable()
@Processor('image-processing')
export class ProcessorService extends WorkerHost {
    constructor(
        @InjectRepository(Upload)
        private readonly uploadRepository: Repository<Upload>,
    ) {
        super();
    }

    async process(job: Job): Promise<void> {
        const { uploadId, filePath } = job.data;

        console.log(`[ProcessorService] Starting processing for upload: ${uploadId}`);
        console.log(`[ProcessorService] Original file path: ${filePath}`);

        try {
            // Update status to PROCESSING
            await this.updateUploadStatus(uploadId, UploadStatus.PROCESSING);
            console.log(`[ProcessorService] Status updated to PROCESSING`);

            // Verify original file exists
            if (!fs.existsSync(filePath)) {
                throw new Error(`Original file not found: ${filePath}`);
            }

            const fileInfo = path.parse(filePath);
            const filename = fileInfo.name;
            const ext = fileInfo.ext;

            console.log(`[ProcessorService] Processing file: ${filename}${ext}`);

            // Process 1: RESIZE - 1200px width (maintain aspect ratio)
            const resizedPath = `uploads/processed/resized/${filename}_resized${ext}`;
            await sharp(filePath)
                .resize(1200, null, {
                    withoutEnlargement: true, // Don't enlarge if smaller
                    fit: 'inside',
                })
                .toFile(resizedPath);
            console.log(`[ProcessorService] ✓ Resized image created: ${resizedPath}`);

            // Process 2: COMPRESS
            const compressedPath = `uploads/processed/compressed/${filename}_compressed${ext}`;
            const sharpInstance = sharp(filePath);

            // Apply compression based on format
            if (ext === '.jpg' || ext === '.jpeg') {
                await sharpInstance.jpeg({ quality: 80 }).toFile(compressedPath);
            } else if (ext === '.png') {
                await sharpInstance.png({ compressionLevel: 8 }).toFile(compressedPath);
            } else if (ext === '.webp') {
                await sharpInstance.webp({ quality: 80 }).toFile(compressedPath);
            } else {
                // For other formats, just copy with default compression
                await sharpInstance.toFile(compressedPath);
            }
            console.log(`[ProcessorService] ✓ Compressed image created: ${compressedPath}`);

            // Process 3: THUMBNAIL - 200x200 (cover crop, centered)
            const thumbnailPath = `uploads/processed/thumbnails/${filename}_thumb${ext}`;
            await sharp(filePath)
                .resize(200, 200, {
                    fit: 'cover',
                    position: 'center',
                })
                .toFile(thumbnailPath);
            console.log(`[ProcessorService] ✓ Thumbnail created: ${thumbnailPath}`);

            // Update database with COMPLETED status and all paths
            await this.updateUploadStatusWithPaths(uploadId, {
                status: UploadStatus.COMPLETED,
                resizedPath,
                compressedPath,
                thumbnailPath,
            });

            console.log(`[ProcessorService] ✅ Processing completed for upload: ${uploadId}`);
        } catch (error) {
            console.error(`[ProcessorService] ❌ Error processing upload ${uploadId}:`, error);

            // Update status to FAILED with error message
            await this.updateUploadStatus(
                uploadId,
                UploadStatus.FAILED,
                error.message || 'Unknown error occurred during processing',
            );
        }
    }

    /**
     * Update upload status
     */
    private async updateUploadStatus(
        uploadId: string,
        status: UploadStatus,
        errorMessage?: string,
    ): Promise<void> {
        const upload = await this.uploadRepository.findOne({
            where: { id: uploadId },
        });

        if (!upload) {
            throw new Error(`Upload with ID ${uploadId} not found`);
        }

        upload.status = status;
        if (errorMessage) {
            upload.errorMessage = errorMessage;
        }

        await this.uploadRepository.save(upload);
    }

    /**
     * Update upload status with processed paths
     */
    private async updateUploadStatusWithPaths(
        uploadId: string,
        data: {
            status: UploadStatus;
            resizedPath: string;
            compressedPath: string;
            thumbnailPath: string;
        },
    ): Promise<void> {
        const upload = await this.uploadRepository.findOne({
            where: { id: uploadId },
        });

        if (!upload) {
            throw new Error(`Upload with ID ${uploadId} not found`);
        }

        upload.status = data.status;
        upload.resizedPath = data.resizedPath;
        upload.compressedPath = data.compressedPath;
        upload.thumbnailPath = data.thumbnailPath;

        await this.uploadRepository.save(upload);
    }
}
