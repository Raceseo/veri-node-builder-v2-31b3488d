/**
 * Shared cryptographic utilities for consistent encryption/decryption across edge functions.
 * Uses SHA-256 derived keys with AES-256-GCM for maximum security.
 */

/**
 * Derives a consistent 256-bit encryption key from a string using SHA-256.
 * This ensures the same key derivation method is used across all functions.
 */
export async function deriveEncryptionKey(keyString: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(keyString);
  const hashBuffer = await crypto.subtle.digest('SHA-256', keyData);
  
  return crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts plaintext using AES-256-GCM.
 * Format: IV (12 bytes) + Ciphertext + Auth Tag (16 bytes), base64 encoded.
 */
export async function encryptData(plainText: string, keyString: string): Promise<string> {
  const key = await deriveEncryptionKey(keyString);
  const encoder = new TextEncoder();
  const data = encoder.encode(plainText);
  
  // Generate random 12-byte IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Encrypt with AES-GCM (includes authentication tag)
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  // Combine IV + encrypted data (auth tag is appended by AES-GCM)
  const combined = new Uint8Array(iv.length + encryptedData.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedData), iv.length);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts data that was encrypted with encryptData.
 * Expects base64 encoded: IV (12 bytes) + Ciphertext + Auth Tag (16 bytes).
 */
export async function decryptData(encryptedData: string, keyString: string): Promise<string> {
  const key = await deriveEncryptionKey(keyString);
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  
  // Extract IV (first 12 bytes) and ciphertext with auth tag
  const iv = combined.slice(0, 12);
  const ciphertextWithTag = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertextWithTag
  );
  
  return new TextDecoder().decode(decrypted);
}

/**
 * Get encryption key from environment, throwing if not configured.
 */
export function getEncryptionKeyFromEnv(): string {
  const key = Deno.env.get('ENCRYPTION_KEY');
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not configured');
  }
  return key;
}

/**
 * Hash an OTP code using SHA-256 with a salt for secure storage.
 * OTPs should never be stored in plaintext - only their hash should be stored.
 * @param otp The plaintext OTP to hash
 * @returns A hex-encoded SHA-256 hash of the salted OTP
 */
export async function hashOTP(otp: string): Promise<string> {
  // Use a fixed salt prefix for OTP hashing (could be enhanced with per-user salt)
  const salt = Deno.env.get('OTP_HASH_SALT') || 'verinode_otp_v1_';
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + otp);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify an OTP by comparing its hash with a stored hash.
 * @param inputOtp The OTP provided by the user
 * @param storedHash The hash stored in the database
 * @returns True if the OTP matches, false otherwise
 */
export async function verifyOTPHash(inputOtp: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashOTP(inputOtp);
  // Use timing-safe comparison to prevent timing attacks
  if (inputHash.length !== storedHash.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < inputHash.length; i++) {
    result |= inputHash.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return result === 0;
}
