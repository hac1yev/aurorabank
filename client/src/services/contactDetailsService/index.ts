import type { IContactDetails } from "../../pages/Registration/types";
import { CONTACT_DETAILS_BASE_URL } from "../baseUrls";
import { httpClient } from "../httpClient";

export const contactDetailsService = {
    sendContactDetails: async (contactDetails: IContactDetails) => {
        const registrationToken = sessionStorage.getItem("registrationToken");  

        return httpClient.post(`/registration/${CONTACT_DETAILS_BASE_URL}`, contactDetails, {
            headers: {
                'x-registration-token': registrationToken
            }
        })
    }
};
