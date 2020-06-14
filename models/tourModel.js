const mongoose = require('mongoose');
const slugify = require('slugify');
//const validator = require('validator');
//const User = require('./userModel');

//SCHEMAS

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxlength: [40, 'A tour must have less or equal than 40 characters'],
      minlength: [10, 'A tour must have more or less than 10 characters'],
      // validate: [
      //   validator.isAlpha,
      //   'Tour name must only contain characters',
      // ],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        //Accepts array of strings
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating must be above 1.0'],
      max: [5, 'Rating must be below 5.0'],
      set: (val) => Math.round(val * 10) / 10, //for e.g. for val = 4.6666 -> Math.round(val * 10) = 47 (coz rounding of 46.666) and then Math.round(val * 10)/ 10 = 4.7, ; So this set f'n is Used for rounding this field( ie ratingsAverage) ; this setter f'n will be run each time that a new value is set for this field, val -> current value
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        //custom validator below
        //Validator is just a function which returns true or false, if it returns false then there is an error
        //If it returns true then validation is correct and i/p can be accepted
        validator: function (val) {
          //Here val above is priceDiscount that user inputted
          //'this' below points to current doc on NEW doc creation and it will NOT work on updating doc
          //So below function works only for new doc creation ie on .save() method ONLY
          return val < this.price; //ie true/false and true = no error
        },
        message: 'Discount price ({VALUE}) should be below regular price', // VALUE = val ; a mongoose feature
      },
    },
    summary: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String, //Name of the image will be string
    },
    images: [String], //Array of strings
    createdAt: {
      type: Date,
      default: Date.now(), //Timestamp of current millisecond
      select: false, //For hiding this field in response
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false, //so we want to show this in results by default
    },

    //we are using geospatial locations here
    // Geospatial data = data that describes places on earth using longitude and latitude coordinates
    //MongoDb uses a special data format called GeoJSON to specify gepspatial data
    //startLocation: {//GeoJSON } is an embedded object here below and inside this object we specified some properties
    //And in order for this object to be recognized as geo spatial json, we need the type and the coordinates propery as defined below

    startLocation: {
      //GeoJSON
      type: {
        type: String,
        default: 'Point', //Geometries like polygons, lines etc..
        enum: ['Point'], //enum -> All the posssible options this field can take
      },
      coordinates: [Number], //ie array of coordiates/numbers in long,latt
      address: String,
      description: String,
    },

    //Below We're gonna have 'tour locations dataset' embedded/denormalized into this tourModel itself so we're embedding this locations dataset into this tourModel(ie tours collection itself and not creating new separate collection for locations) "by using/defining it as an array"
    // So by specifying an array of objets here this will then create brand new documents inside of the parent document which is in this case, the tour so we embedded the locations into tour collection.
    //So in db, u will find that these locations below have an id field for each location and coz each doc in db has its own id so these locations are also docs within tours collection.
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number], //ie array of coordiates/numbers in long,latt
        address: String,
        description: String,
        day: Number, //Day of the tour in which people will go to this location
      },
    ],
    //tours and guides/users are completely separate entities in db in referencing that we are implementing here
    //..contd so all we save on a certain tour doc is ONLY the ids of the users (NOT all the properties of user / ie NOT the COMPLETE guides doc having many properties like user id + their name, email etc..) that are the tour guides for that specific tour and then when we query the tour, we want to automatically get access to the tour guides but w/o them being actually fully/Completely saved on the tour doc itself
    //guides: Array, <- for commented pre-save middleware defined below
    //we created commented pre-save middleware below to save/EMBED COMPLETE guides (ie user id + their name, email etc.. and NOT Just user id) into tour collection into db on new tour doc creation/ie on .save() and not on .update()

    //Below guides is an array of ONLY user-ids ('ONLY user id of users who are guides and NOT COMPLETE guides doc having other properties too like user id + their name, email etc..' that's why referencing) of users having roles as guide
    //So Implementing referencing of users/guides and tours below by using "Embedding of ONLY ID and NOT COMPLETE guide/user doc" into this tours collection and for this "ONLY Id's" embedding (which is actually referencing by id) into this tours collection, we user array below (coz referencing is also embedding but with embedding ONLY one property that is user id)
    guides: [
      {
        type: mongoose.Schema.ObjectId, //Expecting a mongo id
        ref: 'User', //Reference to User model/collection ie relationship b/w two datasets/collections; works even w/o requiring user model into this file
        //..contd And now we populate this guides field below by using .populate() in pre-query middleware(pre-query middleware coz we want to apply this populate on every mongoose db query that starts with find, else we can use the commented .populate() in getTour in tourController if we only wanted populate there in getTour only. But we used pre-query middleware as we want populate to get applied to all the f'ns like getAllTours, UpdateTour f'ns etc..)
      },
    ],
  },
  {
    //Above is schema definition, Below is schema options
    //Each time data is outputted as json in postman, we want virtual proerties(ie properties/fields that are actually not stored in db and are actually calculated using some other values) enabled/to be part of o/p results in postman
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    //Each time data is outputted as object postman, we want virtual proerties to be part of o/p
  }
);

