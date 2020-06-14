//Authentication Controller: Here we do stuff related to user's authentication
const crypto = require('crypto');
//const util = require('util'); or below by using Promisify(to make it return a promise) by using ES6 destructuring
const { promisify } = require('util'); //util -> utilities
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel'); //Importing User model
const catchAsync = require('./../utilities/catchAsync');
const AppError = require('./../utilities/appError');
//const sendEmail = require('./../utilities/email');
const Email = require('./../utilities/email');

const signToken = (id) => {
  console.log(id);
  //npm i jsonwebtoken
  //Log the user in (log in) as soon as he signs up in our application; by sending him jwt
  //Signing/making jwt below
  //newUser = user that was just created
  // jwt.sign('payload = an object for all the data that we will store inside of token which is 'id(_id here) of user' in this case', 'unique secret string stored on the server to sign/encrypt the jwt')
  //Options: when the jwt should expire, it is basically for logging out a user automatically after certain amount of time

  //Logging in a user = Sign a json web token and send it back to client/user
  //Signing token and returning token right away

  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  //console.log(token);

  //JWT should be stored in a secure http-only cookie (that allows browser to only receive and send the cookie but can not access or modify it in any way so that then makes it impossible for any attacker to steal the JWT that is stored in the cookie) and should not be stored as local storage
  //But right now we're sending the token as a simple string in our json response
  //contd.. So below we're also sending token as a cookie so the browser then can then save it in this more secure way
  //Cookie: It is just a small piece of text that a server can send to clients and upon client receiving cookie, client will automatically store it and then automatically send it back along with all future requests to the same server
  //So a browser/client automatically stores the cookie that it receives aand sends it back in all future requests to that server where it came from

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 //JWT_COOKIE_EXPIRES_IN = 90 is in days so converting it into ms
    ),
    //secure: true, //cookie will only be sent on an encrypted/https connection
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') {
    cookieOptions.secure = true;
  }
  res.cookie('jwt', token, cookieOptions); //Sending cookie in response
  //res.cookie('Name of cookie', 'Data we want to send in the cookie', {options}); expires -> browser will delete the cookie after it has expired
  // res.cookie('jwt', token, {
  //   expires: new Date(
  //     Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000 //JWT_COOKIE_EXPIRES_IN = 90 is in days so converting it into ms
  //   ),
  //   secure: true, //cookie will only be sent on an encrypted/https connection
  //   httpOnly: true,
  // });

  //Remove password from output results in postman
  user.password = undefined;

  // Logging in a new user just created by sending token too to client/user below

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user: user,
    },
  });
};

//Creating signup 'async' f'n; 'async' coz we will do some db operations here
exports.signup = catchAsync(async (req, res, next) => {
  //Creating new docs/users based on a model: below
  //newUser = (Model's Name = 'Tour' below).create('Pass here the Object with the data from which user will be created')
  //const newUser = await User.create(req.body);
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    passwordResetToken: req.body.passwordResetToken,
    passwordResetExpires: req.body.passwordResetExpires,
    role: req.body.role,
  });
  //console.log(req, res);

  //npm i jsonwebtoken

  //Log the user in (log in) as soon as he signs up in our application; by sending him jwt
  //As usually when we sign up for any web application, then we get automaically logged in straight right away.
  //Signing/making jwt below
  //newUser = user that was just created
  // jwt.sign('payload = an object for all the data that we will store inside of token which is 'id(_id here) of user' in this case', 'unique secret string stored on the server to sign/encrypt the jwt')
  //Options: when the jwt should expire, it is basically for logging out a user automatically after certain amount of time

  //Logging in a user = Sign a json web token and send it back to client/user

  // const token = jwt.sign(
  //   { id: newUser.__id },
  //   process.env.JWT_SECRET,
  //   { expiresIn: process.env.JWT_EXPIRES_IN }
  // );
  //console.log(newUser._id);

  //BELOW SENDING WELCOME EMAIL TO USER ON SIGN-UP
  //const url = 'http://127.0.0.1:3000/me'; //But this url works only in development and not in production, so commented

  const url = `${req.protocol}://${req.get('host')}/me`; // In development -> ${req.get('host')} will be 'localhost:3000'

  await new Email(newUser, url).sendWelcome(); //we await it coz we want to only move on to d next line of code after d email has actually been sent and also sendWelcome() is an async f'n in email.js.

  // const token = signToken(newUser._id);
  createSendToken(newUser, 201, res);

  // // Logging in a new user just created(above) in by sending token too to client/user below coz the user has just signed up and we dont need to verify email or p/w so we right away logged in user below

  // res.status(201).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user: newUser,
  //   },
  // });
});

