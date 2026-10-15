import { Provider } from '@nestjs/common';
import { AesGcmHelper } from '../encryption/aes-gcm.helper';

export const AesGcmProvider: Provider = {
  provide: AesGcmHelper,
  useFactory: () => {
    const keyB64 = process.env.AES_GCM_KEY_B64;
    if (!keyB64) {
      throw new Error('Missing AES_GCM_KEY_B64 env variable');
    }
    const key = Buffer.from(keyB64, 'base64');
    return new AesGcmHelper(key);
  },
};
