const express = require('express');
const tourController = require('./../controllers/tourController'); // tourController = exports (kind of)
const authController = require('./../controllers/authController');
//const reviewController = require('./../controllers/reviewController');
const reviewRouter = require('./../routes/reviewRoutes');

const router = express.Router(); //router = tourRouter

//router.param('id', (req, res, next, val) => {
//Here val is value of parameter id in URL for this route - param middleware
//console.log(`Tour id is ${val}`);
//next();
//});

//router.param('id', tourController.checkId);

//Middlewares or Routes

// router
//   .route('/')
//   .get(tourController.getAllTours)
//   .post(
//     tourController.checkBody,
//     tourController.createTour
//   );

//post verb above on middleware function contains chaining of middlewares where first one will be implemented first

// NESTED ROUTE below

//In the real world, we dont need to specify the user id and the tour id in the body when creating new review in postman
//But in real world scenario, the user id should come from the currently logged-in user and the tour id should come from the current tour and that should be encoded right in the route/URL
//So when submitting a post req for a new review, we will want to submit that to a url like this :- POST req to -> /tour/43g242/reviews ,where 43g242 = tour id and the user id will come from currently logged-in user
// URL -> /tour/43g242/reviews is NESTED ROUTE and these nested routes/urls appear when there is parent-child relationship (ie relationship b/w tours and reviews here) b/w resources. So reviews is a child of tours here in url
//contd.. and this nested route /'tour'/43g242/'reviews' basically means to access the 'reviews' resource on the 'tours' resource
//contd.. and above same applies to GET req to -> /tour/43g242/reviews -> so this url will get us all the reviews for this tour with tour id 43g242
//contd.. And GET req to -> /tour/43g242/reviews/7795875 -> where 7795875=review id,  so this url will get us review with review id of 7795875 for this tour with tour id of 43g242
//So above nested url/route shows a clear relationship with reviews and tour resources

// router
//   .route('/:tourId/reviews')
//   .post(
//     authController.protect,
//     authController.restrictTo('user'),
//     reviewController.createReview
//   );
//Above nested router in this file is a bit confusing (so commented) as the createReview middleware should be in reviewRoutes.js but is here in tourRoutes.js and in fact it is here coz it is nested route for creating review on a tour and this nested route's url starts with /tour
//contd.. But to solve this problem of having this confusing createReview here in tour router instead of having in reviewRoutes.js, we have a express feature called MERGE PARAMS
// MERGE PARAMS: importing review router above at top instead of reviewController and router.use('/:tourId/reviews', reviewRouter);

router.use('/:tourId/reviews', reviewRouter);
//Above ie this tourRoutes.js (ie router) should 'use' the reviewRouter in case it ever encounters a route/url like this- /tourId/reviews
//And above we used the 'use' method on 'this router' ie on 'tourRoutes.js' (ie router.use(...)) coz router itself is a middleware
//..contd So router = tourRoutes.js here = a middleware f'n on which we can use the 'use' method and its like mounting a router here
//..contd So, by using this we have the tour router (tourRoutes.js) and review router (reviewRoutes.js) nicely separated and decoupled from one another
// this is MERGE PARAMS above
// but in -> router.use('/:tourId/reviews', reviewRouter); reviewRouter does not get access to the tourId parameter so we go to reviewRoutes.js and used mergedParams: true in express.router for enabling reviewRouter to have access to tourId here

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);
//Alias route

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/monthly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    tourController.getMonthlyPlan
  );

//RECENT Commented
// router
//   .route('/')
//   .get(authController.protect, tourController.getAllTours)
//   .post(tourController.createTour);

// Creating middleware f'n above before tourController.getAllTours to protect getAllTours f'n from unauthorized access
//So we will allow only logged in users to access the protected tours route (ie list of all tours)
//So above, authController.protect will run first and if user is not authenticated, then there will be an error and so tourController.getAllTours will not be executed.

//authController.protect = middleware for logging-in a user and from here we passed the user id of currently logged-in user (req.user = currentUser) into next middleware run after it

//

//Geospatial queries Finding Tours Within Radius:
//Implementing GeoSpatial queries in order to provide a search functionality feature for tours within a certain distance of a specified point
//So lets say u live in a certain point and wanted to know which tours start at a certain 'distance'(defined below in route as /:distance) from u like 100 miles
//..contd And implementing /tours-within route for implementing this feature below
//center = point/place where u live in
//:latlng = variable to pass lattitude and longitude of center ie co-ordinates of the place where u (center) live/are
//:unit = unit of distance ie the :distance is in km or in miles
router
  .route('/tours-within/:distance/center/:latlng/unit/:unit')
  .get(tourController.getToursWithin);
//Above /tours-within?distance=233&center=-40.2343,45.2343&unit=km is the old way of specifying urls but above/below is a new way
// /tours-within/233/center/-40.2343,45.2343/unit/km is a new way of specifying urls/routes/parameters which is a lot cleaner than above one's
//  so distance = 233 = distance for searching for a certain radius, center/co-ordinates in lat,long = -40.2343,45.2343 and unit of distance = km

//Below is route for calculating 'distances to all the tours from a certain point' using geo-spatial aggregation
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);
//Above :latlng = latitude and longitude of the point where the user currently is, :unit = unit of distance ie mile or km
//We're gonna calculate the distance from a certain point to all the tours that we have in our tour collection

//

router.route('/').get(tourController.getAllTours).post(
  authController.protect, //ie only logged-in users can access the middleware f'ns run after/below it
  authController.restrictTo('admin', 'lead-guide'), // ie only logged-in users having role as admin or lead-guide can access the middleware f'ns run after/below it (tourController.createTour here)
  tourController.createTour
);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.uploadTourImages,
    tourController.resizeTourImages,
    tourController.updateTour // In postman go to update Tour endpoint and in body -> form-data -> imageCover = new-tour-1.jpg, images = new-tour-2.jpg, images = new-tour-3.jpg, images = new-tour-4.jpg, price = 997 and then send req
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

//So only admin and lead-guide (so the user roles who are allowed to access the delete resource are only admin and lead-guide ) can delete a tour
// authController.protect = route for checking if a user is logged in. So above in .delete(authController.protect, tourController.deleteTour) we first check if a user is logged in or not and if it is then we proceed to authController.restrictTo
// authController.restrictTo('User roles authorized/allowed to interact with this delete route/resource') = route

module.exports = router;
