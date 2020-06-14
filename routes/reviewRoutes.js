const express = require('express');
const reviewController = require('./../controllers/reviewController');
const authController = require('./../controllers/authController');

const router = express.Router({ mergeParams: true });
//by default, each router only has access to the url parameters of their specific routes but by enabling mergeParams: true, we will get access to that parameter (like tourId) from the other router (tourRoutes.js)

//router below will serve these requests mentioned below-
// POST /tour/34656/reviews -> ie Create New Review on a Tour with tour id 34656 -> ie POST req to this url ie Creating new review on a tour having tour id of 34656  // 34656 = tourId which we will get from tourRoutes.js coz mergeParams: true
// POST /reviews
// GET  /tour/34656/reviews -> ie GET All Reviews on/for a Tour with tour id 34656 -> ie to GET an array of all the reviews on one particular tour having tour id 34656 and we get tourId of 34656 from other router (tourRoutes.js) coz mergeParams: true

//

// Protect all routes below/after this line (ie Protect all routes after this use middleware) Below; For detailed explanation, go to userRoutes.js
router.use(authController.protect);
//So from this point on (ie Below/after this above line of code), no one can access any of these below routes w/o being authenticated/logging-in
//contd.. So removing authController.protect, from all the routes below/after this line of code coz now authController.protect route will automatically be applied to all the routes/middleware f'ns below/after this line of code as middlewares run in sequence (ie from top to bottom / left to right)

// router.route('/').get(reviewController.getAllReviews).post(
//   authController.protect,
//   authController.restrictTo('user'), //ie restricting access only to users having role as 'user' to access next middleware which is reviewController.createReview here
//   reviewController.setTourUserIds,
//   reviewController.createReview
// ); //protect and restrictTo coz we want only logged-in/authenticated users to post reviews (ie protect) and also only users that are regular users so not admins and not tour guides (ie restrictTo('user'))
//we will automatically get the user id from user that's already logged-in here in reviewController.createReview from previous middleware (ie authController.protect ) coz the protect middleware puts the user on the req object ie req.user = currentUser ie assigning the value of currentUser to req.user there in protect middleware and passing it into next middleware(which is reviewController.createReview here ) by calling next()

router.route('/').get(reviewController.getAllReviews).post(
  authController.restrictTo('user'), //ie restricting access only to users having role as 'user' to access next middleware which is reviewController.createReview here
  reviewController.setTourUserIds,
  reviewController.createReview
);

router
  .route('/:id')
  .get(reviewController.getReview)
  .patch(
    authController.restrictTo('user', 'admin'),
    reviewController.updateReview
  )
  .delete(
    authController.restrictTo('user', 'admin'),
    reviewController.deleteReview
  );

module.exports = router;
