# Image Processing API

A robust NestJS-based image processing service with background job processing using BullMQ. Upload images and get them automatically processed with resizing, compression, and thumbnail generation.

## 🚀 Features

- **Image Upload**: Upload images via REST API (JPEG, PNG, GIF, WebP)
- **Background Processing**: Asynchronous image processing using BullMQ and Redis
- **Multiple Outputs**: 
  - Resized version (1200px width, maintains aspect ratio)
  - Compressed version (optimized for web)
  - Thumbnail (200x200px, cover crop)
- **Status Tracking**: Check processing status in real-time
- **Result Retrieval**: Get URLs to all processed images
- **Dockerized**: Complete Docker setup for easy deployment

## 📋 Prerequisites

- **Docker** (version 20.10 or higher)
- **Docker Compose** (version 2.0 or higher)

That's it! Everything else runs in containers.

## 🛠️ Technology Stack

- **NestJS** - Progressive Node.js framework
- **BullMQ** - Background job processing
- **Redis** - Queue management and caching
- **PostgreSQL** - Database for upload metadata
- **Sharp** - High-performance image processing
- **TypeORM** - Database ORM
- **Docker** - Containerization

## 📦 Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd image-processing-api
```

2. **Start all services with Docker Compose:**
```bash
docker-compose up --build
```

This will start:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **NestJS API** on port 3000

## 🎯 Usage

### Start Services
```bash
# Start all services (detached mode)
docker-compose up -d

# Start with build
docker-compose up --build

# View logs
docker-compose logs -f app
```

### Stop Services
```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

## 📡 API Endpoints

### 1. Upload Image
Upload an image file for processing.

**Endpoint:** `POST /upload`

**Request:**
```bash
curl -X POST http://localhost:3000/upload \
  -F "file=@/path/to/your/image.jpg"
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "PENDING",
  "originalFilename": "image.jpg",
  "message": "File uploaded successfully and queued for processing"
}
```

**Constraints:**
- Field name: `file`
- Max size: 10MB
- Allowed formats: JPEG, JPG, PNG, GIF, WebP

---

### 2. Check Upload Status
Get the current processing status of an upload.

**Endpoint:** `GET /upload/:id/status`

**Request:**
```bash
curl http://localhost:3000/upload/550e8400-e29b-41d4-a716-446655440000/status
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED",
  "originalFilename": "image.jpg",
  "createdAt": "2024-12-06T00:00:00.000Z",
  "updatedAt": "2024-12-06T00:00:10.000Z",
  "errorMessage": null
}
```

**Status Values:**
- `PENDING` - Upload received, waiting for processing
- `PROCESSING` - Currently being processed
- `COMPLETED` - Processing finished successfully
- `FAILED` - Processing failed (check errorMessage)

---

### 3. Get Processed Images
Retrieve URLs for all processed image versions.

**Endpoint:** `GET /upload/:id/result`

**Request:**
```bash
curl http://localhost:3000/upload/550e8400-e29b-41d4-a716-446655440000/result
```

**Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "COMPLETED",
  "originalFilename": "image.jpg",
  "urls": {
    "resized": "/files/uploads/processed/resized/550e8400-e29b-41d4-a716-446655440000_resized.jpg",
    "compressed": "/files/uploads/processed/compressed/550e8400-e29b-41d4-a716-446655440000_compressed.jpg",
    "thumbnail": "/files/uploads/processed/thumbnails/550e8400-e29b-41d4-a716-446655440000_thumb.jpg"
  },
  "processedAt": "2024-12-06T00:00:10.000Z"
}
```

**Note:** This endpoint only returns results for uploads with `COMPLETED` status.

---

### 4. Access Processed Files
Processed images are served as static files.

**URL Pattern:** `http://localhost:3000/files/uploads/processed/{type}/{filename}`

**Example:**
```bash
# View in browser or download
http://localhost:3000/files/uploads/processed/resized/550e8400-e29b-41d4-a716-446655440000_resized.jpg
http://localhost:3000/files/uploads/processed/compressed/550e8400-e29b-41d4-a716-446655440000_compressed.jpg
http://localhost:3000/files/uploads/processed/thumbnails/550e8400-e29b-41d4-a716-446655440000_thumb.jpg
```

## 🐳 Docker Architecture

### Services

1. **postgres** (postgres:15-alpine)
   - Database for upload metadata
   - Port: 5432
   - Volume: `postgres-data` for persistence

2. **redis** (redis:7-alpine)
   - Queue management for BullMQ
   - Port: 6379

