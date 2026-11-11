import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHmac,
  hkdfSync,
} from 'crypto';

const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

export class AesGcmHelper {
  constructor(private readonly key: Buffer) {
    if (key.length !== 32) {
      throw new Error('AES-GCM key must be 32 bytes (256 bits).');
    }
  }

  encryptJson(obj: any): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv('aes-256-gcm', this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    const plaintext = Buffer.from(JSON.stringify(obj), 'utf8');
    const ciphertext = Buffer.concat([
      cipher.update(plaintext),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    const parts = [
      iv.toString('base64'),
      ciphertext.toString('base64'),
      authTag.toString('base64'),
    ];
    return parts.join(':');
  }

  /**
   * Keyed, purpose-separated hash (HMAC-SHA256 with an HKDF-derived subkey).
   * Used for Redis lookup keys so raw identifiers are not stored in key names.
   * Does not change encryption behaviour.
   */
  keyedHash(purpose: string, value: string): string {
    const subkey = Buffer.from(
      hkdfSync('sha256', this.key, Buffer.alloc(0), purpose, 32),
    );
    return createHmac('sha256', subkey).update(value, 'utf8').digest('hex');
  }

  decryptToJson<T>(payload: string): T {
    const [ivB64, ctB64, tagB64] = payload.split(':');
    if (!ivB64 || !ctB64 || !tagB64) {
      throw new Error('Invalid encrypted payload format');
    }
    const iv = Buffer.from(ivB64, 'base64');
    const ciphertext = Buffer.from(ctB64, 'base64');
    const authTag = Buffer.from(tagB64, 'base64');

    const decipher = createDecipheriv('aes-256-gcm', this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);
    const plaintext = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return JSON.parse(plaintext.toString('utf8')) as T;
  }
}
