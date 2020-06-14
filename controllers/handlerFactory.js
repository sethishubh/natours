//Writing FACTORY FUNCTIONS: ie f'n that returns another f'n (and in this case handler f'ns like getAllReviews, createReviews, getAllTours etc..).
//contd.. So by using factory f'ns we are actually eliminating duplication of code in our handler f'ns across controllers (ie for e.g. getAllTours and getAllReviews in tourController and reviewController respectively have a lot of code same/similarities and by using factory f'ns we want to remove these type of duplication of code across all handler f'ns (like for creating (like createReview handler and createTour handler), deleting, updating etc..) in all controllers)
//in handlerFactory.js

const catchAsync = require('../utilities/catchAsync');
const AppError = require('../utilities/appError');
const APIFeatures = require('./../utilities/apiFeatures');

//Model below = Tour/Review/User etc.., doc = tour, review, user etc.. any doc
exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id); //Model = Tour/Review/User etc.., doc = tour, review, user etc.. any doc
    // So this Model in await Model.findByIdAndDelete in this inner f'n (ie catchAsync() ) will get access to the variable of outer f'n ie Model in exports.deleteOne = (Model)(ie exports.deleteOne = (Model) ) <- and this concept is bsically called JS Closures
    //If there is no doc/tour/review/user etc.. for given id then 'doc/tour/review/user etc..' below in if = null( or false) and then (!false) = true
    if (!doc) {
      //So if there is no tour then we want to  create next() with an error so to jump into our error handling middleware
      return next(new AppError('No document found with that id', 404));
      //we want to return this above f'n immediately and not move on to next line as there is an error above
    }

    res.status(204).json({
      status: 'success',
      data: null,
    });
  });

// exports.deleteTour = catchAsync(async (req, res, next) => {
//   const tour = await Tour.findByIdAndDelete(req.params.id);

//   //If there is no tour for given id then 'tour' below in if = null( or false) and then (!false) = true
//   if (!tour) {
//     //So if there is no tour then we want to  create next() with an error so to jump into our error handling middleware
//     return next(new AppError('No tour found with that id', 404));
//     //we want to return this above f'n immediately and not move on to next line as there is an error above
//   }

//   res.status(204).json({
//     status: 'success',
//     data: null,
//   });
// });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    // Below method is for only PATCH request and will not work for PUT req coz it will update only some fields NOT ALL
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }); //Here new will return updated doc instead of original doc, req.body is the data that we want to change

    //If there is no doc/tour for given id then 'doc/tour' below in if = null( or false) and then (!false) = true
    if (!doc) {
      //So if there is no doc/tour then we want to  create next() with an error so to jump into our error handling middleware
      return next(new AppError('No document found with that id', 404));
      //we want to return this above f'n immediately and not move on to next line as there is an error above
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

//

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    //We called next f'n to pass the error into it so that then can be handled in the global error handling middleware
    const doc = await Model.create(req.body); //Newly created doc will be saved in doc

    res.status(201).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

//

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    //popOptions = populate options
    let query = Model.findById(req.params.id);
    //console.log(popOptions);
    if (popOptions) {
      query = query.populate(popOptions);
    }
    const doc = await query;

    //const tour/doc = await Tour/Model.findById(req.params.id).populate('guides'); // or  Tour.findOne({_id: req.params.id})
    // 'guides' = popOptions
    //const doc = await Model.findById(req.params.id).populate('reviews'); //reviews = name of the field in o/p/results in postman we want to populate and we are using virtual populate here

    //If there is no tour for given id then 'tour' below in if = null( or false) and then (!false) = true
    if (!doc) {
      //So if there is no tour then we want to  create next() with an error so to jump into our error handling middleware
      return next(new AppError('No document found with that id', 404));
      //we want to return this above f'n immediately and not move on to next line as there is an error above
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc,
      },
    });
  });

//

exports.getAll = (Model) =>
  catchAsync(async (req, res, next) => {
    //Below To allow for nested GET reviews on Tour in  getAllReviews in reviewController.js
    //So below if there is a req -> GET /tour/567767/reviews (ie GET /tour/567767/reviews -> ie GET All Reviews on/for a Tour with tour id 567767) then that means there is tour Id of 567767 so we will get reviews for this tour id only and NOT all the reviews for all the tours
    //contd.. And if there is a req -> GET /reviews ie we want all the reviews for all the tours (as there is no tour id parameter in url) then the filter below -> filter = {} -> an empty object and we will get all the reviews for all the tours from db

    let filter = {};

    if (req.params.tourId) {
      filter = { tour: req.params.tourId };
    }

    // EXECUTE QUERY
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    const doc = await features.query;

    //const doc = await features.query.explain();
    //or const doc = await features.query.explain("executionStats"); // executionStats = field in o/p/results in postman
    //And see "totalDocsExamined" = no of docs scanned/examined in db that match this query.And To scan ALL the docs in db/collection for executing this query can significantly reduce performance of ur app (as it will affect the read performance of this query) coz we may have millions of docs in our collection and scanning ALL the docs in a collection would be time-consuming and in-efficient
    // nReturned = no of docs returned as o/p/results in postman that match the query
    //..Contd and so to solve this, we use "MongoDb INDEXING". Indexing creates indexes of specific fields(that are in our db -> like name of user in Users collection) WHICH WE QUERY A LOT. Here index is like index in the starting of our book ie for chapter 1, 2 etc..
    //MongoDb automatically creates an index on the Id field by default and it makes it "UNIQUE" there (see indexes tab in Mongo shell app and there we will see that index of the id has UNIQUE property there)
    // So index = ordered list of all the field's values sorted in asc or desc order
    //..contd So whenever docs are queried by the index's field names (like by the id), MongoDb then will search that ordered list(index) instead of searching/scanning through the ALL/whole collection
    // So in summary, w/o an index, mongo has to look/scan at each doc in collection one by one  but with an index on the field that we are querying for, this process of searching/scanning becomes much more faster And we can set our own indexes on fields THAT WE QUERY THE MOST/A LOT(ie very often)
    //..contd So if we have a collection with a high write-read ratio, so a collection that is mostly writen to, then it would make no sense to create an index on any field in this collection coz the cost of always updating the index and keeping in memory/db(ie also keeping it updated in collection in db in addition to in indexes tab -> ie field values of indexes are updated at two places that is one in indexes tab and one in collection tab and also indexes also occupies space in db ) clearly outweighs the benefit of having the index in first place if we rarely have searches/queries for that collection
    //Now go to tourModel for defining our own index
    //now totalDocsExamined in executionStats in explain("executionStats") after implementing indexing (in tourModel) will be reduced no. So now due to indexing, we will scan less no of docs for same query executed before w/o indexing
    //See mongodb bookmarked page in chrome in phone for more details, and downloaded image

    //const doc = await features.query.explain();

    // query.sort().select().skip().limit()

    // SENDING RESPONSE

    res.status(200).json({
      status: 'success',
      results: doc.length, //tours/doc.length = no of tours/docs in results/db
      data: {
        data: doc,
      },
    });
  });