// Logging a user in based on a given email and password

exports.login = catchAsync(async (req, res, next) => {
  const { email } = req.body; // const email = req.body.email;
  const { password } = req.body; // const password = req.body.password;

  //or use ES6 destructuring to create above variables as the variable names and properties of req.body object are same
  //Above code alternative: ES6 destructuring:
  // const { email, password } = req.body;

  // 1) Check if email and p/w exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400));
    //return becoz after calling the next middleware, we want to make sure that this login f'n here finishes right away
  }

  // 2) Check if user exists & p/w is correct

  //ie checking if there actually is a user for the email that was posted; by using findOne to search user by email
  const user = await User.findOne({ email: email }).select('+password');
  // variable: email, field to search by: email
  //select+ here to select field that was by-default not selected;as p/w is not selected by default to show up in o/p as it is select:false in schema
  //So we use select+ to select p/w field to show up in o/p
  //const user above = user doc as it is result of querying user model so now we can use instance method correctPassword() on this 'above created user' document;

  //const correct = await user.correctPassword(password, user.password); //will be true or false as correctPassword() returns true/false
  //'await' user.correctPassword(password, user.password) coz correctPassword() is asynchronous f'n so we used await here

  if (!user || !(await user.correctPassword(password, user.password))) {
    //!user = there is no user, !correct = entered p/w is incorrect
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ( 1) and 2) ) ok, send token to client

  createSendToken(user, 200, res);
  // const token = signToken(user._id);
  //console.log(token);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  //   data: {
  //     user,
  //   },
  // });
});

//

// So, up until this point, when we wanted to LogOut/delete a logged-in user in the browser, we would simply delete the cookie from our browser. However, the thing is that we created this cookie as an http only cookie (in authController.createSendToken f'n -> httpOnly: true). Remember that, and so that means that we cannot manipulate this cookie in any way in our browser. So we cannot change it(ie cookie in browser), and we can also not delete it. And so again, remember, that this means that we can not manipulate the cookie in the browser in any way. Not even destroy/delete it.
//Contd.. So if we want to keep using this super secure way here(ie httpOnly: true in authController.createSendToken) of storing cookies, then how are we going to be able to actually log out users on our website? Because usually with JWT authentication we just delete the cookie or the token(ie jwt) from local storage in the browser (to log-out the user from our website in our browser) But well, again, that's not possible when using it this way(ie by using httpOnly: true in authController.createSendToken )
//Contd.. And so what we're gonna do instead is to create a very simple log out route that will simply send back a new cookie with the exact same name but without the token(jwt). And so that will then override the current cookie that we have in the browser with one that has the same name but no token(jwt). And so when that cookie is then sent along with the next request, then we will not be able to identify the user as being logged in. And so this will effectively then log out the user. And also were gonna give this cookie a very short expiration time. And so this will effectively be a little bit like deleting the cookie but with a very clever workaround like this, okay? So let's do that here below, right after above's log-in f'n here below -
//Contd.. So again when we're doing token(jwt) based authentication we usually never need an end point like this(ie like defined below) but when we want to send a super secure cookie like we do(ie httpOnly: true in authController.createSendToken vch is a super secure way ) well, then we have to do it like this below-
exports.logout = (req, res) => {
  console.log('biugiu');
  //Below-> res -> response ; loggedout -> dummy/random text
  //Below-> So, again, on the response we set the cookie, and the secret is to give it the exact same name('vch is 'jwt' here' ie in -> exports.createSendToken -> res.cookie('jwt', token, cookieOptions); ) and that is jwt. So just as I mentioned in above/before comments.
  res.cookie('jwt', 'loggedout', {
    //So, the jwt that we are sending now as/in the cookie just above is 'loggedout' and then in exports.isLoggedIn(in code-> await promisify(jwt.verify)) f'n, this 'loggedout' jwt will be verified and the verification will be failed now there and so jwt.verify will trigger an error there vch we catched in catch(err) there and So then in that case we want to go to next middleware (coz in exports.isLoggedIn -> catch(err) { return next(); } will be run in this case -> So, we go straight to the next middleware when there is no logged-in user) so basically saying that there is no logged-in user <- this whole trick/process is for logging out user in website
    expires: new Date(Date.now() + 10 * 1000), //expire date in 10 sec from now
    httpOnly: true,
  });
  res.status(200).json({ status: 'success' });
};

