import dotenv from 'dotenv';
import { z } from 'zod';
dotenv.config();
export const envSchema = z.object({
    PORT: z.coerce.number().default(5001),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    RAZORPAY_KEY_ID: z.string().min(1, 'RAZORPAY_KEY_ID is required'),
    RAZORPAY_KEY_SECRET: z.string().min(1, 'RAZORPAY_KEY_SECRET is required'),
    RAZORPAY_WEBHOOK_SECRET: z.string().min(1, 'RAZORPAY_WEBHOOK_SECRET is required'),
    CLIENT_URL: z.string().min(1, 'CLIENT_URL is required').transform((val) => {
        const trimmed = val.trim();
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
            return `https://${trimmed}`;
        }
        return trimmed;
    }),
    ALLOWED_ORIGINS: z.string().default('*'),
    CLOUDINARY_CLOUD_NAME: z.string().optional().default(''),
    CLOUDINARY_API_KEY: z.string().optional().default(''),
    CLOUDINARY_API_SECRET: z.string().optional().default(''),
    LIVEKIT_URL: z.string().optional().default(''),
    LIVEKIT_API_KEY: z.string().optional().default(''),
    LIVEKIT_API_SECRET: z.string().optional().default('')
});
export const validateEnv = (customEnv = process.env) => {
    const result = envSchema.safeParse(customEnv);
    if (!result.success) {
        const invalidFields = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`);
        console.error('[FATAL CONFIGURATION ERROR]: Missing or invalid environment variables:');
        invalidFields.forEach((msg) => console.error(`  - ${msg}`));
        process.exit(1);
    }
    const originsArray = result.data.ALLOWED_ORIGINS.split(',')
        .map((o) => o.trim())
        .filter(Boolean);
    return {
        ...result.data,
        ALLOWED_ORIGINS_ARRAY: originsArray
    };
};
export const env = validateEnv();