//Creating our own index for read query performance improvement
//For explanation go to handlerFactory -> getAll
//Below is SINGLE FIELD INDEX coz there is only one field that we created index on/for and that is price
//tourSchema.index({ price: 1 });
//price = name of the field in collection we want to create index for/on, 1/-1 = sorting the price index in asc/desc order
//COMPOUND INDEX Below : Multiple field index
tourSchema.index({ price: 1, ratingsAverage: -1 });
//this above compound index will also work when we query for just one of these two fields (ie price or ratingsAverage) here individually

//Below is Index for tour-slug(ie unique string in url to query for tours)
tourSchema.index({ slug: 1 });

//Below is index for geo-spatial query for startLocation field
//For geo-spatial data, this below index needs to be a 2D sphere index if the data describes real(ie real-world) points on the Earth like sphere (in our case here), Or instead we can also use a 2D index if we're using just fictional points on a simple two dimensional plane ,
//..contd But here in our case, we are talking about real points on the earth's surface and so we're going to use a 2D Sphere Index here below
tourSchema.index({ startLocation: '2dsphere' });
//Above startLocation: '2dsphere' -> so we're telling mongoDb that this startLocation here should be indexed to a 2D Sphere (2D Sphere = Earth like sphere where all our data are located)

//

//Creating virtual property named 'durationWeeks' that will be called every time we get data from db and it is not a real/actual field in db and is just a field that will be shown up in results/o/p in postman
//we cannot use these virtual properties to query data from db as these properties are not part of db actually
tourSchema.virtual('durationWeeks').get(function () {
  //durationWeeks = name of the virtiual field in o/p results in postman
  return this.duration / 7; //this here will point to current document
});

//VIRTUAL POPULATE: Virtually populating tours in tour collection with related/referenced reviews and users(authors of reviews)
//virtual populate will keep a reference to all the child docs (reviews here) on the parent doc (tours collection here) but w/o actually persisiting/saving that information to the db and now after doing this we can just use .populate() on this parent doc (tourModel -> tourController -> getTours) too for knowing about the reviews info this tour has
//for explanation of virtual populate go to reviewModel -> schema -> tour
tourSchema.virtual('reviews', {
  //reviews = name of the virtiual field in o/p results in postman
  ref: 'Review', //Name of the model we want to reference to
  //Below Name of the fields to connect two datasets ie tours connecting with reviews
  foreignField: 'tour', //Name of the field in the other model (Review model here) where reference to the current model (tour model here) is stored. And 'tour' here coz in reviewModel schema we have a field called (this here is written as foreignField: 'tour' -> ) "tour": {type: mongoose.Schema.ObjectId, ...} whereIn the id of the tour is being stored
  localField: '_id', //cont.. _id here coz mongoose.Schema.ObjectId from reviewModel from above comment is stored in this current model(ie tourModel) as _id
}); // And now after writing this code we go to getTour in tourController and to actually populate getTours we used .populate() there and then this virtual populate is complete

//DOCUMENT MIDDLEWARE/HOOK: runs before saving(event) or creating(event) the doc ie before .save() and .create() only

