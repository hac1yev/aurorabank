import type { Dayjs } from "dayjs";

export interface ComponentStepProps {
  setIsOtpFlow?: React.Dispatch<React.SetStateAction<boolean>>;
  handleNext?: () => void;
  activeStep?: number;
};

export interface IPersonalDetails {
    firstName: string;
    lastName: string;
    birthDate: Dayjs;
    citizenship: string;
    passportNumber: string;
    consent: boolean;
}

export interface IContactDetails {
    phone: string;
    email: string;
}

export interface IAddressDetails {
    address: string;
    city: string;
    country: string;
    postalCode: string;
}