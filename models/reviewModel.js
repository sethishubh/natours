const mongoose = require('mongoose');
const Tour = require('./tourModel');

//Creating Reviews db Schema
const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty'],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5, //min and max only work for numbers
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    //Review actually of course needs to belong to a tour and it also needs an author/user and implementing it by parent referencing (coz we don't want huge arrays in parent elements which could have happened if we would've implemented this by using child referencing to review in User Model itself)
    //Referencing this review to the tour it belongs to, below by using parent referencing
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour', //ie Referencing this Review to Tour model/collection/dataset
      //So above, each review doc now knows exactly what tour it belongs to, while the tour of course doesn't know initially what reviews and how many reviews there are, so basically in parent referencing, the parent (tour here) does not know about its children (user, reviews). And so to solve this kind of problem of parent not knowing about its childs in parent referencing, mongoose gives us a feature called 'Virtual Populate'.
      //contd.. In VIRTUAL POPULATE, we can actually populate tour with reviews so in other words, we can get access to all the reviews for a certain tour but w/o keeping this array of review ids on the tour collection
      //..contd So think of this virtual populate like a way of keeping that array of review ids on a tour, but w/o actually persisting/saving it to the db and we implemented it in tourModel in tourSchema.virtual('reviews'...).

      required: [true, 'Review must belong to a tour'],
    },
    //Referencing this review to the user who wrote this Review, below by using parent referencing
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user'],
    },
  },
  {
    //Above is schema definition, Below is schema options
    //Each time data is outputted as json in postman, we want virtual proerties(ie properties/fields that are actually not stored in db and are actually calculated using some other values) enabled/to be part of o/p results in postman
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    //Each time data is outputted as object in postman, we want virtual proerties to be part of o/p
  }
);

// CREATING COMPOUND INDEX ON REVIEWs to PREVENT DUPLICATE REVIEWS/Ratings ON TOURS/One Tour BY THE SAME USER
//So in postman Create New Review on Tour should allow only one review/rating creation for one tourId by that user (index in db will be tour_1_user_1) ; and if we try to create multiple reviews on same tour Id for that tour by the same user, we will get this error in postman - "errmsg": "E11000 duplicate key error collection: natours.reviews index: tour_1_user_1 dup key: { tour: ObjectId('5ec363e82ee6170b84972724'),
//So we will not be able to create two reviews/ratings for one tourId coming from the same user(ie from same logged-in user)
//Preventing users from writing multiple reviews for the same/one tour ie preventing duplicate reviews. so each user should only review each tour once
//So a duplicate review happens when there is a review with the same user and the same tourId, and thats we want to avoid from happening
//..contd And obvious solution here is to just use a unique index, however it is not enough to set both these fields to unique and that will be very wrong coz doing this would mean that each tour can get only one review and each user can only write one review and thats not what we want,
//..contd So what we need here is them both Together to be unique, So the Combination of user and tour to be always unique
//..contd So the soln is - to create compound index on reviews (we created compound index on the tour before in tourModel so go to tourModel for details)
reviewSchema.index({ tour: 1, user: 1 }, { unique: true }); //So each combination of tour and user has always to be unique

//

//Populating the reviews (like we did in tourModel) with both the user and tour data so that both the tour and the user will be automatically populated each time there is a query for a review
//..contd and so implementing it by using pre-find query middleware below
reviewSchema.pre(/^find/, function (next) {
  //this in the query middleware always points to the current mongoose db query
  // this.populate({
  //   path: 'tour', //So field with exact same name as 'tour' ( ie in schema above -> tour: { type: mongoose.Schema.ObjectId,.. } ) is going to be populated based on the touModel( tourModel coz we specified ref: 'Tour', there above)  )
  //   select: 'name',
  // }).populate({
  //   //Calling populate again as we want to populate multiple fields now (as query above is populated with tour and now below we want to populate this query with the user)
  //   path: 'user',
  //   select: 'name photo', //ie we want to show only name and photo of user in o/p(results) in postman and not other details of user like email etc..
  // });

  this.populate({
    path: 'user',
    select: 'name photo', //ie we want to show only name and photo of user in o/p(results) in postman and not other details of user like email etc..
  });

  next();
});

