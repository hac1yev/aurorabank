import { AddressDetailsDto } from '../dtos/address-details.dto';
import { ContactDetailsDto } from '../dtos/contact-details.dto';
import { PersonalDetailsDto } from '../dtos/personal-details.dto';

export interface RegistrationSession {
  consentTimestamp?: string;
  personalDetails?: PersonalDetailsDto;
  contacts?: ContactDetailsDto;
  addressDetails?: AddressDetailsDto;
  public_id?: string;
  step4Data?: any;
  password?: { hash: string };
  updatedAt?: string;
}
