import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 5000;
export const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
