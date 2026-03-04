import { customAlphabet } from 'nanoid';

/**
 * Generates a unique access code in the format: AI-[4 digits]-[4 alphanumeric]
 *
 * Segments:
 *  - Prefix:  "AI"  (fixed)
 *  - Middle:  4 numeric digits  (e.g. 7782)
 *  - Suffix:  4 uppercase alphanumeric chars, excluding visually ambiguous
 *             characters (0/O and 1/I)  (e.g. XQ9L)
 *
 * Example output: AI-7782-XQ9L
 */
const digits = customAlphabet('0123456789', 4);
const alphanumeric = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4);

export const generateAccessCode = (): string => `AI-${digits()}-${alphanumeric()}`;
