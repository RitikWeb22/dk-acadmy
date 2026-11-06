import mongoose, { Schema } from 'mongoose';
const offerSchema = new Schema({
    offerType: {
        type: String,
        enum: ['banner', 'popup', 'item_discount'],
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    tagText: {
        type: String,
        trim: true,
        default: ''
    },
    message: {
        type: String,
        trim: true,
        default: ''
    },
    linkText: {
        type: String,
        trim: true,
        default: 'View Offer'
    },
    linkUrl: {
        type: String,
        trim: true,
        default: '/courses'
    },
    imageUrl: {
        type: String,
        trim: true,
        default: ''
    },
    buttonText: {
        type: String,
        trim: true,
        default: 'Avail Offer Now'
    },
    audience: {
        type: String,
        enum: ['all', 'guest_only', 'loggedin_only'],
        default: 'all'
    },
    frequency: {
        type: String,
        enum: ['every_visit', 'once_per_session', 'once_per_day'],
        default: 'once_per_session'
    },
    badgeText: {
        type: String,
        trim: true,
        default: ''
    },
    discountType: {
        type: String,
        enum: ['percent', 'flat'],
        default: 'percent'
    },
    discountValue: {
        type: Number,
        default: 0
    },
    hasDiscount: {
        type: Boolean,
        default: false
    },
    couponCode: {
        type: String,
        trim: true,
        default: ''
    },
    discountBadge: {
        type: String,
        trim: true,
        default: ''
    },
    autoApplyOnRedirect: {
        type: Boolean,
        default: true
    },
    targetScope: {
        type: String,
        enum: ['all', 'courses', 'test-series', 'custom'],
        default: 'all'
    },
    applicableItemIds: [{
            type: String,
            trim: true
        }],
    isActive: {
        type: Boolean,
        default: true,
        index: true
    },
    startDate: {
        type: Date
    },
    endDate: {
        type: Date
    },
    priority: {
        type: Number,
        default: 1
    }
}, {
    timestamps: true
});
offerSchema.index({ offerType: 1, isActive: 1 });
export const Offer = mongoose.model('Offer', offerSchema);
