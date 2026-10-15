import AddressDetails from "./pages/Registration/AddressDetails";
import ConfirmPassword from "./pages/Registration/ConfirmPassword";
import ContactDetails from "./pages/Registration/ContactDetails";
import IdentityVerification from "./pages/Registration/IdentityVerification";
import PersonalDetails from "./pages/Registration/PersonalDetails";

export const QUERY_STALE_TIME = 1000 * 60 * 5;

// REGEX Patterns
export const NAME_REGEX = /^(?=(?:.*[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż]){2,})[A-Za-zĄąĆćĘęŁłŃńÓóŚśŹźŻż -]+$/;
export const PHONE_E164_REGEX = /^\+[1-9]\d{1,14}$/;

// Registration Steps
export const steps = [
  {
    Component: PersonalDetails,
    label: "Personal Details",
  },
  {
    Component: ContactDetails,
    label: "Contact Details",
  },
  {
    Component: AddressDetails,
    label: "Address Details",
  },
  {
    Component: IdentityVerification,
    label: "Identity Verification",
  },
  {
    Component: ConfirmPassword,
    label: "Confirm Password",
  },
] as const;
