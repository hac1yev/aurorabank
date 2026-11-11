import { AddressDetailsDto } from '../dtos/address-details.dto';
import { ContactDetailsDto } from '../dtos/contact-details.dto';
import { PersonalDetailsDto } from '../dtos/personal-details.dto';

export interface RegistrationSession {
  personalDetails?: PersonalDetailsDto;
  contacts?: ContactDetailsDto;
  addressDetails?: AddressDetailsDto;
  public_id?: string;
  documentVerified?: boolean;
  /** Keyed hash of the passport number used for OCR counters, pinned on the first OCR attempt. */
  ocrPassportKey?: string;
  password?: string;
  updatedAt?: string;
}
