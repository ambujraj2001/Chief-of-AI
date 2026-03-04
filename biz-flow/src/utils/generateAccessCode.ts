import { customAlphabet } from 'nanoid';

// Uppercase alphanumeric, easy to read (no 0/O/I/l confusion)
const alpha = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4);

/**
 * Generates a unique access code in the format: AI-XXXX-XXXX
 * e.g. AI-7782-XQ9L
 */
export const generateAccessCode = (): string => {
  return `AI-${alpha()}-${alpha()}`;
};
