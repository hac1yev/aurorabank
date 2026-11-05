import { ALLOWED_EXTENSION } from 'src/shared/constants/files.constants';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';

function deriveKey(
  password: string,
  salt: string,
  keyLength: number,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCallback(
      password,
      salt,
      keyLength,
      {
        N: 16384,
        r: 8,
        p: 1,
      },
      (error, derivedKey) => {
        if (error) {
          reject(error);
        } else {
          resolve(derivedKey as Buffer);
        }
      },
    );
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');

  const derivedKey = await deriveKey(password, salt, 64);

  return `${salt}:${derivedKey.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string,
): Promise<boolean> {
  const [salt, key] = storedHash.split(':');

  if (
    !salt ||
    !key ||
    !/^[a-f0-9]{32}$/.test(salt) ||
    !/^[a-f0-9]{128}$/.test(key)
  ) {
    return false;
  }

  const derivedKey = await deriveKey(password, salt, 64);

  return timingSafeEqual(Buffer.from(key, 'hex'), derivedKey);
}

export function formatMaxSize(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  if (Number.isInteger(mb)) {
    return `${mb} MB`;
  }
  return `${mb.toFixed(1)} MB`;
}

export function formatAllowedTypes() {
  return ALLOWED_EXTENSION.map((ext) => ext.toUpperCase()).join(', ');
}
