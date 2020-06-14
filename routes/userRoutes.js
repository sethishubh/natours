const express = require('express');
const multer = require('multer');
const userController = require('./../controllers/userController'); // userController = exports (kind of)
const authController = require('./../controllers/authController');

// //Below upload f'n is for IMAGE UPLOAD
// //Below dest-> destination -> is exactly the folder where we want to save all the images that are being uploaded.
// const upload = multer({ dest: 'starter/public/img/users' });
// //Above we could actually just have called the Multer function without any options(like dest:'...') in there But then the uploaded image would simply be stored in memory and not saved anywhere to the disc but of course at this point that's not what we want and so we at least need to specify this destination option. And with this our file(image here) is then really uploaded into a directory in our file system.
// //Contd.. AND images are not directly uploaded into the database, we just upload them into our file system and then in the database we put a link basically to that image. So in this case in each user document we will have to name all of the uploaded file, okay.

const router = express.Router(); // router = userRouter

//// ROUTES

router.post('/signup', authController.signup);
router.post('/login', authController.login); //post coz we will send in the login credentials like email and p/w in body
router.get('/logout', authController.logout);
router.post('/forgotPassword', authController.forgotPassword); //It will only receive email address
router.patch('/resetPassword/:token', authController.restPassword); //It will receive token and new p/w. And here PATCH req coz result of this will be the modification of the p/w property in the user document

//Protect ALL the routes that come below/after this line (ie Protect all the routes after/below this use middleware) of code Below
router.use(authController.protect);
//Above router.use(authController.protect) will protect all the routes/middleware f'ns that come after/below this point in code (ie routes that are below/after this line) in this file ie authController.protect will apply to all the routes/middleware f'ns that come after/below this point in code (ie to routes/middleware f'ns that are below/after this line of code) and thats coz middlewares run in sequence
//contd.. And so we removed authController.protect from all the routes below/after this line of code coz this authController.protect route will automatically be applied/added to all the routes now coming below/after this line of code
// routes = middleware f'ns
//So for e.g. router coming below this line -> router.patch('/updateMyPassword', authController.updatePassword); Below = Actually is ->  router.patch('/updateMyPassword', authController.protect, authController.updatePassword);
//And in same way using below -> router.use(authController.restrictTo('admin'));

//

// router.patch(
//   '/updateMyPassword',
//   authController.protect,
//   authController.updatePassword
// );
//authController.protect = middleware for logging-in a user and from here we passed the user id of currently logged-in user (req.user = currentUser) into next middleware run after it and for it we use Bearer token in postman in Authorization tab
//updateMyPassword coz it's for only currently logged-in/authenticated user and authController.protect will put current user object on req object ie req.user = currentUser in this protect(secured) middleware f'n ie actually for accessing user object (ie currently logged-in user) in authController.updatePassword middleware f'n
// and authController.protect is really secure(protected), coz the id of the user that is gonna be updated comes from req.user = currentPassword which was set by this authController.protect() middleware f'n which in turn got the id from json webtoken and since no one can change the id in that jwt w/o knowing that secret string and so id is safe coz of that

router.patch('/updateMyPassword', authController.updatePassword);

// router.get(
//   '/me',
//   authController.protect,
//   userController.getMe,
//   userController.getUser
// ); // Above /me route is route for a currently logged-in user to see/access his own user data (for e.g. looking at his own profile in fb while he is logged in with his a/c into fb)
router.get('/me', userController.getMe, userController.getUser);

//router.patch('/updateMe', authController.protect, userController.updateMe);
//update'Me' coz it is only for currently logged-in/authenticated user to update his a/c data like email, name except p/w
//Also implementing "IMAGE UPLOADS" for LOGGED-IN user's photos using multer package. Multer is a very popular middleware to handle multi-part form data, which is a form in coding that's used to upload files from a form.
//Contd.. And now what we're gonna do is to allow the user to upload a photo on the /updateMe route and so instead of just being able to update email and photo, users will then also be able to upload their user photos in account page/webpage of logged-in user in the browser
//npm i multer@1.4.1
//see upload f'n above
//Below.. Images are not directly uploaded into the database, we just upload them into our file system and then in the database we put a link basically to that image. So in this case in each user document we will have to name all of the uploaded file, okay.
//Below upload.single() -> single coz here we only want to update one single image and then here into single we pass the name of the field that is going to hold the image to upload. And so that will be 'photo', okay. And with field I mean the field in the form that is going to be uploading the image.
//Contd .. So again, we included the Multer package above at top and then with that we created an upload above. And this upload is just to define a couple of settings. then we use that upload to create a new middleware that we can then add to this below's stack of the route(ie /updateMe) that we want to use to upload the file. So for that we say upload dot single because we only have one single file and then finally we specify the name of the field('photo' here below) that is going to hold this uploaded file. Okay, and so this middleware(ie upload.single('photo') below ) will then take care of taking the file and basically copying it to the destination(above in const upload-> dest: 'public/img/users') that we specified above in 'const upload'. And then after that of course it will call the next middleware in the stack which is /UpdateMe.
//Contd.. Also, this middleware here below(ie upload.single('photo') ) will put the file or at least some information about the file on the request object (req.file)-> do console.log(req.file) in userController.updateMe
// router.patch('/updateMe', upload.single('photo'), userController.updateMe);
router.patch(
  '/updateMe',
  userController.uploadUserPhoto, //Middleware for uploading images
  userController.resizeUserPhoto, // Middleware for resizing the uploaded image(uploaded in middleware just above)
  userController.updateMe
);
//Above For testing photo upload(ie in code-> upload.single('photo') ) by a LOGGED-IN USER, go to postman and log in with a user and then go to Update Current User endpoint/FolderNameInPostman and in body(raw) specify 'name-> Leo...' and in Body(form-data -> coz this is the way how we can send multi-part form data) specify -> key = name, value = Leo ...(same as in Body(raw)) ; key = photo(type->file) , value = select the file from computer that u want to upload AND then send the req in postman

//router.delete('/deleteMe', authController.protect, userController.deleteMe);
router.delete('/deleteMe', userController.deleteMe);

//Restrict all the routes coming after/below this line of code to only admin (ie Restrict all routes (to admin) after this use middleware) Below
router.use(authController.restrictTo('admin'));
//So only user having role as admin will be able to access the routes below/after this line of code as middlewares/routes run in sequence (ie from left to right or top to bottom) and this authController.restrictTo('admin') route will be applied to all the routes now coming below/after this line of code

//Routes below follow REST Architecture completely but in above auth routes REST Architecture is not followed 100%
router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
