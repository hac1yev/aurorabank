import type { IAddressDetails } from "../../pages/Registration/types";
import { ADDRESS_DETAILS_BASE_URL } from "../baseUrls";
import { httpClient } from "../httpClient";

export const addressDetailsService = {
    sendAddressDetails: async (addressDetails: IAddressDetails) => {
        const registrationToken = sessionStorage.getItem("registrationToken");

        return httpClient.post(`/registration/${ADDRESS_DETAILS_BASE_URL}`, addressDetails, {
            headers: {
                'x-registration-token': registrationToken
            }
        })
    }
}