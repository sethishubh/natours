//Below-> Disabling ES-Lint for this entire file coz ES-Lint is configured for Node.Js and NOT for JS code
/* eslint-disable */
import '@babel/polyfill';

//THIS index.js FILE(VCH IS USED FOR RENDERED WEBSITES DEVELOPMENT) IS LIKE app.js in Node.js (VCH IS USED FOR API DEVELOPMENT)

//Contd.. So, This file(ie index.js) is entry file for (RENDERED WEBSITES DEVELOPMENT or) bundler.js(parcel) and so we will see "hello from parcel" in browser's console after loading/re-loading webpage of our site/website by a non logged-in user
//So now the idea is basically that this index.js file is our entry file, and so in this one we cannot get data from the user interface and then we delegate actions to some functions coming from other modules(ie login.js module or alerts.js module or any other js file in this 'public/js' folder) here basically. So we have now the login module (ie login.js), alerts module (ie alerts.js), and so just like in Node.js we can actually now export data from these modules. So, we exported 'const login = async ...' f'n there in login.js file/module'.
//Contd..
console.log('hello from parcel');

//Below -> So this one here below we do not save it into any variable, because that's not necessary at all. All we want this to do is to basically be included into our final bundle to well polyfill some of the features of JavaScript. and so that's also why it's here in the first line of these imports.

//

import { displayMap } from './mapbox';
//Below-> importing(instead of require used in node.js, We use ES6 imports/exports here as its a JS file) login f'n from login.js file/module
//Below-> import {'the name of the variable (name of the variable in the file(/public/js/login.js below) from vch we want to import this variable) that we want to import'} from 'file path /name of the file'
import { login, logout } from './login';
//import { updateData } from './updateSettings';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

//Below-> DOM ELEMENTS
const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.login-form');
const logOutBtn = document.querySelector('.nav__el--logout'); //.nav__el--logout = class in __header.pug file
const userDataForm = document.querySelector('.form-user-data'); //from account.pug file
const userPasswordForm = document.querySelector('.form-user-password'); //from account.pug file
const bookBtn = document.getElementById('book-tour');

//Below-> DELEGATION
if (mapBox) {
  //For just below's code explanation, go to mapbox.js
  const locations = JSON.parse(mapBox.dataset.locations);

  //Calling imported displayMap f'n here below with passing above locations as parameters into it
  displayMap(locations);
}

if (loginForm) {
  //Below adding an event listener listening for the submit event on our login form(ie in login.pug file) and So, our login form(in login.pug file) has form class in code -> form.form . so let's now select <-this form element(ie in form.form code in login.pug file) and then on there, listen for the submit event.
  //So remember how I said that this file(ie index.js file) here is more to really get data from the user interface and then delegate the action. So that's exactly what we are doing here below.
  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    //below getting email and the p/w value that the user puts in login form(in login.pug file) with the id email (ie #email) and id p/w (ie #password)
    // const email = document.getElementById('email').value;
    // const password = document.getElementById('password').value;

    //VALUES Below
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    //calling login() f'n below
    login(email, password);
  }); // submit event -> event that the browser will fire off whenever a user clicks on the submit button on the form and then in the callback f'n we will have access to that event called 'e'.
  // Install in terminal -> install a package called polyfill, which will make some of the newer JavaScript features work in older browsers as well.
  //-Contd.. BY Doing -> npm i @babel/polyfill
}

if (logOutBtn) {
  //Below -> addEventListener() -> ie we want it to listen to all the events happening on that(logOutBtn) button whenever there is a click. So we're waiting for the 'click' event and when that happens we then call the log out function.
  logOutBtn.addEventListener('click', logout);
}

if (userDataForm) {
  userDataForm.addEventListener('submit', (e) => {
    e.preventDefault();
    //Below creating multipart/form-data
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]); //files -> array

    // const name = document.getElementById('name').value; //from accoun.pug file
    // const email = document.getElementById('email').value; //from accoun.pug file
    //updateData(name, email);
    // updateSettings({ name, email }, 'data'); //'data' -> 'type string' in updateSettings() f'n in updateSettings.js file
    updateSettings(form, 'data');
  });
}

if (userPasswordForm) {
  userPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    document.querySelector('.btn--save-password').textContent = 'Updating...';

    const passwordCurrent = document.getElementById('password-current').value; //from accoun.pug file
    const password = document.getElementById('password').value; //from accoun.pug file
    const passwordConfirm = document.getElementById('password-confirm').value; //from accoun.pug file

    //updateData(name, email);
    //Below updateSettings() is an async f'n in updateSettings.js file and thats y we added await here below
    await updateSettings(
      { passwordCurrent, password, passwordConfirm },
      'password'
    ); //'password' -> 'type string' in updateSettings() f'n in updateSettings.js file

    document.querySelector('.btn--save-password').textContent = 'Save password';
    //Below selecting all the above p/w i/p fields(ie passwordCurrent, New password and passwordConfirm) vch we used to update ours/logged-InUser's p/w in account page by a logged-in user and after successful p/w updation, we're clearing these all three p/w fields ie removing/clearing pre-filled(before-update p/w values) p/ws values(ie clearing(from the form) values of p/ws entered in above three p/w i/p fields just before p/w updation) from these p/w input fields after successful p/w updation below.
    document.getElementById('password-current').value = '';
    document.getElementById('password').value = '';
    document.getElementById('password-confirm').value = '';
  });
}

if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'Processing...';
    //e.target = the element(Button here) vch was clicked ie so d one dat triggered dis event listener above 2 b fired
    const tourId = e.target.dataset.tourId;
    bookTour(tourId);
  });
}
