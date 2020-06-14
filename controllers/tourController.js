//const fs = require('fs');
const multer = require('multer');
const sharp = require('sharp');

const Tour = require('./../models/tourModel');
//const APIFeatures = require('./../utilities/apiFeatures');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/appError');
const factory = require('./handlerFactory');

//For detailed explanation of multer, see userController.js
//Below storing the uploaded images(files) in/to the memory and NOT saving it(uploaded images) to the file system
const multerStorage = multer.memoryStorage();

//he below's f'n's goal is basically to test if the uploaded file is an image. And if it is so, then we pass true into the callback function(cb), and if it's not we pass false into the callback function(cb), along with an error. Because again, we do not want to allow files to be uploaded that are not images. And so that's exactly what this filter is for. Now, if in your own application you want to upload something else, let's say CSV files, when then of course you can test for that instead of images. So all the stuff that we're doing here works not only for images, but really for all kinds of files that you want to upload, all right?
//Contd.. Now again, in this case we are really talking about images, and so let's test if the uploaded file is an image by using if() below. And for that we will once more use the mimetype, because whatever image type is uploaded, so no matter if it's a JPEG, or a PNG, or a bitmap, or a TIFF, or really anything, the mimetype will always start with image(ie in console.log(req.file) -> {mimetype: 'image/jpeg', originalname: 'leo.jpg', ....} )
const multerFilter = (req, file, cb) => {
  //Below in if we allow only images to be uploaded as files
  if (file.mimetype.startsWith('image')) {
    //ie we have an image having mimetype that starts with 'image' (ie mimetype: image/jpeg for e.g.)
    cb(null, true); //null-> ie there is no error
  } else {
    //cb(x, false);
    //above x-> error
    cb(new AppError('Not an image! Please upload only images.', 400), false);
  }
};

//Below upload f'n is for IMAGE UPLOAD
//Below dest-> destination -> is exactly the folder where we want to save all the images that are being uploaded.
//const upload = multer({ dest: 'starter/public/img/users' });
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

//Below uploading individual tour images
//Below we actually have multiple files/images to be uploaded and in one of them we have one image(imageCover in tourModel.js schema) and in the other one we have three images (images in tourModel.js schema).
exports.uploadTourImages = upload.fields([
  { name: 'imageCover', maxCount: 1 }, //imageCover-> field name in tourModel.js schema; maxCount: 1 -> ie we can only have 1 field called imageCover vch is then gonna be processed
  { name: 'images', maxCount: 3 }, // images-> field name in tourModel.js schema; and images is an array so it(images) accepts multiple images/files to be uploaded at the same tym
]);
//And if above in case that we didn't have the imageCover and instead only had one field which accepts multiple images or multiple files at the same time, we could have done it like this just below
//Contd.. So when there's one only(image/file to b uploaded), then it's upload dot single (ie upload.single()), and when there is multiple(images/files 2 b uploaded) with the same name, then it's upload dot array (ie upload.array()) and when there's basically a mix of them, then it is upload dot fields (ie upload.fields)
//upload.array('images', 3); //images -> field name in tourModel.js schema ; 3 -> maxCount
//AND upload.single('image') will produce req.file
//AND upload.array('images', 3) will produce req.files -> REQ.FILE'S' coz here mutiple files/images upload at d same tym

