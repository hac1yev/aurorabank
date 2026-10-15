import * as bcrypt from 'bcrypt';
import { ALLOWED_EXTENSION } from 'src/shared/constants/files.constants';

export function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
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
