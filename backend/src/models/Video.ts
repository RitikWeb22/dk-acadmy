import mongoose, { Schema, Document } from 'mongoose';

export interface IVideoQuality {
  resolution: '360p' | '480p' | '720p' | '1080p';
  bandwidth: number;
  playlistPath: string;
}

export interface IVideo extends Document {
  title: string;
  description?: string;
  courseId: mongoose.Types.ObjectId | string;
  sectionId?: string;
  lectureId?: string;
  uploaderId?: mongoose.Types.ObjectId;
  rawFileName: string;
  rawFilePath: string;
  hlsDirectory: string;
  masterPlaylistUrl: string;
  qualities: IVideoQuality[];
  durationSeconds: number;
  fileSizeBytes: number;
  mimeType: string;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  transcodeProgress: number;
  errorMessage?: string;
  isFreePreview: boolean;
  notesPdfUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const videoSchema = new Schema<IVideo>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    courseId: { type: Schema.Types.Mixed, required: true, index: true },
    sectionId: { type: String, trim: true },
    lectureId: { type: String, trim: true },
    uploaderId: { type: Schema.Types.ObjectId, ref: 'User' },
    rawFileName: { type: String, required: true },
    rawFilePath: { type: String, required: true },
    hlsDirectory: { type: String, required: true },
    masterPlaylistUrl: { type: String, default: '' },
    qualities: [
      {
        resolution: { type: String, enum: ['360p', '480p', '720p', '1080p'] },
        bandwidth: { type: Number },
        playlistPath: { type: String }
      }
    ],
    durationSeconds: { type: Number, default: 0 },
    fileSizeBytes: { type: Number, default: 0 },
    mimeType: { type: String, default: 'video/mp4' },
    status: {
      type: String,
      enum: ['uploading', 'processing', 'ready', 'failed'],
      default: 'uploading',
      index: true
    },
    transcodeProgress: { type: Number, default: 0 },
    errorMessage: { type: String },
    isFreePreview: { type: Boolean, default: false },
    notesPdfUrl: { type: String }
  },
  {
    timestamps: true
  }
);

export const Video = mongoose.model<IVideo>('Video', videoSchema);