exports.resizeTourImages = catchAsync(async (req, res, next) => {
  console.log(req.files);
  //req.file's' -> FOR UPLOADED FILE'S'/IMAGE'S'

  //Below if coz, in case there are no images/files uploaded(ie if(!req.files) ) then we want to move/go straight to the next middleware
  if (!req.files.imageCover || !req.files.images) return next();

  // 1) Processing UPLOADED Cover Image of a individual tour

  let imageCoverFilename = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;

  //Just below -> and now we actually need to make it possible that our update tour handler then picks up this image cover filename to update it in the current tour document, okay? . so now the secret is to actually put this image cover filename on request.body. And of course it is called imageCover (in req.body.imageCover) because that is the name we have in our schema definition. And so then when it's doing the update, it will then match this field in the body with the field in our database.
  imageCoverFilename = req.body.imageCover;

  //For explanation of sharp below, go to userController.js
  await sharp(req.files.imageCover[0].buffer) // imageCover -> array in console.log(req.files);
    .resize(2000, 1333) //2000, 1333 -> width in pixels, height in pixels
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`starter/public/img/tours/${imageCoverFilename}`); //.toFile() -> ie to write this uploaded file to a file/doc on our disk(db) (ie writing the uploaded file(image here) into our file system(disk)). And '`starter/public/img/tours/${imageCoverFilename}`' is the entire path to that file/image. So our uploaded image(file) will be saved to this folder in our file system of our project -> `starter/public/img/tours/${imageCoverFilename}` .
  // So now our individual/specific tour's cover image wud be uploaded in website as well as in postman response in update Tour endpoint

  // 2) Processing Other UPLOADED Images(ie processing uploaded images other than Cover Image)

  req.body.images = [];

  await Promise.all(
    //Promise.all coz we are awaiting the results of awaiting these 3 below images being uploaded below in each of the 3 loop iterations(3 loop iterations coz there r total of 3 images 2 b uploaded) and we are awaiting all those 3 promises returned by each loop iteration(and in each loop iteration 1 image is uploaded and dat returns 1 promise )
    req.files.images.map(async (file, i) => {
      //i -> zero(0) based index of loop's iteration ; file -> current file/image being uploaded
      //Below-> now why do we actually need this const filename below? Well we need it because now we need to push this filename into request.body.images, and so that's the exact same logic as we had above on request.body.imageCover. So remember that in our collection, request.body.images is actually an array. And so now we need to create that array and start it as an empty array above(ie req.body.images = []) and below then in each iteration we will then push the current filename to this above's images array (ie below request.body.images.push(filename)).
      const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`; //ie current filename/imageName in current loop iteration

      await sharp(file.buffer) //file -> current file/image being uploaded in the loop iteration
        .resize(2000, 1333)
        .toFormat('jpeg')
        .jpeg({ quality: 90 })
        .toFile(`starter/public/img/tours/${filename}`);

      req.body.images.push(filename);
      //Now other 3 specific tour's images will be uploaded in tour detail page on our website
      //Now There's just one small problem, which is the fact that we're actually not using async await correctly here in this case, so in this map loop above. And that's because this async await here above(ie map(async (file, i) .. and await sharp..) is only inside of map's callback function's loop. And so that will actually not stop the code from moving right next to this line below where we then call the next middleware, okay? So again, right now we are actually not awaiting any of this here, again, because this async await happens inside of the callback function of one of these loop methods(map above). And there is fortunately a solution for this, because since map/foreach is an async function here above, it(map/foreachBeforeMap) will return a new promise. And so if we do a map, we can then actually save an array of all of these promises. And then if we have an array we can use promise.all to await all of them. And so with that we will then actually await until all this code, and in this case, until all this image processing is done, and only then move on to the next line, which is calling the next middleware to really update the tour documents.And if we didn't do that in this case, it would really not work at all, because without this pushing here, the request.body.images would still be empty when we call next. And so therefore, none of these image names would then be persisted into the document, okay? So let's now use promise.all above.So await Promise.all on the array returning from this, okay?
      //Contd.. And we use map so that we can basically save the three promises which are the result of these three async functions here in the map loop above, so we can then await all of them here above using Promise.all.And only after that we then move on to the actual tour update handler, okay?
    })
  );

  //

  next();
});

// const toursObj = JSON.parse(
//   fs.readFileSync(
//     `${__dirname}/../starter/dev-data/data/tours-simple.json`
//   )
// );

////Route handler functions

//CheckId middleware
// exports.checkId = (req, res, next, val) => {
//   console.log(`Tour id is ${val}`);
//   if (req.params.id * 1 > toursObj.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid id',
//     });
//   }
//   next();
// };

// exports.checkBody = (req, res, next) => {
//   if (!req.body.name || !req.body.price) {
//     return res.status(400).json({
//       status: 'fail',
//       message: 'Missing name or price',
//     });
//   }
//   next();
// };

//exports.updateTour = (req, res) => {
// if (req.params.id * 1 > toursObj.length) {
//   return res.status(404).json({
//     status: 'fail',
//     message: 'Invalid id',
//   });
// }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: 'Updated tour',
//     },
//   });
// };

// exports.updateTour = async (req, res) => {
//   try {
//     // Below method is for only PATCH request and will not work for PUT req coz it will update only some fields NOT ALL
//     const tour = await Tour.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       {
//         new: true,
//         runValidators: true,
//       }
//     ); //Here new will return updated doc instead of original doc, req.body is the data that we want to change

//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour: tour,
//       },
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'fail',
//       message: err,
//     });
//   }
// };

//RECENT Commented
// exports.updateTour = catchAsync(async (req, res, next) => {
//   // Below method is for only PATCH request and will not work for PUT req coz it will update only some fields NOT ALL
//   const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
//     new: true,
//     runValidators: true,
//   }); //Here new will return updated doc instead of original doc, req.body is the data that we want to change

//   //If there is no tour for given id then 'tour' below in if = null( or false) and then (!false) = true
//   if (!tour) {
//     //So if there is no tour then we want to  create next() with an error so to jump into our error handling middleware
//     return next(new AppError('No tour found with that id', 404));
//     //we want to return this above f'n immediately and not move on to next line as there is an error above
//   }

//   res.status(200).json({
//     status: 'success',
//     data: {
//       tour: tour,
//     },
//   });
// });

exports.updateTour = factory.updateOne(Tour); //Tour = Model name

// exports.updateTour = async (req, res) => {
//   try {
//     // Below method is for only PATCH request and will not work for PUT req coz it will update only some fields NOT ALL
//     const tour = await Tour.findByIdAndUpdate(
//       req.params.id,
//       req.body,
//       {
//         new: true,
//         runValidators: true,
//       }
//     ); //Here new will return updated doc instead of original doc, req.body is the data that we want to change

//     res.status(200).json({
//       status: 'success',
//       data: {
//         tour: tour,
//       },
//     });
//   } catch (err) {
//     res.status(400).json({
//       status: 'fail',
//       message: err,
//     });
//   }
// };

//exports.createTour = (req, res) => {
//console.log(req.body);
// const newId =
//   toursObj[toursObj.length - 1].id + 1;
// const newTour = Object.assign(
//   { id: newId },
//   req.body
// );

// toursObj.push(newTour);

// fs.writeFile(
//   `${__dirname}/starter/dev-data/data/tours-simple.json`,
//   JSON.stringify(toursObj),
//   (err) => {
// res.status(201).json({
//   status: 'success',
// data: {
//   tour: newTour,
// },
//   });
// };
//   );
// };

//Creating f'n to catch async f'n errors in catch block
//In order to get rid of our try catch blocks, we wrapped async f'n 'below' inside of the catchAsync f'n that we just created here
//And this just below catchAsync f'n will return new anonymous arrow f'n which will then be assigned to createTour
//So it is this just below created returned f'n that will be called as soon as new tour is created using createTour handler
//Now this return f'n will call the "fn" f'n that we passed in initially just below and it will then execute all our code in async f'n
//Now as it is an async f'n, it will return a promise and in that case if there is an error in promise, we can then catch the error that occurred using catch metod

// const catchAsync = (fn) => {
//   return (req, res, next) => {
//     fn(req, res, next).catch(next); //next ='(err) => next(err)'
//   };
// };

//RECENT Commented
// exports.createTour = catchAsync(async (req, res, next) => {
//   //we called next f'n to pass the error into it so that then can be handled in the global error handling middleware
//   const newTour = await Tour.create(req.body); //Newly created doc will be saved in newTour

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
// });
exports.createTour = factory.createOne(Tour); //Tour = model name

// exports.createTour = catchAsync(async (req, res, next) => {
// we next f'n to pass the error into it so that then can be handled in the global error handling middleware
// try {
//   const newTour = await Tour.create(req.body); //Newly created doc will be saved in newTour

//   res.status(201).json({
//     status: 'success',
//     data: {
//       tour: newTour,
//     },
//   });
// } catch (err) {
//   res.status(400).json({
//     status: 'fail',
//     message: err,
//   });

// exports.getTour = (req, res) => {
//   console.log(req.params);
//   const id = req.params.id * 1;

// const tour = toursObj.find((el) => {
//   return el.id === id;
// });

// // if (id > toursObj.length) {
// if (!tour) {
//   return res.status(404).json({
//     status: 'fail',
//     message: 'Invalid id',
//   });
// }

//console.log(tour);
// res.status(200).json({
//   status: 'success',
//   data: {
//     tour: tour,
//   },
// });
//};

//RECENT Commented
// exports.getTour = catchAsync(async (req, res, next) => {
//   //const tour = await Tour.findById(req.params.id).populate('guides'); // or  Tour.findOne({_id: req.params.id})
//   const tour = await Tour.findById(req.params.id).populate('reviews'); //reviews = name of the field in o/p/results in postman we want to populate and we are using virtual populate here
//   // const tour = await Tour.findById(req.params.id).populate({
//   //   path: 'guides',
//   //   select: '-__v -passwordChangedAt',
//   // });
//   //Here id in req.params.id is  id in router ".route('/:id')" in tourRoutes.js
//   //USING POPULATE above in order to get access to the referenced COMPLETE tour guides(in tourModel.js in ref: 'User') from user id, whenever we query for a certain tour
//   //So we used populate to basically replace 'the fields that we referenced' with the actual related data (ie with Complete data of 'user' in "guides: {ref: 'User'}") and the result of that will look as if the data has always been embedded when in fact, it is in a completely different/separate collection
//   //So with populate we replace 'the referenced user ids' with 'the actual complete data of the user with that id and not just his user id'.
//   //Populate process always happens ONLY in a query (And behind the scenes mongoose does this db query and so using populate affects performance) and NOT in the actual db; populate('name of the field that we want to populate in schema/db') or path: name of the field we want to populate in schema/db, select: options that we don't want to show up in o/p(results) in postman
//   //So, populate = filling up the field called guides in our model as the guides field in schema only contains reference and we are gonna fill it up with the actual data(ie COMPLETE data of users who are guides)

//   //If there is no tour for given id then 'tour' below in if = null( or false) and then (!false) = true
//   if (!tour) {
//     //So if there is no tour then we want to  create next() with an error so to jump into our error handling middleware
//     return next(new AppError('No tour found with that id', 404));
//     //we want to return this above f'n immediately and not move on to next line as there is an error above
//   }

//   res.status(200).json({
//     message: 'success',
//     data: {
//       tour,
//     },
//   });
// });
exports.getTour = factory.getOne(Tour, { path: 'reviews' }); //Tour = Model name, path: 'review' -> field we want to populate

// exports.getTour = async (req, res) => {
//   try {
//     const tour = await Tour.findById(req.params.id); // or  Tour.findOne({_id: req.params.id})
//     //Here id in req.params.id is  id in router ".route('/:id')" in tourRoutes.js

//     res.status(200).json({
//       message: 'success',
//       data: {
//         tour,
//       },
//     });
//   } catch (err) {
//     res.status(404).json({
//       status: 'fail',
//       message: err,
//     });
//   }
// };

// exports.getAllTours = (req, res) => {
//   res.status(200).json({
//     message: 'success',
//     requestedAt: req.requestTime,
// results: toursObj.length, //no of tours
// data: {
//   tours: toursObj, // tours(resouce) : toursObj
// },
//   });
// };

exports.aliasTopTours = (req, res, next) => {
  // prefilling parts of query object in url before we then reach the getAllTours handler
  // for implementing url-> tours?limit=5&sort=-ratingsAverage,price&fields=name,price,ratingsAverage,summary,difficulty
  // or for implementing tours/top-5-cheap

  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

//

//RECENT Commented
// exports.getAllTours = catchAsync(async (req, res, next) => {
//   console.log('in getalltours');
//   // EXECUTE QUERY

//   const features = new APIFeatures(Tour.find(), req.query)
//     .filter()
//     .sort()
//     .limitFields()
//     .paginate();
//   //console.log(await features.query);
//   const tours = await features.query;

//   // query.sort().select().skip().limit()

//   // SENDING RESPONSE
//   //console.log(tours);

//   res.status(200).json({
//     status: 'success',
//     results: tours.length, //no of tours in results/db
//     data: {
//       tours,
//     },
//   });
// });
exports.getAllTours = factory.getAll(Tour); //Tour = Model name

//

// exports.getAllTours = async (req, res) => {
//   try {
//     // EXECUTE QUERY

//     const features = new APIFeatures(Tour.find(), req.query)
//       .filter()
//       .sort()
//       .limitFields()
//       .paginate();

//     const tours = await features.query;
//     // query.sort().select().skip().limit()

//     // SENDING RESPONSE

//     res.status(200).json({
//       message: 'success',
//       data: {
//         tours,
//       },
//     });
//   } catch (err) {
//     res.status(404).json({
//       status: 'fail',
//       message: err,
//     });
//   }
// };

//AGGREGATION PIPELINES

exports.getTourStats = catchAsync(async (req, res, next) => {
  //Below are aggregation stages and are array of objects run in sequence one by one
  console.log(process.env.NODE_ENV);
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        _id: '$difficulty', //what we want docs to group by. here it will be grouped by difficulty ie by difficulty medium, easy, hard
        //_id: null, // what we want to group by null means we want only 1 group
        numTours: { $sum: 1 }, // ie adding 1 every time docs go through these pipeline stages
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 }, //Sorting above results ie docs from group stage by avgPrice and 1 for asc order
    },
    // {
    //   $match: { _id: { $ne: 'easy' } }, //Now _id:'$difficulty' from above and ne -> not equal so now getting results excluding difficulty:easy
    // },
  ]);

  res.status(200).json({
    message: 'success',
    data: {
      stats,
    },
  });
});

// exports.getTourStats = async (req, res) => {
//   try {
//     //Below are aggregation stages and are array of objects run in sequence one by one
//     const stats = await Tour.aggregate([
//       {
//         $match: { ratingsAverage: { $gte: 4.5 } },
//       },
//       {
//         $group: {
//           _id: '$difficulty', //what we want docs to group by. here it will be grouped by difficulty ie by difficulty medium, easy, hard
//           //_id: null, // what we want to group by null means we want only 1 group
//           numTours: { $sum: 1 }, // ie adding 1 every time docs go through these pipeline stages
//           numRatings: { $sum: '$ratingsQuantity' },
//           avgRating: { $avg: '$ratingsAverage' },
//           avgPrice: { $avg: '$price' },
//           minPrice: { $min: '$price' },
//           maxPrice: { $max: '$price' },
//         },
//       },
//       {
//         $sort: { avgPrice: 1 }, //Sorting above results ie docs from group stage by avgPrice and 1 for asc order
//       },
//       // {
//       //   $match: { _id: { $ne: 'easy' } }, //Now _id:'$difficulty' from above and ne -> not equal so now getting results excluding difficulty:easy
//       // },
//     ]);

//     res.status(200).json({
//       message: 'success',
//       data: {
//         stats,
//       },
//     });
//   } catch (err) {
//     res.status(404).json({
//       status: 'fail',
//       message: err,
//     });
//   }
// };

exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  //Counting Busiest Month
  //Counting how many tours there are for each of the month in a given year
  const year = req.params.year * 1;

  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
      //Deconstruct an array field from i/p doc  and then o/p one doc for each element of array
      //ie One tour for each of the startDates in array of all tours
      //One doc for each of the startDates
    },
    {
      //Selecting docs for one year that was passed in through url
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`), //First day of the year
          $lte: new Date(`${year}-12-31`), //Last day of the year
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' }, //grouping by month, jan=1, feb=2, dec=12
        //using $month aggregation operator to extract month from date
        numTourStarts: { $sum: 1 }, //counting no of tours for above particular month
        tours: { $push: '$name' }, //creating tours array with name of tours for above particular month
      },
    },
    {
      $addFields: { month: '$_id' }, //adding new field -> with name of the field 'month' and value '_id'
    },
    {
      $project: {
        _id: 0, // O for hiding '_id' field in results and 1 for showing
      },
    },
    {
      $sort: { numTourStarts: -1 }, // Sorting by numTourStarts in desc (-1) order
    },
    {
      $limit: 12, // Limiting no of outputs/results
    },
  ]);

  res.status(200).json({
    message: 'success',
    data: {
      plan,
    },
  });
});