//

// STATIC METHOD
//These comments below are copied From reviewController
//We're going to calculate the (statistics of the avg and no of ratings/reviews for the tourId for which the current review was created ) avg rating of reviews and also the no of ratings/reviews of a tour each time that a new review/rating is added to that tour or also when a review/rating is updated or deleted and we calculate these stats below by using STATIC METHOD (ie we create calcAverageRatings() f'n as a static method blow )
//..contd coz that's exactly the situations when the no of ratings/reviews or avg rating of reviews might change
//..contd And we implement it this way:- in reviewModel, we're gonna create a new f'n ( and for that we're actually gonna write a STATIC METHOD on our schema and its a feature of mongoose) which will take in a tour id and calculate the avg rating of reviews and the no of ratings/reviews in our collection for that exact tour. And in the end, the f'n will even update the corresponding tour document
//..contd and then in order to use that f'n, we will use middleware to basically call this f'n each time that there is a new review or one is updated or deleted
//..contd STATIC METHOD can be called on the Model directly (like Model.aggregate(), so we call aggregate() on the model directly and thats why we're using static method here below) (and instance method can be called on docs)
// tourId in function(tourId) below = tour Id actually = tour id is of course for the tour to which the current review belongs to
//calcAverageRatings = name of the f'n, statics = for static method
reviewSchema.statics.calcAverageRatings = async function (tourId) {
  //to do the calculation, we will use the aggregation pipeline below
  //in a static method like this one, the 'this' keyword points to the current Model
  //Below-> this(or 'Model' here coz it is a static method we're in and 'this' keyword in a static method = current Model).aggregate(), so we need to call aggregate() ALWAYS on the model directly and thats why we're using static method here(coz in only static method 'this' keyword points to -> current Model and we need to call aggregate() ALWAYS on a Model ONLY)
  const stats = await this.aggregate([
    //first step is to select all the reviews that belong to the current tour that was passed in as the argument into this f'n (ie reviews for tour for tourId in function (tourId))
    {
      $match: { tour: tourId }, //selecting the tour that we actually want to update; selecting all the reviews that matched the current tourId
    },
    {
      $group: {
        _id: '$tour', //tour = common field that all of the docs have in common that we want to group by, so grouping all the tours together by tour
        nRating: { $sum: 1 }, //ie no of ratings: adding 1 to each tour that we have/ so adding 1 to each tour that was matched in the previous/above step, so if there are five review docs for the current tour, then for each of these docs one (1) will get added and so in the end the no of ratings/reviews will be 5
        avgRating: { $avg: '$rating' }, //avgRating= Avg of all the ratings; Each review has a 'rating' field in schema above and so that's where we want to calculate the avg from
      },
    },
  ]);
  console.log(stats); // [ { _id: 5ec363e82ee6170b84972724, nRating: 5, avgRating: 3.8 } ] nRating = no of ratings/reviews, avgRating = avg of all the ratings/reviews

  if (stats.length > 0) {
    // stats = array; ie if stats array has some matching reviews
    //Below Persisting/saving (into db) the above calculated stats/statistics into the tour doc we created review on
    //..Contd so below Finding the current tour and then updating it
    //So below saving the above calculated stats to the current tour into db
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].nRating, // coz stats = array
      ratingsAverage: stats[0].avgRating, // coz stats = array
    });
  } else {
    //ie if stats array has no matching reviews ie if stats array is empty then we set ratingsQuantity and ratingsAverage to 0 and 4.5 respectively which are default values
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0, // coz stats = array
      ratingsAverage: 4.5, // coz stats = array
    });
  }
};