// Creating middleware f'n below to protect getAllTours f'n from unauthorized access
//So we will allow only logged in users to access the protected tours route (ie list of all tours)

exports.protect = catchAsync(async (req, res, next) => {
  //console.log('in protect');
  // 1) Getting token and checking if it's there (ie if token actually exists)

  // A comman practice is to "send a token using an http header" along with req coz user/client will have to send his token( or show his passport) along with req to server to basically access a protected route
  // we set token in(as) header in postman using Authorization(header's name/key) = Bearer:randomString(ie Bearer:value of token/header where Bearer coz we bear/we have/ we possess/we ourselves create this token in postman ) So token here = randomString
  let token;
  //console.log('token:', token); //coz we cant define a variable inside of an if block coz const and let are block scoped so const and let variables inside of below if() will not be accessible outside of it so defining here
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1]; // randomString
  } else if (req.cookies.jwt) {
    //Above-> req.headers.authorization = reading jwt from authorization header and only if that authorization header starts with 'Bearer', so for the bearer token in postman
    //Contd... But now, we basically ALSO want to read the json web token from a cookie(that was sent by the browser(for a logged-in user) along with the req(to show cookie as passport while doing req to API) and cookie has jwt stored in it) and so adding else if here above
    // meaning of above else if->  if there was no token in the authorization header then we run this else if
    // in the cookies object, there will be a property called JWT

    token = req.cookies.jwt;
    //And so now with this above code, we're also able to authenticate users based on tokens sent via cookies and not only the authorization header
  }

  //

  //console.log('token after if: ', token);

  //if there is no token sent with req, then that means we are not logged in (below)
  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access', 401)
    );
  }

  // 2) Validating token /verification of token ie JWT algorithm verifies if the signature of received token is valid or not( and so if the received token is valid or not) so whether it matches the token's signature that was actually sent to user originally at first place

  //(verification happens when server creates the test signature by "received token's header+payload" + 'secret stored on server' and compares it against received toke's signature)
  //Ie comparing -> Test Signature created by server( "received token's header + payload" + "secret stored on server") and received signature
  //Also verifying here if the token has already expired
  //Below callback f'n will run as soon as verification of token has completed
  //verify below is async f'n so it will verify token and then it'll run callback f'n

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //console.log('d'); //decoded = The resolved value of promise is 'decoded payload'(= user id of current user) from token
  // verify is synchronous f'n above and so we cant have synchronous f'n inside above declared asynchronous protect f'n so we made it asynchronous too by making it return promise by promisifying it

  //console.log(decoded); // { id: '5e9ee62569ad7a4bf89f805c', iat: 1587553955, exp: 1595329955 }

  // 3) Check if user who is trying to access route still exists

  //So if the user has been deleted in meantime and token will still exist then we dont want to log in user
  //So checking below if user still exists
  //decoded = 'decoded payload' and 'decoded payload' has user id of currently logged in user (ie currentUser)
  const currentUser = await User.findById(decoded.id);
  //console.log(decoded.id);

  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token does no longer exist', 401)
    );
  }
  //And If currentUser does exist, then the execution will go to step 4

  // 4) Check if user changed p/w after the token was issued

  //changedPasswordAfter = instance method defined in userModel, decoded.iat = decoded timestamp of token 'Issued At'
  // instance method is available on all docs/(users doc here) thats why calling instance method on user document below
  //decoded = { id: '5ea0709a4c194429684e2ef8', iat: 1587572919, exp: 1595348919 }
  //iat = (token's) issued at
  //freshUser.changedPasswordAfter(decoded.iat);

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    //So if p/w was actually changed as shown in if(), we will return an error below
    // changedPasswordAfter() will return = true if user changed his p/w
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }
  // So if the user did not change p/w after token issuance then below code will be executed,so then below we assign currentUser to request object (ie req.user) in order to use it in next middleware f'n if needed in future
  //(continued from above comment) coz req object travels from one middleware to another middleware and so if we want to pass the data from one middleware to next one, then we can simply put some property(stuff) on req object and that data will be available at later point
  req.user = currentUser; //Putting entire user data(ie Putting currentUser(ie Currently logged-in user)) on the req so that we can use it( currentUser -> Currently logged-in user) in all the APIs
  res.locals.user = currentUser; //Putting currentUser (ie Currently logged-in user) on res.locals so that we can use it( currentUser -> Currently logged-in user) in all the templates/webpages/pages/.pugFiles; res -> response

  // GRANT ACCESS TO PROTECTED ROUTE IF ALL ABOVE STEPS PASSED
  //For example if someone stole the token from user, but to protect against it, user changed his p/w and so the old token that was issued before the p/w change should no longer be valid
  next(); //If above all steps are passed then only we will go to next() middleware/route which is 'tourController.getAllTours' which is protected route
});

