import { v4 as uuidv4 } from 'uuid';

/**
 * Unique Inquiry ID generated using UUID: e.g. INQ-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
 */
export const generateInquiryId = (): string => `INQ-${uuidv4()}`;

/**
 * Unique Student ID generated using UUID: e.g. STU-a3c4f7b2-1e9d-4c3a-8f6b-5d2e1a9c8b7f
 */
export const generateStudentId = (): string => `STU-${uuidv4()}`;

/**
 * Unique Teacher ID generated using UUID: e.g. TCH-f47ac10b-58cc-4372-a567-0e02b2c3d479
 */
export const generateTeacherId = (): string => `TCH-${uuidv4()}`;

