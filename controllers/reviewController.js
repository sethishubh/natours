const Review = require('./../models/reviewModel');
const catchAsync = require('./../utilities/catchAsync');
const factory = require('./handlerFactory');

//RECENT Commented
// exports.getAllReviews = catchAsync(async (req, res, next) => {
//   //So below if there is a req -> GET /tour/567767/reviews (ie GET /tour/567767/reviews -> ie GET All Reviews on/for a Tour with tour id 567767) then that means there is tour Id of 567767 so we will get reviews for this tour id only and NOT all the reviews for all the tours
//   //contd.. And if there is a req -> GET /reviews ie we want all the reviews for all the tours (as there is no tour id parameter in url) then the filter below -> filter = {} -> an empty object and we will get all the reviews for all the tours from db

//   let filter = {};

//   if (req.params.tourId) {
//     filter = { tour: req.params.tourId };
//   }
//   const reviews = await Review.find(filter);

//   res.status(200).json({
//     status: 'success',
//     results: reviews.length,
//     data: {
//       reviews,
//     },
//   });

//   //In postman -> body -> raw -> json :- (with jwt enabled in authorization:bearer as only logged-in user can write/post review)
//   //   {
//   // 	"review": "Amazing tour",
//   // 	"rating": 5,
//   // 	"tour": "5c88fa8cf4afda39709c2955", //id of the tour this review belongs to
//   // 	"user":"5ea16c753232912760de35a1" // id of the user this review belongs to
//   // }
// });
exports.getAllReviews = factory.getAll(Review); //Review = model name

//

//RECENT Commented
// exports.createReview = catchAsync(async (req, res, next) => {
//   //Allow Nested routes
//   //Below ifs are for nested route and in nested tour routes, tour in body is actually ref to tour id user is ref to user id
//   if (!req.body.tour) {
//     //ie if we dont have tour id in the body then below we want to define that as the one coming from the url
//     req.body.tour = req.params.tourId;
//   }
//   if (!req.body.user) {
//     //ie if we dont have user id in the body then below we want to define that as the one coming from the url
//     req.body.user = req.user.id; // we get req.user from the protect middleware as there in protect middleware -> req.user = currentUser ; So we got id here of currently logged-in user -> req.user.id
//   }

//   const newReview = await Review.create(req.body);

//   res.status(201).json({
//     status: 'success',
//     data: {
//       review: newReview,
//     },
//   });
// });

exports.setTourUserIds = (req, res, next) => {
  //Allow Nested routes
  //Below ifs are for nested route and in nested tour routes, tour in body is actually ref to tour id user is ref to user id
  if (!req.body.tour) {
    //ie if we dont have tour id in the body then below we want to define that as the one coming from the url
    req.body.tour = req.params.tourId;
  }
  if (!req.body.user) {
    //ie if we dont have user id in the body then below we want to define that as the one coming from the url
    req.body.user = req.user.id; // we get req.user from the protect middleware as there in protect middleware -> req.user = currentUser ; So we got id here of currently logged-in user -> req.user.id
  }

  next();
};

exports.getReview = factory.getOne(Review);

exports.createReview = factory.createOne(Review); //Review = model name

//Writing FACTORY FUNCTIONS: ie f'n that returns another f'n (and in this case handler f'ns like getAllReviews, createReviews, getAllTours etc..).
//contd.. So by using factory f'ns we are actually eliminating duplication of code in our handler f'ns across controllers (ie for e.g. getAllTours and getAllReviews in tourController and reviewController respectively have a lot of code same/similarities and by using factory f'ns we want to remove these type of duplication of code across all handler f'ns (like for creating (like createReview handler and createTour handler), deleting, updating etc..) in all controllers)
//in handlerFactory.js

exports.updateReview = factory.updateOne(Review); //Review = Model name

exports.deleteReview = factory.deleteOne(Review); //Review = Model name

//We're going to calculate the avg rating of reviews and also the no of ratings/reviews of a tour each time that a new review/rating is added to that tour or also when a review/rating is updated or deleted
//..contd coz that's exactly the situations when the no of ratings/reviews or avg rating of reviews might change
//..contd And we implement it this way:- in reviewModel, we're gonna create a new f'n ( and for that we're actually gonna write a STATIC METHOD on our schema and its a feature of mongoose) which will take in a tour id and calculate the avg rating of reviews and the no of ratings/reviews in our collection for that exact tour. And in the end, the f'n will even update the corresponding tour document
//..contd and then in order to use that f'n, we will use middleware to basically call this f'n each time that there is a new review or one is updated or deleted
//..contd STATIC METHOD can be called on the Model directly like  (and instance method can be called on docs)