//

//Rendering/showing/building the login and sign up buttons at top-bar in website in case the user is not logged in, And in case the user is in fact logged in, well, then render some kind of user menu there and also a log-out button at top-bar. And That kind of rendering should of course happen on the back end, so in one of our pug templates.
//Contd.. Now, how will our template actually know if the user is logged in or not? Actually, in order to determine that we will have to create a new middleware function below, and really the only goal of this new middleware function below(ie exports.isLoggedIn) is going to be if the user is currently logged in or not. Now You might think that our protect(ie authController.protect) middleware also does something similar, and actually, it is similar. But the difference is that, that one(ie protect middleware -> authController.protect) only works for protected routes, But our new middleware function(vch is authController.isLoggedIn defined below) is going to be running/working for each and every single request on our rendered website. And so now we're creating this new middleware-> authController.isLoggedIn below to check if a user is logged-in or not in our website and we do that checking/check by checking every incoming req by that user/browser
//Contd.. and below f'n (ie isLoggedIn) is quite similar to the above one (ie .protect) and so we didn't write explanatory comments below for copied code from above f'n into this/below f'n
//Below-> This isLoggedIn middleware below is really ONLY FOR(checking if a user is logged-in or not) RENDERED WEBPAGES/PAGES IN BROWSER. So the goal here is NOT to protect any route(like we did in above's protect middleware) and so there will never be an error in this middleware below.
//Contd.. So, Below middleware is ONLY FOR RENDERED PAGES IN BROWSER, So, NO ERRORS
//SO WE USE authController.Protect(defined above) for API AND this below's authController.isLoggedIn FOR RENDERED PAGES IN BROWSER
exports.isLoggedIn = async (req, res, next) => {
  // Our token should come from the cookies(that are stored in browser and vch(ie cookie) also has jwt for a logged-in user) and NOT from an authorization header(like in postman in protect middleware f'n above for API) because, of course, for rendered pages/webpages in browser we will not have the token in the header.
  //Contd.. So again, for our entire rendered WEBSITE(ie NOT API) the token will ALWAYS ONLY be sent using the cookie, and never the authorization header COZ "authorization header is ONLY FOR THE API".
  if (req.cookies.jwt) {
    //ie if there is any cookie called jwt on incoming req from the browser
    try {
      // 1) Verify received token
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET
      );

      // 2) Check if user still exists
      //AND HERE BELOW WE WILL NOT Create ANY Errors as explained above

      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next(); //ie moving/going to next middleware in sequence right away->return/ComeOut of this right away /immediately
      }

      // 3) Check if the user recently changed his p/w after the token was issued

      if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next();
      }

      //So, if all of this/aboveSteps here is/are correct, so if the token is verified, if the user still exists, and if they didn't change their password, well, in that case it means that there is a logged in user. So there is a logged in user. Well, then, What we want to do in this case is make that user accessible to our templates.
      //So, THere is a logged-in user ;Below-> res -> response
      //Below-> res.locals.'Any variable('user' here below) here and pug template will get access to this variable'
      res.locals.user = currentUser; // res.locals.user -> So, then inside of a template there will be a variable called 'user'. So again, each and every pug template will have access to the "response.locals" and whatever we put there will then be a variable('user' here below) inside of these templates. So it's a little bit like passing data into a template/PugFile using the render function.
      req.user = currentUser; //putting currentUser(ie Currently Logged-In user in browser) on 'res.locals'
      return next();
    } catch (err) {
      return next();
    }
  }

  //ie below-> so in case there is no cookie then of course the next middleware will be called right away, because then of course there's no way that there actually is a logged in user. So again, if there is no cookie(on received/incoming req by user/browser and cookie stored in browser has jwt ONLY for a logged-in user in the browser), then there is no logged in user.
  //..Contd But if there is a cookie(On received/incoming req sent by the browser/user), well, then we go through all these/thoseAbove3 verification steps and if we pass all these above 3 steps, then that means there is a logged in user. And so therefore, we put that 'user' into/onto response.locals, and like that, we then have access to that 'user' in our pug templates. So then, for e,g. We will have access to that 'user' /'user' variable = currentely logged-in user = 'currentUser'  in  _header.pug file
  next();
};

