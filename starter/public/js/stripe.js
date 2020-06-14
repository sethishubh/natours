/*eslint-disable*/
//This file is 4 implementing stripe into front-end of our website
import axios from 'axios';
import { showAlert } from './alerts';

const stripe = Stripe(
  'pk_test_51GreqyEFgSFq07bvntETD1nmy6HKj8DtsLeI0xbigeYbKL8NdpcqjLqnoDFex256PDl4Wjim08GJIX60JctON2mW00lbiDkFOR'
);

export const bookTour = async (tourId) => {
  //tourId comes from front-end part of website ie from tour.pug -> button.btn.btn--green.span-all-rows#book-tour(data-tour-id=`${tour.id}`) Book tour now!
  try {
    // 1) Get stripe checkout session from endpoint/API/server/back-end from bookingRoutes.js -> router.get('/checkout-session/:tourId', ....)
    const session = await axios(
      `/api/v1/booking/checkout-session/${tourId}`
      //`http://127.0.0.1:3000/api/v1/booking/checkout-session/${tourId}`
    );
    console.log('session');

    // 2) Use stripe object 2 automatically create d checkout form + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
