import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

// The encryption key should be 32 bytes (256 bits) for AES-256
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || ''
if (ENCRYPTION_KEY.length !== 64) {
  throw new Error('ENCRYPTION_KEY environment variable must be set to a 64-character hex string')
}

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 16

/**
 * Encrypts a string value using AES-256-GCM
 * Returns a base64 encoded string containing the IV, salt, auth tag, and encrypted data
 */
export async function encrypt(text: string): Promise<string> {
  // Generate a random IV and salt
  const iv = randomBytes(IV_LENGTH)
  const salt = randomBytes(SALT_LENGTH)

  // Create cipher
  const cipher = createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv)

  // Encrypt the text
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()])

  // Get auth tag
  const authTag = cipher.getAuthTag()

  // Combine IV, salt, auth tag, and encrypted data
  const combined = Buffer.concat([iv, salt, authTag, encrypted])

  // Return as base64 string
  return combined.toString('base64')
}

/**
 * Decrypts a base64 encoded string that was encrypted using the encrypt function
 */
export async function decrypt(encryptedBase64: string): Promise<string> {
  // Convert base64 to buffer
  const combined = Buffer.from(encryptedBase64, 'base64')

  // Extract the IV, salt, auth tag, and encrypted data
  const iv = combined.subarray(0, IV_LENGTH)
  const salt = combined.subarray(IV_LENGTH, IV_LENGTH + SALT_LENGTH)
  const authTag = combined.subarray(
    IV_LENGTH + SALT_LENGTH,
    IV_LENGTH + SALT_LENGTH + AUTH_TAG_LENGTH,
  )
  const encrypted = combined.subarray(IV_LENGTH + SALT_LENGTH + AUTH_TAG_LENGTH)

  // Create decipher
  const decipher = createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv)
  decipher.setAuthTag(authTag)

  // Decrypt the data
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()])

  return decrypted.toString('utf8')
}