//So this middleware will NOT work on doc update !! . It only works on doc save/create.
//This middleware runs just before the currently processed doc is saved to db
//Thats why it is called pre hook or pre doc middleware
//So it runs before(pre) 'save' event here
//Below function will be called before an actual doc is saved to db
tourSchema.pre('save', function (next) {
  //console.log(this);
  //'this' here is currently processed doc/doc that is going to be saved to db currently
  this.slug = slugify(this.name, { lower: true });
  //this = currently processed doc
  //So above we define property named slug on this/doc
  //this.name = string we want to create slug out of ie slug based on name field
  next();
});

// tourSchema.pre('save', function (next) {
//   console.log('Going to save this doc to db..');
//   next();
// });

// //pre-save middleware to Embed/define 'COMPLETE tour guides or users' as an array (NOT Just user id of users who are guides but complete guide docs having properties id, name, email of users who are guides) into tour collection (and actually Embedding COMPLETE docs on other docs is called embedding and referencing by /saving ONLY user id on other doc is called referencing which we have implemented above in schema) on tour creation (AND NOT on Update)
// tourSchema.pre('save', async function (next) {
//   //this.guides = array of all the user-ids and we loop through them using map and then in each iteration, get the user doc for the current id
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));
//   // guidesPromises =  array of promises
//   this.guides = await Promise.all(guidesPromises); //running above array of promises
//   //current el -> id
//   next();
// });

// //POST DOCUMENT MIDDLEWARE

// //Below 'doc' is doc that was just saved to db
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// //QUERY MIDDLEWARE : allows to run functions before or after a certain query is executed

//PRE-FIND MIDDLEWARE: Pre-find hook: runs before find() query is executed

//'this' here will now point to current query/mongoose query object
//tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } }); //ne = not equal, this=mongoose query so we can chain methods to this query //ie tours that are NOT secret / are normal
  // selecting docs where secrettour ne:true
  //So above we are filtering out secret tours from final results ie we dont show secret tours in results
  // ^ for running this middleware for all commands that start with fin ie findByIdandDelete, findByIdAndUpdate and so on

  this.start = Date.now(); //setting start property to this object (query object is also a object) = current time in ms.
  next();
});

//Use Below code or regular expression above for findOne/findById
// tourSchema.pre('findOne', function (next) {
//   this.find({ secretTour: { $ne: true } });
//   next();
// });

//Pre-query middleware will run before mongoose db query
//Pre-query middleware for populating (/So all of the queries with find will basically populate) the guides field in schema with the referenced user
// /^find/ means all the queries that start with find, findOne, findByIdAndUpdate and it also includes .update() which is actually findByIdAndUpdate
tourSchema.pre(/^find/, function (next) {
  // this points to current query
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

//POST-FIND MIDDLEWARE: Post-find hook: runs after find() query is executed
//Here 'docs' is doc returned after query is executed

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} milliseaconds`);
  //console.log(docs); //docs that matched previous query
  next();
});

//AGGREGATION MIDDLEWARE
//Commenting for removing error in tourController.getDistances ->  "errmsg": "$geoNear is only valid as the first stage in a pipeline.", <- errmsg in postman coz if we run this aggregation middleware defined below then $geoNear will always be second stage but $geoNear always/mandotarily needs to be the first stage in aggregation pipeline for geo-spatial queries and so for making $geoNear as first stage in aggregation pipeline there, we commented below middleware's code

//Pre aggregation hook: runs before current aggregation takes place
//So this below code will ALWAYS ADD the match stage (defined below) before all the other stages in ALL aggregation pipelines
//'this' here is current aggregation object

// tourSchema.pre('aggregate', function (next) {
//   //console.log(this.pipeline()); //result of it is aggregation object array of $match, $group, $sort...that we passed in aggregation pipeline as an array
//   //Applying this aggregation hook before aggregation to filter out secret tours in results of aggregation

//   //So basically adding $match stage in 'this.pipeline' array by using unshift array method,basically to exclude secret tours from the results emerging out of aggregations
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   //So this.pipeline() above = array
//   next();
// });

//

//Creating 'Model' 'T'our out of Schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