3. **app** (NestJS application)
   - Main API server
   - Port: 3000
   - Volumes:
     - `./src:/app/src` - Hot reload in development
     - `./uploads:/app/uploads` - Persistent file storage

### Environment Variables

The following environment variables are configured in `docker-compose.yml`:

```yaml
# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379

# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=image_processing

# Application
NODE_ENV=development
```

## 🔧 Development

### Hot Reload
Source code changes are automatically detected thanks to volume mounting:
```yaml
volumes:
  - ./src:/app/src
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f app
docker-compose logs -f redis
docker-compose logs -f postgres
```

### Access Container Shell
```bash
# App container
docker-compose exec app sh

# PostgreSQL
docker-compose exec postgres psql -U postgres -d image_processing

# Redis
docker-compose exec redis redis-cli
```

## 🧪 Testing

### Complete Workflow Test

1. **Start services:**
```bash
docker-compose up --build
```

2. **Upload an image:**
```bash
curl -X POST http://localhost:3000/upload \
  -F "file=@test-image.jpg"
```
Save the returned `id`.

3. **Check status immediately:**
```bash
curl http://localhost:3000/upload/{id}/status
```
Should show `PENDING` or `PROCESSING`.

4. **Wait 5-10 seconds, then check again:**
```bash
curl http://localhost:3000/upload/{id}/status
```
Should show `COMPLETED`.

5. **Get processed image URLs:**
```bash
curl http://localhost:3000/upload/{id}/result
```

6. **View images in browser:**
```
http://localhost:3000/files/uploads/processed/resized/{filename}
http://localhost:3000/files/uploads/processed/compressed/{filename}
http://localhost:3000/files/uploads/processed/thumbnails/{filename}
```

## 🐛 Troubleshooting

### Redis Connection Issues
```bash
# Check if Redis is running
docker-compose ps redis

# Check Redis logs
docker-compose logs redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

### PostgreSQL Connection Issues
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Test connection
docker-compose exec postgres pg_isready -U postgres
```

### File Upload Fails
```bash
# Check volume mount
docker-compose exec app ls -la uploads/

# Check permissions
docker-compose exec app ls -la uploads/original/
```

### Image Processing Fails
```bash
# Check app logs for Sharp errors
docker-compose logs -f app

# Verify Sharp installation
docker-compose exec app npm list sharp
```

### Hot Reload Not Working
```bash
# Verify volume mount
docker-compose exec app ls -la src/

# Restart with rebuild
docker-compose down
docker-compose up --build
```

### Clean Slate
```bash
# Remove all containers, volumes, and images
docker-compose down -v
docker system prune -a

# Rebuild from scratch
docker-compose up --build
```

## 📁 Project Structure

```
image-processing-api/
├── src/
│   ├── config/
│   │   └── config.ts              # Environment configuration
│   ├── uploads/
│   │   ├── entities/
│   │   │   └── upload.entity.ts   # Upload entity & status enum
│   │   ├── uploads.controller.ts  # Upload endpoints
│   │   ├── uploads.service.ts     # Upload business logic
│   │   └── uploads.module.ts      # Uploads module
│   ├── processor/
│   │   ├── processor.service.ts   # Image processing worker
│   │   └── processor.module.ts    # Processor module
│   ├── app.module.ts              # Root module
│   └── main.ts                    # Application entry point
├── uploads/
│   ├── original/                  # Original uploaded files
│   └── processed/
│       ├── resized/               # Resized images
│       ├── compressed/            # Compressed images
│       └── thumbnails/            # Thumbnail images
├── Dockerfile                     # Docker image definition
├── docker-compose.yml             # Docker services orchestration
├── .dockerignore                  # Docker build exclusions
├── .gitignore                     # Git exclusions
└── package.json                   # Dependencies
```

## 📝 Image Processing Details

### Resize
- **Target:** 1200px width
- **Aspect Ratio:** Maintained
- **Enlargement:** Disabled (images smaller than 1200px are not enlarged)
- **Fit:** Inside

### Compress
- **JPEG/JPG:** Quality 80
- **PNG:** Compression level 8
- **WebP:** Quality 80
- **Other formats:** Default compression

### Thumbnail
- **Size:** 200x200 pixels
- **Fit:** Cover (fills entire area)
- **Position:** Center
- **Crop:** Yes (to maintain aspect ratio)

## 🔐 Security Notes

- File size limited to 10MB
- Only image MIME types accepted
- Filenames are UUID-based to prevent conflicts
- CORS enabled for development (configure for production)

## 📄 License

UNLICENSED

## 👤 Author

Backend Engineering Assessment Project