//Now we need to call this above calcAverageRatings() f'n defined above, otherwise these above statistics will never get called
//And we will call this above calcAverageRatings() f'n defined above, using pre-save middleware each time that a new review is created
//Below calling above calcAverageRatings() f'n after a new review has been created
//we below used post and not pre coz only after the review/doc is already saved to the db, it makes sense to then calculate the ratings
reviewSchema.post('save', function () {
  // this points to the doc that is currently being saved (ie points to current Review)
  //Review.calcAverageRatings() coz calcAverageRatings() f'n can be called on a Model ONLY as calcAverageRatings() is a static method and static methods can be called ONLY on Model and also as explained in comments above
  //this.constructor points to current Model coz 'this' = current doc and constructor is the model who created that doc
  //calcAverageRatings() f'n can be called on a Model ONLY as calcAverageRatings() is a static method and static methods can be called ONLY on Model and also as explained in comments above
  //Review.calcAverageRatings(this.tour); //this.tour = tourId of current review; tour field in o/p/results in postman of this GET review -> tour which is tourId actually (ie tour:8r5676745747fdc647 where 8r5676745747fdc647 = tourId)
  this.constructor.calcAverageRatings(this.tour);
});

//We also want to update the statistics (stats) whenever a new review is edited or deleted coz these actions will also affect no of ratings/reviews and avg ratings of all the reviews
//So below is Part-2 of calculating the review stats, so this time when a review is updated or deleted.
//This part is a bit harder coz a review is updated or deleted using findByIdAndUpdate and findByIdAndDelete and so for these (ie for findByIdAndUpdate and findByIdAndDelete), we actually do not have doc middleware, but only query middleware and so in query we actually dont have direct access to the current doc/review in order to do something similar to what we did above (this.constructor.calcAverageRatings(this.tour)) coz we need access to the current review/doc so that from there we can extract the tourId and then calculate the stats from it
//..contd But there is a trick to go around this problem and that is to use regular expression on pre-middleware for a string starting with findOneAnd below (and which will work for findByIdAndUpdate and findByIdAndDelete )
reviewSchema.pre(/^findOneAnd/, async function (next) {
  //So Below our goal here is to get access to the current review doc, but here 'this' keyword is the current query so we go around this problem by executing a query(findOne()->So basically retrieving the current doc from the db ; and then we then store it on 'the current query variable'->'this') and then that will give us the doc that is currently being processed and to use that, we can use findOne
  //const r = await this.findOne(); //r = review doc and this r gives us tourId in o/p/results in postman and that is we will need to caclculate the avg ratings
  this.r = await this.findOne(); //this.r = review doc
  console.log(this.r);
  next();
});

//Process of below code in postman - Get _id from POST Create New Review on Tour and then with that id Go to Update Review; We can also Delete reviews and then that will be updated in no of ratings/reviews (ie nRating field, and avgRating field) and avg ratings of all the reviews as well
//below code is also part of part-2
//So here at below line of code, so at this point in time so after the query has already finished and so therefore the review has been updated, this is a perfect point in time where we can then call calcAverageRatings() f'n
reviewSchema.post(/^findOneAnd/, async function () {
  // await this.findOne(); does NOT work here coz query has already executed
  //But from where do we get the tourId now here in this f'n And to get tourId here we used a trick:- we pass data from the above pre-middleware to this post-middleware we're in and we id it above in pre-middleware by commenting-//const r = await this.findOne() and replaced it with this.r = = await this.findOne() -> so we created a property(r) on 'this' keyword above (ie this.r) coz here in this post-middleware we're in, we have access to this.r
  await this.r.constructor.calcAverageRatings(this.r.tour); //this.r.tour = tourId of current review(this.r) // tour field in o/p/results in postman -> tour which is tourId actually
  //calcAverageRatings() is a static method and so we need to call it on the model and this.r.constructor = Model
});

//

//Actually creating Review Model and exporting it below
const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
