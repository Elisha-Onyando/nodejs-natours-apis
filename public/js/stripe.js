import axios from "axios";
import { showAlert } from "./alerts";
const { default: Stripe } = require("stripe");

const stripe = Stripe('pk_test_51Otl3jG6vsoY4yMFuhhIvhUkVPiEQSp7n1tu7ZdRkI69siKsfWpxcbFAeB7yp2tGY34VheFiDSBvSdVOi7XZbM2b00t0DdPrsc')

export const bookTour = async (tourId) => {
    try {
        //1. Get checkout session from API
        const session = await axios(`http://localhost:3000/api/v1/bookings/checkout-session/${tourId}`);

        //2. Create checkout form and charge credit card
        window.location.assign(session.data.responseObject.session.url);

    } catch (err) {
        showAlert('error', err)
    }
};