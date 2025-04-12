import crypto from 'crypto';
import { promisify } from 'util';

// Simple password hashing utility
export async function hash(password: string): Promise<string> {
  const pbkdf2 = promisify(crypto.pbkdf2);
  const salt = 'footlink-salt'; // In a real app, use unique salts per user
  const iterations = 1000;
  const keylen = 64;
  const digest = 'sha512';
  
  const buffer = await pbkdf2(password, salt, iterations, keylen, digest);
  return buffer.toString('hex');
}

// Password verification
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hash = await hash(password);
  return hash === hashedPassword;
}