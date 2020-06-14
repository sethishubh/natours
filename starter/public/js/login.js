//Below-> Disabling ES-Lint for this entire file coz ES-Lint is configured for Node.Js and NOT for JS code
/* eslint-disable */
//Also including this JS file at the bottom in base.pug file

import axios from 'axios';
import { showAlert } from './alerts';

//Below what we want to export from here is 'const login = async...' function from this login.js module/file. And Now it works a little bit different than it works with Node.js because Node.js uses something called CommonJS in order to implement modules. But here in front-end JavaScript since ES2015 or ES6 there's something called modules in JavaScript as well. The syntax is a bit different, but actually the way it works behind the scenes, but actually if you understand how it works with CommonJS then this one here will be very similar. So ES6 modules use the export import syntax. So here all we need to do is to say export and then whatever we want to export from this file.
export const login = async (email, password) => {
  console.log(email, password);
  try {
    //Below-> in order to do HTTP requests(to our login API) for the login ,we are going to use a very popular library called Axios by using it from CDN by going to cdnjs.com and then use this code->'https://cdnjs.cloudflare.com/ajax/libs/axios/0.19.2/axios.min.js' at the bottom in base.pug file and then writing <-this code there in base.pug file  will then expose an Axios object to the global scope(ie we can use that axios object anywhere/throughout in our FileStructure/website )
    //..contd and so we can use 'axios object' here below in our this login f'n
    // one thing that I really like about Axios is the fact that it's going to throw an error whenever we get an error back from our API endpoint. So let's say that there is a wrong password and so the server from API will send back a 403 and so basically, an error. And so whenever there is an error in API, Axios will trigger an error as well. And so, that's very handy because, with that, we can now use a try catch block above. So basically in order to do some error handling here on the client side. So, for example, when the user is correctly logged in, then you want to display some message saying that, and maybe some other logic, but if not, well, then we're going to be entering the catch block, and can then, take some other action based on the error.
    //Install axios now -> npm i axios
    const res = await axios({
      //Above -> await coz axios returns a promise
      //Below are options for our API req
      method: 'POST',
      url: '/api/v1/users/login', // endpoint(login endpoint here) for API req ; '/api/v1/users/login' = relative url for production/deployment, and since the api and the website r hosted on d same server(ie the api and d website r using d same url, so v r hosting them on d same place/url. But if u were hosting ur website/fornt-End on one url nd then ur api on another url, then it wouldn't work lyk dis), dis relative url is gonna work completely fine
      //url: 'http://127.0.0.1:3000/api/v1/users/login', // endpoint(login endpoint here) for API req ; 'http://127.0.0.1:3000/api/v1/users/login' = development API
      //Below is the data that we're sending along with the request in the body(like in the postman body in a POST req)
      data: {
        email: email, // LHS 'email': coz our login endpoint/API expects our body data to be called as -> {"email":"max@example.com", "password": 12345} in the body of postman in login endpoint and LHS email ->is a property ; RHS email is the parameter/argument of this f'n (ie in code -> 'const login = (email, password) ....' above) AND exact same case is for p/w defined below
        password: password,
      },
    });
    //After successful login, u will get jwt to be set as cookie in browser and u can see the cookie set as jwt in browser/ChromeHere by clicking on i button before website url in chrome And it's this cookie here, vch will actually enable us to build this entire authentication. Again, because the browser will now send this cookie(ie to show as passport) along with every new request.
    //contd..Now, in order to actually get access to the cookies that are in a request(made using browser or API), In Express, we need to install a certain middleware/NPMpackage called cookie-parser from npm. So do -> npm i cookie-parser    in terminal . So basically, this package will then parse all the cookies from the incoming request. And we implement this comment in app.js file

    //Below-> Checking if our api call above(to -> url: 'http://127.0.0.1:3000/api/v1/users/login' ie to API '/login') was successful or not.
    //Below -> res.data = response.data = so that data is actually the data that we sent as our json response ie ' status:"success", ' in SENDING the RESPONSE IN OUR '/login' API , and so from there we can read .status, and check if it's equal to success. So, remember how we always set the status to success(ie status:"success") in OUR '/login' API SENDING THE JSON RESPONSE , and now we can actually use that status here below in if()
    if (res.data.status === 'success') {
      //Ie if the user is successfully logged-in into our website in the browser (coz the above call to '/login API' received a 'success' status in the browser by the user and so above call to '/login' API was successful by the user in browser)
      showAlert('success', 'Logged-in successfully');
      //And now after one and a half seconds(1500 ms) of successfully logging-in on our login form page/webpage on website, load the front page. So basically, the home page below (ie '/' page/webpage of our website)
      window.setTimeout(() => {
        location.assign('/'); //ie loading Homepage('/' page) on our website after 1500ms
      }, 1500);
    }

    console.log(res);
  } catch (err) {
    showAlert('error', err.response.data.message); // data in err.response.data is data in/on response. So, 'data' here = data response = JSON WE RECEIVED AS THE RESPONSE FROM(AFTER SUCCESSFUL CALL TO ABOVE '/login' API) '/login' API as a result of successfull call to above '/login' API ; message = message property on/in received json response from '/login' API
    //console.log(err.response.data); //from Axios's official documentation
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: 'GET',
      url: '/api/v1/users/logout',
      //url: 'http://127.0.0.1:3000/api/v1/users/logout',
    });

    //And then as the next step, let's also reload the page. So that's what we always do manually when we delete a cookie in the browser, right? And so here of course we need to do it programatically. And we need to do it here because since this is an Ajax(ie HTTP req to API's url('/logout' here above in axios)) request we can not do it on the back-end side. So we can't do it with express. And so we need to, of course, do it manually here below. Otherwise we would technically be logged out(in the browser) but our user menu would still reflect in the browser. so it would still show that we/user are logged in. And so of course, we simply need to reload the page which would then send the invalid cookie basically to the server, so that one that we just received without a token and then we are no longer logged in, and therefore then our user menu will disappear, okay? So let's do that if() there was a success.Below
    if ((res.data.status = 'success')) {
      location.reload(true); //'true' here will then force a reload from the server and not from browser cache. So this 'true' here is really important again because otherwise it might simply load the same page from the cache which would then still have our user menu up there. But of course that's not what we want, we really want a fresh page coming down from the server. So we have our log out function here and now in the index.js we basically need to now trigger it once we hit that logout button.
    }
  } catch (err) {
    console.log(err.response);
    showAlert('error', 'Error logging out! Try again');
  }
};

// //Below adding an event listener listening for the submit event on our login form(ie in login.pug file) and So, our login form(in login.pug file) has form class in code -> form.form . so let's now select <-this form element(ie in form.form code in login.pug file) and then on there, listen for the submit event.
// document.querySelector('.form').addEventListener('submit', (e) => {
//   e.preventDefault();
//   //below getting email and the p/w value that the user puts in login form(in login.pug file) with the id email (ie #email) and id p/w (ie #password)
//   const email = document.getElementById('email').value;
//   const password = document.getElementById('password').value;

//   //calling login() f'n below
//   login(email, password);
// }); // submit event -> event that the browser will fire off whenever a user clicks on the submit button on the form and then in the callback f'n we will have access to that event called 'e'.
