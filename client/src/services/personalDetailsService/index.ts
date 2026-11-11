import type { IPersonalDetails } from "../../pages/Registration/types";
import { PERSONAL_DETAILS_BASE_URL } from "../baseUrls"
import { httpClient } from "../httpClient"

// Send the calendar date only. Serialising the Dayjs object directly
// produces a UTC ISO string, which shifts the date for users east of UTC.
const toRequestPayload = (personalDetails: IPersonalDetails) => ({
    ...personalDetails,
    birthDate: personalDetails.birthDate.format("YYYY-MM-DD"),
});

export const personalDetailsService = {
    sendPersonalDetails: async (personalDetails: IPersonalDetails) => {
        return httpClient.post(`/registration/${PERSONAL_DETAILS_BASE_URL}`, toRequestPayload(personalDetails));
    },
    updatePersonalDetails: async (registrationToken: string | null, personalDetails: IPersonalDetails) => {
        return httpClient.patch(`/registration/${PERSONAL_DETAILS_BASE_URL}`, toRequestPayload(personalDetails), {
            headers: { "x-registration-token": registrationToken },
        });
    }
};
