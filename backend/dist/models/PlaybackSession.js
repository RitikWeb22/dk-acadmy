import mongoose, { Schema } from 'mongoose';
const playbackSessionSchema = new Schema({
    studentId: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    sessionId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    deviceFingerprint: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String
    },
    userAgent: {
        type: String
    },
    currentCourseId: {
        type: String
    },
    currentLectureId: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    revoked: {
        type: Boolean,
        default: false,
        index: true
    },
    revokedReason: {
        type: String
    },
    lastHeartbeat: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});
// Expire inactive playback sessions after 24 hours of inactivity
playbackSessionSchema.index({ lastHeartbeat: 1 }, { expireAfterSeconds: 86400 });
export const PlaybackSession = mongoose.model('PlaybackSession', playbackSessionSchema);
