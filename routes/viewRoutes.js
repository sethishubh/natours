const express = require('express');
//Making Router from express app below
const viewsController = require('../controllers/viewsController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// So Below-> we want this middleware(ie authController.isLoggedIn) to be applied to every single route that we have here below after this line of code -> 'router.use(authController.isLoggedIn);' . And we do that a bit like we did before with the protect middleware. So basically putting it here before all the other routes. And so then it(ie authController.isLoggedIn) will be put in the middleware stack for each and every request that comes in from the browser/user
//RECENT COMMENTED JUST BELOW
//router.use(authController.isLoggedIn);

//Below is route for accessing the pug templates(ie views) in browser ie route/url for rendering/building pages in a browser
//Below -> app.get('/', HandlerFunctionInController) where '/' -> root url of website
//Below is route for getting '/' ie root/Home page (which is overview page) of Natours website in browser
// router.get('/', (req, res) => {
//   res.status(200).render('base', {
//     tour: 'The Forest Hiker',
//     user: 'sethi',
//     //These above variables(tour and user) that we passed/defined above as properties are called LOCALS in pug file
//   }); //ie render(in browser) the .pug template having name 'base' from the location('views' folder here from path in app.set('views', ...) defined at top ) we defined in app.set('views', ...); above at top
//   //And now go to 127.0.0.1:3000 in browser to see base pug template rendered in browser; 127.0.0.1 = localhost, 3000 = port and our server is running at url- 127.0.0.1:3000 in browser(after doing 'npm start' in terminal)
//   // 127.0.0.1:3000  = 127.0.0.1:3000/ = '/'(ie root) route/url of our website
//   //Above -> res.status(200).render('base', {" pass data into this pug template here called 'base' and passed data here will be available in the pug template named 'base' "});
// });

//Below is route for getting All Tours overview page(which has overview of all the tours) page (which is overview.pug page) on '/'-> root url of Natours website in browser
//So below we're getting overview page (ie overview.pug template) on GET req to root url of Natours website ie on req to-> '/' url
// So On GET req to root url (ie to '/' url), we will get overview.pug page below and so overview.pug page = Homepage of Natours website coz it is req to root url('/' url) and whatever page appears on GET req to root url , we call that page the root page/Home page and which is overview page(ie overview.pug template) here in this case below (from viewcontroller.getOverview)
router.get(
  '/',
  bookingController.createBookingCheckout,
  authController.isLoggedIn,
  viewsController.getOverview
);
//Above-> bookingController.createBookingCheckout  coz we want to create a new booking on home url (in bookingConroller.js -> const session -> success_url -> is Home url (ie '/' url). Because again that is the url(ie success url) that is called whenever a purchase is successful with Stripe. And so what we need to do is add exports.createBookingCheckout(in bookingController.js) middleware function onto the middleware stack of above's route handler(ie '/' url). Again coz this is the route above(ie '/' url) that will be hit when a credit card is successfully charged by stripe. And so this is also the point of time where we want to create a new booking. And so here above is where we need to add that createBookingCheckout() middleware function . So, Success url = '/' url = Home url = Above's route. And again this is here just kind of temporary until we actually have our websites deployed to a server where we will then be able to create a better solutionfor this.

//Below is route for getting All Tours overview page (which is overview page) of Natours website in browser
// router.get('/overview', (req, res) => {
//   res.status(200).render('overview', {
//     title: 'All Tours',
//   }); //here above .render('Pug Template(in views folder here) we want to render in website'); title -> title of the rendered page(overview here) in browser
// });

//Below is route for getting Tour details(of a specific tour) page (ie details of a tour which we get by clicking on a tour in overview page) of Natours website in browser
router.get('/tour/:slug', authController.isLoggedIn, viewsController.getTour);
// Above slug = parameter in url of specific tour detail webpage; so the query parameter in url above = slug
//Above-> authController.protect -> AND SO COZ OF <-THIS CODE, ONLY IF THE USER IN BROWSER IS LOGGED-IN, HE CAN GO TO getTour f'n
//Deleting the saved cookie(vch has jwt) in browser for a logged-in user will result in logging-out of that user

//Below is route for getting Tour details(of a specific tour) page (ie details of a tour which we get by clicking on a tour in overview page) of Natours website in browser
// router.get('/tour', (req, res) => {
//   res.status(200).render('tour', {
//     title: 'The Forest Hiker Tour',
//   }); //here above .render('Pug Template(in views folder here) we want to render in website'); title -> title of the rendered page(tour here) in browser
// });

//Below is route for login page form-
router.get('/login', authController.isLoggedIn, viewsController.getLoginForm);

//Below is route for accessing logged-in user's Account page/webpage by the user itself in our website in browser
router.get('/me', authController.protect, viewsController.getAccount);

//Below is route for accessing logged-in user's My-bookings page/webpage (vch is actually d page having all d tours dat a user has booked) by the user itself in our website in browser
router.get('/my-tours', authController.protect, viewsController.getMyTours);

//Below route is for submitting user data from form on/from accounts page/account.pug of logged-in user and then processing that submitted data (from form in account.pug)
router.post(
  '/submit-user-data',
  authController.protect,
  viewsController.updateUserData
);

module.exports = router;

//Rendering/showing/building the login and sign up buttons at top-bar in website in case the user is not logged in, And in case the user is in fact logged in, well, then render some kind of user menu there and also a log-out button at top-bar. And That kind of rendering should of course happen on the back end, so in one of our pug templates. Now, how will our template actually know if the user is logged in or not? Actually, in order to determine that we will have to create a new middleware function, and really the only goal of this new middleware function is going to be if the user is currently logged in or not. Now You might think that our protect(ie authController.protect) middleware also does something similar, and actually, it is similar. But the difference is that, that one(ie protect middleware -> authController.protect) only works for protected routes, But our new middleware function(vch is authController.isLoggedIn) is going to be running/working for each and every single request on our rendered website. And so now GO TO authController.isLoggedIn