// exports.getMonthlyPlan = async (req, res) => {
//   try {
//     //Counting Busiest Month
//     //Counting how many tours there are for each of the month in a given year
//     const year = req.params.year * 1;

//     const plan = await Tour.aggregate([
//       {
//         $unwind: '$startDates',
//         //Deconstruct an array field from i/p doc  and then o/p one doc for each element of array
//         //ie One tour for each of the startDates in array of all tours
//         //One doc for each of the startDates
//       },
//       {
//         //Selecting docs for one year that was passed in through url
//         $match: {
//           startDates: {
//             $gte: new Date(`${year}-01-01`), //First day of the year
//             $lte: new Date(`${year}-12-31`), //Last day of the year
//           },
//         },
//       },
//       {
//         $group: {
//           _id: { $month: '$startDates' }, //grouping by month, jan=1, feb=2, dec=12
//           //using $month aggregation operator to extract month from date
//           numTourStarts: { $sum: 1 }, //counting no of tours for above particular month
//           tours: { $push: '$name' }, //creating tours array with name of tours for above particular month
//         },
//       },
//       {
//         $addFields: { month: '$_id' }, //adding new field -> with name of the field 'month' and value '_id'
//       },
//       {
//         $project: {
//           _id: 0, // O for hiding '_id' field in results and 1 for showing
//         },
//       },
//       {
//         $sort: { numTourStarts: -1 }, // Sorting by numTourStarts in desc (-1) order
//       },
//       {
//         $limit: 12, // Limiting no of outputs/results
//       },
//     ]);

