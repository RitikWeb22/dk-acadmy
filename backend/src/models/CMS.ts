import mongoose, { Schema, Document } from 'mongoose';

export interface ICMSConfig extends Document {
  key: string; // 'navbar' | 'footer' | 'pages' | 'test_series' | 'pyqs' | 'dpp' | 'results' | 'classroom'
  data: any;
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const cmsConfigSchema = new Schema<ICMSConfig>(
  {
    key: { type: String, required: true, unique: true },
    data: { type: Schema.Types.Mixed, required: true },
    updatedBy: { type: String, default: 'Admin' }
  },
  {
    timestamps: true
  }
);

export const CMSConfig = mongoose.model<ICMSConfig>('CMSConfig', cmsConfigSchema);
