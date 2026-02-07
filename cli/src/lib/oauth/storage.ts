import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { StoredCredential, OAuthError } from './types.js';

// Try to import keytar, but don't fail if it's not available
let keytar: any = null;
try {
  // Dynamic import to handle optional dependency
  const module = await import('keytar');
  keytar = module.default || module;
} catch (err) {
  // Keytar not available, will use file fallback
}

const SERVICE_NAME = 'onboardkit';
const CONFIG_DIR = path.join(os.homedir(), '.onboardkit');
const CREDENTIALS_FILE = path.join(CONFIG_DIR, 'credentials.json');

/**
 * Encryption key derived from machine-specific data
 */
function getDerivedKey(): string {
  const machineId = os.hostname() + os.userInfo().username;
  return crypto.createHash('sha256').update(machineId).digest('hex');
}

/**
 * Encrypt data using AES-256-GCM
 */
function encryptData(data: string): string {
  const key = getDerivedKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return IV + AuthTag + Encrypted data
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Decrypt data using AES-256-GCM
 */
function decryptData(encryptedData: string): string {
  const key = getDerivedKey();
  const parts = encryptedData.split(':');

  if (parts.length !== 3) {
    throw new Error('Invalid encrypted data format');
  }

  const iv = Buffer.from(parts[0], 'hex');
  const authTag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];

  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key, 'hex'), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Ensure config directory exists
 */
async function ensureConfigDir(): Promise<void> {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    // Set directory permissions to 700 (owner only)
    await fs.chmod(CONFIG_DIR, 0o700);
  } catch (err) {
    throw new OAuthError(`Failed to create config directory: ${err}`);
  }
}

/**
 * Save credential to OS keychain (primary method)
 */
async function saveToKeychain(key: string, value: string): Promise<boolean> {
  if (!keytar) {
    return false;
  }

  try {
    await keytar.setPassword(SERVICE_NAME, key, value);
    return true;
  } catch (err) {
    console.warn('Failed to save to keychain, falling back to file storage:', err);
    return false;
  }
}

/**
 * Get credential from OS keychain
 */
async function getFromKeychain(key: string): Promise<string | null> {
  if (!keytar) {
    return null;
  }

  try {
    return await keytar.getPassword(SERVICE_NAME, key);
  } catch (err) {
    return null;
  }
}

/**
 * Delete credential from OS keychain
 */
async function deleteFromKeychain(key: string): Promise<boolean> {
  if (!keytar) {
    return false;
  }

  try {
    return await keytar.deletePassword(SERVICE_NAME, key);
  } catch (err) {
    return false;
  }
}

/**
 * Save credential to encrypted file (fallback method)
 */
async function saveToFile(key: string, value: string): Promise<void> {
  await ensureConfigDir();

  let credentials: Record<string, string> = {};

  // Load existing credentials
  try {
    const data = await fs.readFile(CREDENTIALS_FILE, 'utf-8');
    const decrypted = decryptData(data);
    credentials = JSON.parse(decrypted);
  } catch (err) {
    // File doesn't exist or is corrupted, start fresh
    credentials = {};
  }

  // Add/update credential
  credentials[key] = value;

  // Encrypt and save
  const encrypted = encryptData(JSON.stringify(credentials));
  await fs.writeFile(CREDENTIALS_FILE, encrypted, { mode: 0o600 });
}

/**
 * Get credential from encrypted file
 */
async function getFromFile(key: string): Promise<string | null> {
  try {
    const data = await fs.readFile(CREDENTIALS_FILE, 'utf-8');
    const decrypted = decryptData(data);
    const credentials = JSON.parse(decrypted);
    return credentials[key] || null;
  } catch (err) {
    return null;
  }
}

/**
 * Delete credential from encrypted file
 */
async function deleteFromFile(key: string): Promise<void> {
  try {
    const data = await fs.readFile(CREDENTIALS_FILE, 'utf-8');
    const decrypted = decryptData(data);
    const credentials = JSON.parse(decrypted);

    delete credentials[key];

    // Save updated credentials
    const encrypted = encryptData(JSON.stringify(credentials));
    await fs.writeFile(CREDENTIALS_FILE, encrypted, { mode: 0o600 });
  } catch (err) {
    // File doesn't exist, nothing to delete
  }
}

/**
 * Save credential (tries keychain first, falls back to file)
 */
export async function saveCredential(key: string, value: string): Promise<void> {
  const savedToKeychain = await saveToKeychain(key, value);

  if (!savedToKeychain) {
    await saveToFile(key, value);
  }
}

/**
 * Get credential (tries keychain first, falls back to file)
 */
export async function getCredential(key: string): Promise<string | null> {
  // Try keychain first
  const keychainValue = await getFromKeychain(key);
  if (keychainValue) {
    return keychainValue;
  }

  // Fall back to file
  return await getFromFile(key);
}

/**
 * Delete credential (removes from both keychain and file)
 */
export async function deleteCredential(key: string): Promise<void> {
  await deleteFromKeychain(key);
  await deleteFromFile(key);
}

/**
 * Save complete credential object
 */
export async function saveStoredCredential(
  providerName: string,
  credential: StoredCredential
): Promise<void> {
  const key = `credential:${providerName}`;
  const value = JSON.stringify(credential);
  await saveCredential(key, value);
}

/**
 * Get complete credential object
 */
export async function getStoredCredential(
  providerName: string
): Promise<StoredCredential | null> {
  const key = `credential:${providerName}`;
  const value = await getCredential(key);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as StoredCredential;
  } catch (err) {
    throw new OAuthError(`Failed to parse stored credential: ${err}`);
  }
}

/**
 * Delete complete credential object
 */
export async function deleteStoredCredential(providerName: string): Promise<void> {
  const key = `credential:${providerName}`;
  await deleteCredential(key);
}

/**
 * Check if credentials exist for a provider
 */
export async function hasCredentials(providerName: string): Promise<boolean> {
  const credential = await getStoredCredential(providerName);
  return credential !== null;
}

/**
 * Check if keychain is available
 */
export function isKeychainAvailable(): boolean {
  return keytar !== null;
}

/**
 * List all stored credential providers
 */
export async function listStoredProviders(): Promise<string[]> {
  const providers: string[] = [];

  // Check file storage
  try {
    const data = await fs.readFile(CREDENTIALS_FILE, 'utf-8');
    const decrypted = decryptData(data);
    const credentials = JSON.parse(decrypted);

    for (const key of Object.keys(credentials)) {
      if (key.startsWith('credential:')) {
        providers.push(key.replace('credential:', ''));
      }
    }
  } catch (err) {
    // No credentials file
  }

  return providers;
}
