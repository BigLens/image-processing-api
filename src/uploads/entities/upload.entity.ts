import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum UploadStatus {
    PENDING = 'PENDING',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED',
}

@Entity('uploads')
export class Upload {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    originalFilename: string;

    @Column()
    originalPath: string;

    @Column({ nullable: true })
    resizedPath: string;

    @Column({ nullable: true })
    compressedPath: string;

    @Column({ nullable: true })
    thumbnailPath: string;

    @Column({
        type: 'text',
        default: UploadStatus.PENDING,
    })
    status: UploadStatus;

    @Column({ nullable: true })
    errorMessage: string;

    @Column()
    mimeType: string;

    @Column()
    fileSize: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