//     res.status(200).json({
//       message: 'success',
//       data: {
//         plan,
//       },
//     });
//   } catch (err) {
//     res.status(404).json({
//       status: 'fail',
//       message: err,
//     });
//   }
// };

exports.deleteTour = factory.deleteOne(Tour);

//RECENT/Latest commented
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

//OLD Commented
// exports.deleteTour = async (req, res) => {
//   try {
//     await Tour.findByIdAndDelete(req.params.id);

//     res.status(204).json({
//       status: 'success',
//       data: null,
//     });
//   } catch (err) {
//     res.status(404).json({
//       status: 'fail',
//       message: err,
//     });
//   }
// };

//

//Below with geo-spatial query that we defined below , we basically find the docs/tours that are located within a certain distance of our starting point(ie point where we live)
//For below -> /tours-within/:distance/center/:latlng/unit/:unit
// /tours-within/233/center/-40.2343,45.2343/unit/km , so distance = 233, center/co-ordinates in lat,long = -40.2343,45.2343 and unit of distance = km
exports.getToursWithin = catchAsync(async (req, res, next) => {
  const { distance, latlng, unit } = req.params; // Using destructuring ie const distance = req.params.distance
  //Below Creating two separate variables lat and long from latlng(defined above) by splitting latlng
  //distance, latlng, unit = parameters in above url; latlng = string and thus we use .split() on it(string) to split it by comma(,)
  const [lat, lng] = latlng.split(','); //latlng.split(',') = array of two elements after splitting and then so we can use destructuring now

  const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1; //const radius =  radius of sphere in radians, ; radius of the earth in miles/kms = 3963.2/6378.1 ;  === -> ternary operator(alternative for if-else)

  if (!lat || !lng) {
    //ie if user did not specify lat or long in url
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat, lng.',
        400
      )
    );
  }
  console.log(distance, lat, lng, unit); //233 -40.2343 45.2343 km

  //So below we want to basically query for start location coz the start location field is what holds the geo-spatial point where each tour starts and that's exactly what we're searching for
  // geo-spatial queries below
  const tours = await Tour.find({
    startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius] } },
  }); // [lng, lat] = center of the sphere
  //Above startLocation: 'the value that we're searching for' and for that we used geo-spatial operator called $geoWithin-> and this operator finds docs(tour docs here) within a certain geometry and geometry here -> ie we want to find tour docs inside of a sphere that starts at 'latlang's' point(that we defined above)  and which has a radius of the 'distance' that we defined above) and we do this by defining a $centerSphere
  //contd.. and $centerSphere operator that takes in an array of co-ordinates(ie lng and lat) and the radius
  // And in order to be able to do geo-spatial queries, we need to first attribute an index to the field where the geo-spatial data that we're searching for is stored and So here we need to add an index to 'startLocation' and we do that in tourModel
  //console.log(tours);

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      data: tours,
    },
  });
});