//

//AUTHORIZATION : User Roles and Permissions

//We here authorize only certain types of users to perform certain actions
//So Authorization is a process of verifying if a certain user has the rights to interact(get access to ) with a certain resource even if he is logged in
//For example, a logged in user can not delete a tour, only admin can
//So not all logged in users will be able to perform the same actions in API

//So creating another middleware f'n here below to restrict certain routes, like for e.g. deleting tours only to cerain user roles

//Usually we cant pass arguments into a middleware f'n except 'req, res and next' but here we want to pass roles (admin and lead-guide) who are allowed to access resource
//Contd.. So we need a way of basically passing in arguments into the middleware f'n
//Contd.. So here below we will create a wrapper f'n which will then return the middleware f'n that we actually want to create
//Contd.. so roles = array of admin and lead-guide -> roles = ['admin', 'lead-guide']

exports.restrictTo = (...roles) => {
  console.log('restrictTo');
  return (req, res, next) => {
    // roles = ['admin', 'lead-guide'] here coz we passed roles in tourRoutes.js -> .delete(authController.protect,authController.restrictTo('admin', 'lead-guide'),tourController.deleteTour); ,So role='user' wil not have access to this delete resource
    //we get req.user from previous middleware above
    // cont.. (where we above passed req.user = currentUser onto req object and then called next() ie called next middleware which is authController.restrictTo and so this req object passed from previous/above middleware f'n to this middleware f'n and we now have access to req object here and we so used req.user.role here) ie authController.protect middleware and coz this authController.protect middleware f'n runs before authController.restrictTo coz .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour); in tourRoutes.js so we in authController.protect middleware intentionally passed req object (req.user = currentUser) at the end by calling next() middleware (and next middleware is actually this restrictTo coz .delete( authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour); ) in order to get access to req.user in this middleware to use req.user.role actually

    if (!roles.includes(req.user.role)) {
      //So if roles array (['admin', 'lead-guide']) does not include 'the role of currentely logged in user'(req.user.role)
      //req.user = currentely logged in user, the role of currentely logged in user = req.user.role
      console.log(req.user.role);
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    //SO The Id that is encoded into JWT is what makes our code know whether the user who is trying to perform the action is a user,lead-guide or admin coz data here comes from protect middleware

    next(); //Calling next() middleware f'n which is tourController.deleteTour middleware actually in sequence coz in tourRoutes.js -> .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);
  };
};

//PASSWORD RESET FUNCTIONALITY:

//We provide email address with post req and then we get an email with a link which you can click and then that is going to take you to a page where you can put in a new p/w
//So it is a two step process:-
// Step 1) the user sends a post req to a forgot p/w route only with this email address and this will then create a 'reset token' ('This is not a json web token it is just a simple random token) and this token should be sent to the email address that was provided by user
// Step 2) the user then sends that token ( which he just recived ) from his email along with a new p/w in order to  update his p/w

// Step 1) implemented below in forgotPassword() f'n

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //

  // 1) Get user based on POSTed email

  // ie retreiving/getting user from db who sent 'post req with his registered email id (ie by sending/entering email(email will be sent in post req obviously) in the field on website and then clicking on password reset button)' for requesting to change/reset p/w
  // So here we dont know user's id nor user knows his id and we know only user's email which he sent to us with post req
  const user = await User.findOne({ email: req.body.email });

  //Ceck below if user does exist
  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }

  // 2) Generate the random reset token
  //
  const resetToken = user.createPasswordResetToken(); // <-saving 'resetToken' returned from 'createPasswordResetToken instance method' from userModel.js
  console.log('plain token:', resetToken);
  //from 'createPasswordResetToken instance method' from userModel.js ->  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; so here we did not update the doc in db so we did not save it into db so we just modified it/this.passwordResetExpires and so saving it into db below
  await user.save({ validateBeforeSave: false });
  //console.log('SavedUserToDb:', SavedUserToDb);
  //validateBeforeSave: false -> will deactivate all the validators that we specified in our schema

  //Creating/calling instance method 'createPasswordResetToken' on user above coz this really has to do with user data itself and it is also so many lines of code thus using instance method

  // 3) Send above generated plain/un-encrypted random token (ie resetToken) to user's email

  //console.log(resetURL);
  //const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  //console.log(user.email, message);
  //Below finally send the email to user
  // sendEmail() is a asynchronous f'n so it will return a promise, so using await here below
  try {
    const resetURL = `${req.protocol}://${req.get(
      'host'
    )}/api/v1/users/resetPassword/${resetToken}`;
    //Ideally the user will click on this email/url above and will then be able to do the req from there

    //await
    // await sendEmail({
    //   email: user.email, // or email: req.body.email,
    //   subject: 'Your password reset token (valid for 10 min)',
    //   message,
    // });

    //Below calling sendPasswordReset() f'n defined in email.js for Sending p/w reset email to d user
    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email',
    });
  } catch (err) {
    //resetting passwordResetToken and passwordResetExpires if an errorr happens in try case ie in sendEmail() above
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    //This above then only modifies the data and does not save it into db so saving it into db below
    await user.save({ validateBeforeSave: false });
    //console.log('SavedAtLast: ', SavedAtLast);

    return next(
      new AppError('There was an error sending the email. Try again later'),
      500
    );
  }
  //So we do not send reset token right above via a json as response coz then everyone could just rest anyone's p/w and take over any a/c they wanted and that's the whole reason why we send it over email address, coz we assume that the email is a safe place that only the user has access to.
});

