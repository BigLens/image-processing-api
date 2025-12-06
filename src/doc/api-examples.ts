import { UploadStatus } from '../uploads/entities/upload.entity';

export const ApiExamples = {
    uploadResponse: {
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid', example: 'b0841b94-ecf8-442e-8563-7b3d36ff888e' },
                status: { type: 'string', enum: Object.values(UploadStatus), example: 'pending' },
                originalFilename: { type: 'string', example: 'test.png' },
                message: { type: 'string', example: 'File uploaded successfully and queued for processing' },
            },
        },
    },
    statusResponse: {
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid', example: 'b0841b94-ecf8-442e-8563-7b3d36ff888e' },
                status: { type: 'string', enum: Object.values(UploadStatus), example: 'completed' },
                originalFilename: { type: 'string', example: 'test.png' },
                createdAt: { type: 'string', format: 'date-time', example: '2025-12-06T12:15:36.273Z' },
                updatedAt: { type: 'string', format: 'date-time', example: '2025-12-06T12:15:37.474Z' },
                errorMessage: { type: 'string', nullable: true, example: null },
            },
        },
    },
    resultResponse: {
        schema: {
            type: 'object',
            properties: {
                id: { type: 'string', format: 'uuid', example: 'b0841b94-ecf8-442e-8563-7b3d36ff888e' },
                status: { type: 'string', enum: Object.values(UploadStatus), example: 'completed' },
                originalFilename: { type: 'string', example: 'test.png' },
                urls: {
                    type: 'object',
                    properties: {
                        resized: { type: 'string', example: '/files/uploads/processed/resized/uuid_resized.png' },
                        compressed: { type: 'string', example: '/files/uploads/processed/compressed/uuid_compressed.png' },
                        thumbnail: { type: 'string', example: '/files/uploads/processed/thumbnails/uuid_thumb.png' },
                    },
                },
                processedAt: { type: 'string', format: 'date-time', example: '2025-12-06T12:15:37.474Z' },
            },
        },
    },
};
