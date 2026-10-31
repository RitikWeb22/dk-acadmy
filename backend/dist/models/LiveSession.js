import mongoose, { Schema } from 'mongoose';
const liveSessionSchema = new Schema({
    roomId: {
        type: String,
        required: [true, 'Please provide unique roomId'],
        unique: true,
        trim: true,
        index: true
    },
    title: {
        type: String,
        required: [true, 'Please provide lecture title'],
        trim: true
    },
    subject: {
        type: String,
        required: [true, 'Please provide subject name'],
        default: 'Mathematics',
        trim: true
    },
    topic: {
        type: String,
        required: [true, 'Please provide topic name'],
        trim: true
    },
    batchId: {
        type: String,
        default: 'all',
        trim: true,
        index: true
    },
    batchName: {
        type: String,
        default: 'JEE Advanced Rankers Batch 2026-2027',
        trim: true
    },
    teacherId: {
        type: String,
        required: [true, 'Please provide teacher ID'],
        trim: true
    },
    teacherName: {
        type: String,
        required: [true, 'Please provide teacher name'],
        default: 'Dharmendra Kumar (DK Sir)',
        trim: true
    },
    status: {
        type: String,
        enum: ['SCHEDULED', 'LIVE', 'ENDED'],
        default: 'LIVE',
        index: true
    },
    startedAt: {
        type: Date,
        default: Date.now
    },
    endedAt: {
        type: Date
    },
    scheduledAt: {
        type: Date
    },
    participantCount: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});
export const LiveSession = mongoose.model('LiveSession', liveSessionSchema);
