// ROUTE HANDLER FUNCTIONS
const multer = require('multer');
const sharp = require('sharp');

const User = require('./../models/userModel');
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/appError');
const factory = require('./handlerFactory');

//CONFIGURING MULTER BELOW -> By creating multer storage and multer filter

//Below is is actually our Multer storage. And so basically a complete definition of how we want to store our files, with the destination and the filename.
//Below- req-> current req, file-> currently uploaded file, cb-> cb is a callback f'n like next() f'n of express; cb('1st argument here is an error if there is one and null if there is no error', '2nd argument is actual destination')
// const multerStorage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'starter/public/img/users');
//   },
//   filename: (req, file, cb) => {
//     //Giving our files some unique filenames
//     //Contd.. and filename is -> user-userId-currentTimeStamp.fileExtension so for e.g. -> user-875886cfg79-34553487.jpeg and with this we can ensure that there will not be 2 images with the same filename coz userId here is unique. SO If we used only the user ID, then of course multiple uploads by the same user would override the previous image. And if we only used user with the timestamp, well, then if two users were uploading an image at the same time, they would then get the exact same filename,which does not make sense.
//     //Extracting filename from the uploaded file ; ext-> extension of uploaded file for e.g. in console.log(req.file) -> {mimetype: 'image/jpeg', originalname: 'leo.jpg', ....}
//     const ext = file.mimetype.split('/')[1]; //result of <-this will be (for e.g.) 'jpeg' in "mimetype: 'image/jpeg'"
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`); //req.user.id from req.user = currentUser -> Currently logged-in user from protect middleware
//   },
// });
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

//Above we could actually just have called the Multer function without any options(like dest:'...') in there But then the uploaded image would simply be stored in memory and not saved anywhere to the disc but of course at this point that's not what we want and so we at least need to specify this destination option. And with this our file(image here) is then really uploaded into a directory in our file system.
//Contd.. AND images are not directly uploaded into the database, we just upload them into our file system and then in the database we put a link basically to that image. So in this case in each user document we will have to name all of the uploaded file, okay.

//Below middleware f'n is for uploading images in account webpage of logged-in user in browser
exports.uploadUserPhoto = upload.single('photo');

//So everywhere in our user interface of our website, we assume that the uploaded images are squares. So that we can then display them as circles. And so this only works when they are squares, but of course in the real world, users are rarely going to be uploading images that are squares. And so our job now is to actually resize images to make them squares. Alright, and so here is how we're gonna do that.
//Contd.. We will add below yet another middleware(exports.resizeUserPhoto) before the exports.updateMe and then that middleware will take care of the actual image processing.
exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  //Now so at this point we already have the file on our request(ie we have req.file) at least IF THERE WAS AN UPLOAD (ie if there was a file upload then the middleware exports.uploadUserPhoto would already have run before running this exports.resizeUserPhoto middleware coz in routes in userRoutes.js in router.patch('/updateMe', .....)) and if there was no upload, then of course we don't want to do anything. So that means that we want to go to the next middleware.
  //Contd..So below, So if(in if() below) there is no file on the request (ie there was no file upload) then return right away and go to next. Okay, but otherwise we of course, then want to do image resizing of that uploaded image. And for that, we are going to use the sharp package.
  //Contd.. npm i sharp
  if (!req.file) return next();

  req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;

  //Now, when doing image processing like this right after uploading a file, then it's always best to not even save the file to the disk(ie db), but instead save it to memory. We already talked about that before, and so that's now actually do that in practice. Okay, so for that we need to change a little bit or multer configuration and so we commented above's multer disk storage code -> const multerStorage = multer.diskStorage({.....}) and used multer.memoryStorage()
  //Contd.. And by using above-> const multerStorage = multer.memoryStorage(); , the uploaded image will then be stored as a buffer. And so that buffer is then available at request dot file dot buffer(ie req.file.buffer) and so this is way more efficient like this, so instead of having to write the file to the disk and then here read it again. We simply keep the image basically in memory and then here we can read that, alright? Anyway, calling the sharp function like this here will then create an object on which we can chain multiple methods in order to do our image processing.
  //Contd.. So below resize(500->Width, 500->Height) and remember we want square images, and so of course, the height needs to be the same as the width. Now this will then crop the image so that it covers this entire 500 times 500 square. And actually we can change this default behavior if we wanted to.And so, let's again, take a quick look at the documentation.
  //Below-> toFormat('jpeg') -> convert the uploaded image to jpeg ; Below We also define the quality of this jpeg. So basically to compress it a little bit so that it doesn't take up so much space and so for that, we use the jpeg method, and set an option in this object with quality and let's say 90 percent here, alright?
  //

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`starter/public/img/users/${req.file.filename}`); //.toFile() -> ie to write this uploaded file to a file/doc on our disk(db) (ie writing the uploaded file(image here) into our file system(disk)). And '`starter/public/img/users/${req.file.filename}`' is the entire path to that file and '${req.file.filename}' is the file name. So our uploaded image(file) will be saved to this folder in our file system of our project -> `starter/public/img/users/${req.file.filename}` .

  next();
});

const filterObj = (obj, ...allowedFields) => {
  // ...allowedFields = array of all the arguments that we passed in ie array containing name and email in this case
  //So we want to loop throgh the object and for each element check if it is one of the allowed fields and if it is, simply add it to a new object that we are gonna return in the end
  // object.keys is one of the easy ways to loop through an object in js; object.keys(obj) will return an array containing all the key names so the field names of "obj/(req.body in this case)"
  const newObj = {};
  //Looping through all the fields that are in the passed obj and then fo each field, we check if it is one of the allowed fields and if it is, then we create a new field in the new object, with the same name, so still same element, with the exact same value as it has in the original object
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) {
      //ie if the current field is one of the allowed fields,
      newObj[el] = obj[el]; //ie newObj with the field name of the current field ie name/email in this case = whatever is in the obj at the current element ie the current field name
    }
  });
  return newObj;
};

//

//Implementing '/me endpoint/route' ie endpoint where a logged-in user can retrieve his own data (ie for e.g. like getting his profile in fb )
exports.getMe = (req, res, next) => {
  req.params.id = req.user.id; // (ie id the getOne uses in handlerFactory = id from currently logged-in user from req.user = currentUser from authController.protect midlleware f'n (which is middleware for logging in user)
  //ie above coz getOne in handlerFactory uses the id coming from parameter (ie req.params.id) to get the requested doc but we want to get the doc based on the current user Id (ie Id coming from the currently logged-in user -> req.user.id) from req.user = currentUser and so we dont need to pass any id in url as parameter
  //..contd and thats why we added this getMe middleware (to set req.params.id = req.user.id ) to run before calling getOne/getUser and we go to next middleware (which is getOne/getUser coz in userRoutes.js -> router.get('/me', authController.protect, userController.getMe, userController.getUser); ) by calling next() below
  //And as we are calling authController.protect ie we want logged-in user to access his profile data so we need to add Bearer token in authorization tab in postman while sending req

  next();
};

//RECENT Commented
// exports.getAllUsers = catchAsync(async (req, res, next) => {
//   const users = await User.find();

//   // SENDING RESPONSE

//   res.status(200).json({
//     status: 'success',
//     results: users.length,
//     data: {
//       users,
//     },
//   });
// });
exports.getAllUsers = factory.getAll(User); // User = Model name

//

//updateMe = updating currently logged-in/authenticated user's account properties ie his name and email etc except his p/w
exports.updateMe = catchAsync(async (req, res, next) => {
  console.log(req.file);
  console.log(req.body);
  // 1) Create error if user tries to update his p/w (Create error if user POSTs p/w data)
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates, Please use /updateMyPassword route.',
        400
      )
    );
  }

  // 2) Update user document
  // const user = await User.findById(req.user.id);
  // user.name = 'Sethi';
  // await user.save();
  // If we update here by using .save() method then coz we are logged-in and if we specify only email(or name) field in postman then we will get error that 'Please confirm ur p/w, user validation error' coz passwordConfirm is a required field and we did not specify it in body but we need not to specify it as we are already logged in and we only want to update email(or name) and so we specified only email(or name)
  //..contd That's why we can now use findByIdAndUpdate as we are not dealing with sensitive stuff like p/w here below

  // FILTERED OUT UNWANTED FIELDS NAMES THAT ARE NOT ALLOWED TO BE UPDATED
  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) {
    //Below photo in filteredBody.photo is the name of the field vch holds the photo being uploaded by the logged-in user in account page in browser
    //We store only the image name to our docs in db and not the entire path to the image and thats exactly what we want here below
    //in console.log(req.file) -> {filename: 'user-iiyg85765uf858-76878ug7878.jpeg', .....}
    //So below we are adding the photo property to the filteredBody object that is gonna updated below in code-> "const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody ..." And the photo property is equal to the file's filename (ie file.filename)
    filteredBody.photo = req.file.filename; //And we get this req.file.filename from exports.resizeUserPhoto defined above (ie in exports.resizeUserPhoto -> req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;) and as this exports.resizeUserPhoto will be run/called before this middleware we're in(ie exports.updateMe), coz in userRoutes.js -> router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe).
    //So the result of sending req/Uploading image in the Update Current User Endpoint in postman is ->
    //   {
    //     "status": "success",
    //     "data": {
    //         "user": {
    //             "role": "guide",
    //             "_id": "5c8a1f292f8fb814b56fa184",
    //             "name": "Leo J Gillespie",
    //             "email": "leo@example.com",
    //             "photo": "user-5c8a1f292f8fb814b56fa184-1591177266386.jpeg",
    //             "__v": 0
    //         }
    //     }
    // }
  }
  // 'name', 'email' = fields we want to keep/accept from req.body and filter out all the rest
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });
  //filteredBody = data that should be updated
  // new:true coz we want it to return new updated object instead of original/old one
  // filteredBody = coz we dont want to update everything that's in the body, coz lets say user puts in the body the role like req.body.role: admin and this will allow any user to change role for example to admin or user could also change resetToken or resetTokenExpires and that is not allowed
  //..contd So, we should make sure that the object that's gonna be updated takes/accepts only email and name coz these are the only fields that we want to ALLOW to update so basically we want to filter the body so that in the end it only contains the fields we want to update (name and email here) and nothing else so if the user tries to change the role, then that will be filtered out and so it will be then filtered out from the object that we want to update in db
  //runValidators:true coz we want mongoose to validate our doc for e.g. if we put in invalid email address..

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// deleteMe = Deleting currently logged-in/authenticated user's account ie setting active flag/option in schema in usermodel to false ie making this account inactive and so actually we are not deleting the user's account from db we are actually setting its status to inactive
// And the logged-in user HIMSELF performs this action that's why delete'Me'
exports.deleteMe = catchAsync(async (req, res, next) => {
  //getting req.user from authController.protect ie from req.user = currentUser and user id is stored at req.user and so we can use req.user.id below to get current user's id (ie to get currently logged-in user's id)
  await User.findByIdAndUpdate(req.user.id, { active: false });
  // { active: false } is the data we want to update

  res.status(204).json({
    status: 'success',
    data: null,
  });

  //We dont want to show up inactive users (ie users with active:false in db) in o/p(ie results of postman) in getAllUsers so we are using
  //..contd pre-query middleware below which will run before any db mongoose query
  // this pre-"find-query" middleware will run before every other mongoose query that starts with find like find, findAndUpdate, findAndDelete etc..
  //And so by using this we will show up users with active:true (ie only users having account status active) in o/p results in postman
  // SO GO TO USERMODEL To see this code of pre-middleware
  //Postman process:-
  //  Send delete req to /DeleteMe route with only bearer token (and this bearer token which is jwt, will in turn give current user id as current user's id is encoded inside of this jwt ) and nothing else
});

// exports.getUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not defined',
//   });
// };
exports.getUser = factory.getOne(User); // User = Model name

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not defined! Please use /signup instead ',
  });
};

//Do Not update p/w with this!
// Only Admin updating the user below (and only for updating the user data that is not the p/w ie excluding p/w )
// exports.updateUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not defined',
//   });
// };
//Do Not update p/w with this!
// Only Admin updating the user below (and only for updating the user data that is not the p/w ie excluding p/w )
exports.updateUser = factory.updateOne(User); //User = Model name

//Only Admin deleting the user below
// exports.deleteUser = (req, res) => {
//   res.status(500).json({
//     status: 'error',
//     message: 'This route is not defined',
//   });
// };
//Only Admin deleting the user below
exports.deleteUser = factory.deleteOne(User); //User = Model name