// Step 2) mentioned above implemented below in restPassword() f'n

//Password reset functionality, a PATCH req to {{URL}}api/v1/users/resetPassword/{above generated plain un-encrypted random token(resetToken) as parameter here}

//PATCH req coz result of this will be the modification of the p/w property in the user document
//Here below our job is to actually reset the p/w based upon on the new p/w that the user sends with the reset p/w req

exports.restPassword = catchAsync(async (req, res, next) => {
  // 1) Get/retrieve the user from db based on the token we receive from user
  //
  //
  // So, 'un-encrypted/plain reset token which is also sent to user/client over email by us and user also sends it back to us with p/w reset req' = 'resetToken'
  // 'Encrypted version of above reset token' = 'passwordResetToken' = 'Encrypted reset token' = 'token stored in db'
  //
  // So the resetToken is sent above in the URL {{URL}}api/v1/users/resetPassword/{above generated plain un-encrypted random token(resetToken) as parameter here} by user but we have encrypted version of this token in db.
  //contd.. So what we need to do is to basically encrypt the original un-encrypted/plain token (resetToken) again so that we can then compare it with the one that is stored in db(ie the encryptrd one in db ie passwordResetToken)
  //
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex'); //"encrypting the token received from user" when user hits req to router.patch('/resetPassword/:token') to reset p/w based on the instructions he received in his email
  //req.params.token coz user sent a req to url router.patch('/resetPassword/:token') and so token is now parameter in url

  // Finding user in db based on the token we received from user when he sent req to route/url router.patch('/resetPassword/:token') with token in this url
  //Finding user that has the token he sent via url and also the token should not has been expired by now
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  }); // passwordResetExpires: { $gt: Date.now() } ie checking if the token has expired or not and $gt: Date.now() coz if passwordResetExpires expires in a future Date(thats why $gt: greater than now/current time) than that means the token expires in future and has not expired yet
  //Finding user that has the token he sent via url
  // 2) If token has not expired, and if there is a user exists for received token, set the new p/w

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400));
  }

  //And now if we reach here upto this point after if that means there is a user for that token so setting p/w of user a new p/w received via body
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined; //ie resetting
  user.passwordResetExpires = undefined; //ie resetting

  //Above code only modifies user data and does not save it into db and so actually saving it into db below

  await user.save();

  // 3) Update changedPasswordAt property for the current user

  //doing it using middleware f'n in userModel.js

  // 4) Log the user in ie send the JWT to client
  createSendToken(user, 200, res);

  // const token = signToken(user._id);
  // //console.log(token);
  // res.status(200).json({
  //   status: 'success',
  //   token,
  // });
});

