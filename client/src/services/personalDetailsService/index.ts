import type { IPersonalDetails } from "../../pages/Registration/types";
import { PERSONAL_DETAILS_BASE_URL } from "../baseUrls"
import { httpClient } from "../httpClient"

export const personalDetailsService = {
    sendPersonalDetails: async (personalDetails: IPersonalDetails) => {
        return httpClient.post(`/registration/${PERSONAL_DETAILS_BASE_URL}`, personalDetails);        
    }
};
