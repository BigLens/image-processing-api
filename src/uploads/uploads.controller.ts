import {
    Controller,
    Post,
    Get,
    Param,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
    HttpStatus,
    HttpCode,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import * as crypto from 'crypto';
import {
    ApiTags,
    ApiOperation,
    ApiConsumes,
    ApiBody,
    ApiResponse,
    ApiParam
} from '@nestjs/swagger';
import { UploadsService } from './uploads.service';
import { UploadStatus } from './entities/upload.entity';
import { ApiExamples } from '../doc/api-examples';

@ApiTags('uploads')
@Controller('upload')
export class UploadsController {
    constructor(private readonly uploadsService: UploadsService) { }

    /**
     * POST /upload - Upload an image file
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Upload an image file', description: 'Uploads an image (jpg, png, gif, webp) for processing.' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file to upload',
                },
            },
        },
    })
    @ApiResponse({
        status: 201,
        description: 'File uploaded successfully',
        schema: ApiExamples.uploadResponse.schema,
    })
    @ApiResponse({ status: 400, description: 'Bad Request (Invalid file type or no file)' })
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads/original',
                filename: (req, file, callback) => {
                    const uniqueName = `${crypto.randomUUID()}${extname(file.originalname)}`;
                    callback(null, uniqueName);
                },
            }),
            fileFilter: (req, file, callback) => {
                // Only accept image files
                const allowedMimeTypes = [
                    'image/jpeg',
                    'image/jpg',
                    'image/png',
                    'image/gif',
                    'image/webp',
                ];

                if (allowedMimeTypes.includes(file.mimetype)) {
                    callback(null, true);
                } else {
                    callback(
                        new BadRequestException(
                            'Invalid file type. Only image files (jpg, jpeg, png, gif, webp) are allowed.',
                        ),
                        false,
                    );
                }
            },
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB max
            },
        }),
    )
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const filePath = `uploads/original/${file.filename}`;
        const upload = await this.uploadsService.createUpload(file, filePath);

        return {
            id: upload.id,
            status: upload.status,
            originalFilename: upload.originalFilename,
            message: 'File uploaded successfully and queued for processing',
        };
    }

    /**
     * GET /upload/:id/status - Get upload status
     */
    @Get(':id/status')
    @ApiOperation({ summary: 'Get upload status', description: 'Retrieve the current processing status of an uploaded file.' })
    @ApiParam({ name: 'id', description: 'Upload ID', type: 'string', format: 'uuid' })
    @ApiResponse({
        status: 200,
        description: 'Current status details',
        schema: ApiExamples.statusResponse.schema,
    })
    @ApiResponse({ status: 404, description: 'Upload not found' })
    async getUploadStatus(@Param('id') id: string) {
        const upload = await this.uploadsService.getUploadStatus(id);

        return {
            id: upload.id,
            status: upload.status,
            originalFilename: upload.originalFilename,
            createdAt: upload.createdAt,
            updatedAt: upload.updatedAt,
            errorMessage: upload.errorMessage,
        };
    }

    /**
     * GET /upload/:id/result - Get processed image URLs
     */
    @Get(':id/result')
    @ApiOperation({ summary: 'Get processed results', description: 'Retrieve URLs for the processed image variants (resized, compressed, thumbnail).' })
    @ApiParam({ name: 'id', description: 'Upload ID', type: 'string', format: 'uuid' })
    @ApiResponse({
        status: 200,
        description: 'Processing results',
        schema: ApiExamples.resultResponse.schema,
    })
    @ApiResponse({ status: 404, description: 'Upload not found' })
    async getUploadResult(@Param('id') id: string) {
        const upload = await this.uploadsService.getUploadResult(id);

        return {
            id: upload.id,
            status: upload.status,
            originalFilename: upload.originalFilename,
            urls: {
                resized: upload.resizedPath
                    ? `/files/${upload.resizedPath.replace(/\\/g, '/')}`
                    : null,
                compressed: upload.compressedPath
                    ? `/files/${upload.compressedPath.replace(/\\/g, '/')}`
                    : null,
                thumbnail: upload.thumbnailPath
                    ? `/files/${upload.thumbnailPath.replace(/\\/g, '/')}`
                    : null,
            },
            processedAt: upload.updatedAt,
        };
    }
}
