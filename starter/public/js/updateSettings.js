//In this file, We actually use our API in order to update user data(ie to update logged-in user's email, name and p/w in account.pug/accountWebPage file in our browser ). So, And so, just like before, with the login functionality, we're now going to make an API call from the front end. And so we need to create a new JavaScript file(this updateSettings.js) for that.
/* eslint-disable */

import axios from 'axios';
import { showAlert } from './alerts';

//Below name, email in 'updateData = (name, email)' is the data (name, eamil here below) that we want to update
//export const updateData = async (name, email) => {
// Below f'n updateSettings() is a f'n to update logged-in user's name, email and his p/w in account webpage/page/template/.PugFile in our website in the browser
//Below-> data = Object containing all the data that we want to update ; type = A string vch is either 'data' or 'password'
export const updateSettings = async (data, type) => {
  //using axios below to make an HTTP API Call

  try {
    const url =
      type === 'password'
        ? '/api/v1/users/updateMyPassword' //'http://127.0.0.1:3000/api/v1/users/updateMyPassword'
        : '/api/v1/users/updateMe'; // 'http://127.0.0.1:3000/api/v1/users/updateMe';

    //res below -> response
    const res = await axios({
      method: 'PATCH',
      url: url,
      //url: 'http://127.0.0.1:3000/api/v1/users/updateMe',
      //Below-> data = body that's going to be sent along with the req(HTTP req)
      data: data,
      // data: {
      //   name: name,
      //   email: email,
      // },
    });

    //Below-> status in 'res.data.status' is the status in our API Response (to vch we made a call above (/updateMe here))
    if (res.data.status === 'success') {
      showAlert('success', `${type.toUpperCase()} updated successfully`);
    }
  } catch (err) {
    showAlert('error', err.response.data.message); //message in 'err.response.data.message' is the property that we are defining on the server(ie in our API Response) whenever there is an error
  }
};
