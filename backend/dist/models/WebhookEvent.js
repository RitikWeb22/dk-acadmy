import mongoose, { Schema } from 'mongoose';
const webhookEventSchema = new Schema({
    eventId: { type: String, required: true, unique: true, index: true },
    eventType: { type: String, required: true, index: true },
    payload: { type: Schema.Types.Mixed }
}, {
    timestamps: true
});
export const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);
