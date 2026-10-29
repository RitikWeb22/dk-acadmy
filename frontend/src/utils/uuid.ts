/**
 * Standard RFC4122 v4 UUID generator for unique entity identifiers.
 * Generates unique Inquiry ID, Student ID, and Teacher ID using UUID.
 */

export const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Unique Inquiry ID generated using UUID: e.g. INQ-9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d
 */
export const generateInquiryId = (): string => `INQ-${generateUUID()}`;

/**
 * Unique Student ID generated using UUID: e.g. STU-a3c4f7b2-1e9d-4c3a-8f6b-5d2e1a9c8b7f
 */
export const generateStudentId = (): string => `STU-${generateUUID()}`;

/**
 * Unique Teacher ID generated using UUID: e.g. TCH-f47ac10b-58cc-4372-a567-0e02b2c3d479
 */
export const generateTeacherId = (): string => `TCH-${generateUUID()}`;