//Below USING GEO SPATIAL AGGREGATION to calculate distances to all the tours from a certain point
// Get Distances to Tours(ie to Tours' startLocation ) From Point(Point here is point that we marked in compass in Los Angeles or its simply point where we live in)
exports.getDistances = catchAsync(async (req, res, next) => {
  const { latlng, unit } = req.params; // Using destructuring ie const distance = req.params.distance
  //Below Creating two separate variables lat and long from latlng(defined above) by splitting latlng
  //distance, latlng, unit = parameters in above url; latlng = string and thus we use .split() on it(string) to split it by comma(,)
  const [lat, lng] = latlng.split(','); //latlng.split(',') = array of two elements after splitting and then so we can use destructuring now

  const multiplier = unit === 'mi' ? 0.000621371 : 0.001; //ie if unit of distance(in url as parameter) is miles('mi') then multiplier = 0.000621371 (1 meter = 0.000621371 miles and 1 'meter' coz distance by default is in meters and we multiply distance with this  0.000621371 to convert it(distance in meters) into miles  ) else if unit of distance is kms then multiplier = 0.001

  if (!lat || !lng) {
    //ie if user did not specify lat or long in url
    next(
      new AppError(
        'Please provide latitude and longitude in the format lat, lng.',
        400
      )
    );
  }

  //Aggregation Pipeline
  //aggregate() CAN BE CALLED 'ONLY ON A MODEL'
  const distances = await Tour.aggregate([
    {
      //For Geo-spatial aggregation there's only one single stage and thats called $geoNear and this one (ie this $geoNear stage) always needs to be the first one in the pipeline. So geoNear ALWAYS needs to be the first stage
      //..contd And geoNear requires at least one of our fields contains a geospatial index and actually we already did that before in tourModel (startLocation already has the 2dsphere geospatial index on it in tourModel)-> tourSchema.index({ startLocation: '2dsphere' });
      //..contd And since we are using the startLocation in order to calculate the distances, well thets then perfect
      //..contd So if there is only one field with a geospatial index than this geoNear stage here will automatically use that index in order to perform the calculation BUT If u have multiple fields with geospatial indexes then u need to use the keys parameter in order to define the field that u want to use for calculations
      //..contd But again in this case here we only have one field and so automatically that startLocation field is going to be used for doing these calculations
      $geoNear: {
        //So $geoNear HAS TWO MANDATORY FIELDS that is near and distanceField ; both of which are defined below
        near: {
          //near = point from which to calculate the distances, So all the distances will be calculated between this point that we defined just above , and then all the start locations
          //..contd And so this near point here is of course the point that we passed into this f'n with lat and lng
          //..contd SO 'near' is the FIRST MANDATORY FIELD And IT IS ALWAYS A 'MANDATORILY FIRST' 'MANDATORY FIELD'
          //..contd AND SECOND MANDATORY FIELD IS the distanceField property
          //..contd And we need to specify this point below as geoJSON
          type: 'Point',
          coordinates: [lng * 1, lat * 1], //* 1 to convert it to number
        },
        // SECOND MANDATORY FIELD IS the distance field property
        //distanceField is the field where all the calculated distances will be stored
        distanceField: 'distance',
        //distance field is in meters by default in o/p/results in postman so converting it(ie distance field in meters) to km
        //distanceMultiplier: 0.001, //0.001 is going to be multiplied with all the distances coz for converting distance field in meters to kms we need to divide distance field in meters by 1000 (1 km = 1000 meters) and so we multiplied distance field in meters with 0.001 (ie 1/1000)
        distanceMultiplier: multiplier,
      },
    },
    {
      //Using $project stage below to get only 'name and distance fields' of tours in o/p/results in postman and not the other useless fields
      $project: {
        //Below are the fields we want in o/p/results in postman (ie fields we want to keep in o/p/results in postman)
        distance: 1, //1 -> for keeping this field in o/p/results in postman
        name: 1, // ie name field in o/p/results in postman and name -> name of the tour
      },
    },
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      data: distances,
    },
  });

  //o/p in postman -
  // "status": "success",
  //   "data": {
  //       "data": [
  //           {
  //               "_id": "5c88fa8cf4afda39709c2966",
  //               "name": "The Sports Lover",
  //               "distance": 64.70947940317292
  //           },
  //           {
  //               "_id": "5c88fa8cf4afda39709c2961",
  //               "name": "The Park Camper",
  //               "distance": 348.1666610953302
  //           },....
  //So here in o/p "The Sports Lover" is the closest tour to the location in Los Angeles that we marked in compass (ie location/ where we live in) as it is just 64 kms away from that marked location(ie location where we live in)
  //
});
