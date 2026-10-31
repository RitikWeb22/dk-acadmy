import mongoose, { Schema } from 'mongoose';
const cmsConfigSchema = new Schema({
    key: { type: String, required: true, unique: true },
    data: { type: Schema.Types.Mixed, required: true },
    updatedBy: { type: String, default: 'Admin' }
}, {
    timestamps: true
});
export const CMSConfig = mongoose.model('CMSConfig', cmsConfigSchema);
