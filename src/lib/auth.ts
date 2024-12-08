import { z } from 'zod';
import CryptoJS from 'crypto-js';
import type { User } from '@/types/auth';

// Password validation schema with strict requirements
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

// Secure password hashing using PBKDF2
export function hashPassword(password: string): string {
  const salt = CryptoJS.lib.WordArray.random(128 / 8);
  const iterations = 100000;
  const keySize = 512 / 32;

  const hash = CryptoJS.PBKDF2(password, salt, {
    keySize,
    iterations,
    hasher: CryptoJS.algo.SHA512
  });

  return `${salt.toString()}:${iterations}:${hash.toString()}`;
}

// Secure password verification
export function verifyPassword(password: string, hashedPassword: string): boolean {
  try {
    const [storedSalt, iterationsStr, storedHash] = hashedPassword.split(':');
    const iterations = parseInt(iterationsStr, 10);
    const keySize = 512 / 32;

    const computedHash = CryptoJS.PBKDF2(password, storedSalt, {
      keySize,
      iterations,
      hasher: CryptoJS.algo.SHA512
    });

    return computedHash.toString() === storedHash;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

// Admin credentials validation
export function validateAdminCredentials(email: string, password: string): boolean {
  const adminEmail = 'admin@book.it';
  const adminPassword = 'Admin123456+';
  return email === adminEmail && password === adminPassword;
}

// Rate limiting for login attempts
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

export function checkLoginAttempts(email: string): boolean {
  const now = Date.now();
  const attempts = loginAttempts.get(email);

  if (!attempts) {
    loginAttempts.set(email, { count: 1, lastAttempt: now });
    return true;
  }

  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    loginAttempts.set(email, { count: 1, lastAttempt: now });
    return true;
  }

  if (attempts.count >= MAX_ATTEMPTS) {
    return false;
  }

  attempts.count += 1;
  attempts.lastAttempt = now;
  loginAttempts.set(email, attempts);
  return true;
}

export function resetLoginAttempts(email: string): void {
  loginAttempts.delete(email);
}

// User management functions
let users: User[] = [];

export async function createUser(userData: Omit<User, 'id'>): Promise<User> {
  const newUser = {
    ...userData,
    id: crypto.randomUUID(),
  };
  users.push(newUser);
  return newUser;
}

export async function getAllUsers(): Promise<User[]> {
  return users;
}

export async function getUserByEmail(email: string): Promise<User | undefined> {
  return users.find(user => user.email === email);
}

export async function getUserById(id: string): Promise<User | undefined> {
  return users.find(user => user.id === id);
}

export async function updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
  const index = users.findIndex(user => user.id === id);
  if (index === -1) return undefined;

  users[index] = { ...users[index], ...updates };
  return users[index];
}

export async function deleteUser(id: string): Promise<boolean> {
  const initialLength = users.length;
  users = users.filter(user => user.id !== id);
  return users.length < initialLength;
}