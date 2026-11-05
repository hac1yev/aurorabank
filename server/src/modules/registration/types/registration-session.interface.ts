import { AddressDetailsDto } from '../dtos/address-details.dto';
import { ContactDetailsDto } from '../dtos/contact-details.dto';
import { PersonalDetailsDto } from '../dtos/personal-details.dto';

export interface RegistrationSession {
  personalDetails?: PersonalDetailsDto;
  contacts?: ContactDetailsDto;
  addressDetails?: AddressDetailsDto;
  public_id?: string;
  password?: string;
  updatedAt?: string;
}