//complete process of reset p/w in postman:-

//1) Hit route/url users/forgotPassword with email of user as json in body and in res it will then send token to client/user over that email entered by user in body {res/response in postman: { "status": "success", "message": "Token sent to email" } }
// 2) now go to user email in MailTrap and get/copy token from email of user and send req to users/restPassword/pasteTokenHere and send password and passwordConfirm as json in body then in res we get success and token

//

//UPDATING LOGGED-IN USER'S P/W w/o having to forget it

exports.updatePassword = catchAsync(async (req, res, next) => {
  console.log(req.user);
  //We want logged-in user to enter his current p/w in order to confirm that the user actually is who he says he is as a security measure

  // 1) Get the current logged-in user from collection
  // It is only for logged-in ie authenticated users, so will already have the current user on our req object (from req.user = currentUser ie middleware above) ie authController.protect will put user object on req object ie req.user = currentUser in protect middleware f'n
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSTed current p/w by user (ie current p/w the user enters ie req.body.passwordCurrent ) is correct
  //Creating error if the current p/w entered by user is not correct ie does not matches with the one stored in db
  // correctPassword() = instance method available on all documents(users here)
  // user.password = actual p/w of user stored in db,
  // comparing entered p/w by user (req.body.passwordCurrent) and stored p/w in db (user.password) below
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current entered p/w is wrong.', 401));
  }
  // 3) If so (ie step 1 and 2 get passed), update the p/w
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  //Below actually saving 'user object modified just above' into db
  await user.save();
  //User.findByIdAndUpdate will NOT work as mongoose schema validation only works on .save() and also 'pre-save' middlewares will also not run here if we used findByIdAndUpdate, that's why userd .save() method here

  // 4) Log user in ie send JWT back to the user, and logging in here with the new p/w that was just updated
  createSendToken(user, 200, res);

  //POSTMAN Process:-
  // 1) Log-in the user with email and p/w in body
  // 2) Hit /updateMyPassword route with three fields in body- passwordCurrent, password and passwordConfirm
});

//Eliminating those kind of errors that occur due to inputting/entering invalid url in browser's tab like -> 'http://127.0.0.1:3000/tour/the-forest-hikerrrrrrrr'
