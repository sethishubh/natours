/* eslint-disable no-lonely-if */
const AppError = require('./../utilities/appError');

//GLOBAL ERROR HANDLING MIDDLEWARE

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  //path in error object above is the name of the field for which the i/p data is is the wrong format
  //and the value is the val that we entered wrong
  //like in  http://127.0.0.1:3000/api/v1/tours/yfvyjfjfi ; path = _id, value = yfvyjfjfi
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0]; //using regexp to match/extract duplicate field name error b/w quotes from errmsg property of error objrct (ie err)

  const message = `Duplicate field value:${value} ,please use another value`;
  return new AppError(message, 400);
};

const handleJWTError = (err) =>
  new AppError('Invalid token. Please log in again!', 401); //ES6 Arrow f'n

const handleJWTExpiredError = (err) =>
  new AppError('Your token has expired. Please log in again!', 401);

const handleValidationErrorDB = (err) => {
  //In JS we use object.values to loop over object(s)(loop over elements of object which are also objects) coz this time all the errors in err object are within 'errors' object if we look in postman while updating a tour
  //errors 'variable' below is array of all the error messages ;
  //We want values of err.errors which are also objects and looping over them using map , and in each iteration we return error message
  //object.values = name object, difficulty object... <- are also current elements in each iteration of map method and we want el.message in each iteration as shown below

  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

//Below-> So just in conclusion, we now have an error handling strategy that works for development, such as before, and also for production. And then in each of them, we basically have two branches. One sends the error message for the API, and then we also have new kind of a handler for the rendered website. And so in that case, we render out our error template. Then in production, we also distinguish between rendered website and API. And then just as before, inside of each of these branches, we then also distinguish between the operation errors and the unknown errors. So operational and unknown. And then inside rendered, also operational and unknown. And so for the rendered website, if we have an operational error, so a trusted one, then we send our trusted error message. But in case we do not trust the error, so when we do not know it, then we simply send a generic message back to the user (for e.g. Please try again later) in Production mode.

const sendErrorDev = (err, req, res) => {
  // A) FOR API

  //originalUrl -> original URL is basically the entire URL but not with the host. So it looks then, exactly like the route's url. And so again, when we're hitting our URL, well, then that route starts with slash API. And so now we can test for that below. So we can use a JavaScript function called startsWith(function that's available for strings) below. And then test if it starts with slash API. Right?
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }
  // B) FOR RENDERED WEBSITE
  console.error('ERROR is', err);

  //Render the error in browser below
  //Below .render('name of the template/webpage we want to render/build/show in browser', {'data we want to send in that template(ie error.pug template/webpage below)'})
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!', //ie title of the error.pug webpage/page/template
    msg: err.message,
  });
};

const sendErrorProd = (err, req, res) => {
  // A) FOR API
  if (req.originalUrl.startsWith('/api')) {
    // a) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });

      // b) Programming or other unknown error: don't leak error details to client
    }
    // 1) Log the error to console
    console.error('ERROR is', err);

    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!',
    });
  }

  // B) FOR RENDERED WEBSITE

  // a) Operational, trusted error: send message to client
  if (err.isOperational) {
    //Render the error in browser below
    //Below .render('name of the template/webpage we want to render/build/show in browser', {'data we want to send in that template(ie error.pug template/webpage below)'})
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!', //ie title of the error.pug webpage/page/template
      msg: err.message,
    });
  }

  // b) Programming or other unknown error: don't leak error details to client
  // 1) Log the error to console
  console.error('ERROR is', err);

  // 2) Send generic message
  //Render the error in browser below
  //Below .render('name of the template/webpage we want to render/build/show in browser', {'data we want to send in that template(ie error.pug template/webpage below)'})
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!', //ie title of the error.pug webpage/page/template
    msg: 'Please try again later',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error'; //ie fail,error from like above or 'error'

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res);
  } else if (process.env.NODE_ENV === 'production') {
    //ie if we are in production mode
    let error = { ...err };
    error.message = err.message;

    // CastError is error when we pass invalid id/url parameter in url like http://127.0.0.1:3000/api/v1/tours/yfvyjfjfi

    if (error.name === 'CastError') {
      error = handleCastErrorDB(error);
    } //passing mongoose error 'err' here and handleCastErrorDB will then return a new error created with our AppError class
    //from above- And that error then will be marked as operational

    //Below error is error that occurrs when we try to create duplicate fields for fields that are set to be unique in schema
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }

    //Below error is error that occurrs when we try to update tour
    if (error.name === 'ValidationError') {
      error = handleValidationErrorDB(error);
    }

    //Below error is error that occurs when we send wrong token with req to access a protected route
    if (error.name === 'JsonWebTokenError') {
      error = handleJWTError(error);
    }

    //Below error is error that occurs when 'the token we send with req' has already expired
    if (error.name === 'TokenExpiredError') {
      error = handleJWTExpiredError(error);
    }

    sendErrorProd(error, req, res);
  }
};

//

// module.exports = (err, req, res, next) => {
//   err.statusCode = err.statusCode || 500;
//   err.status = err.status || 'error'; //ie fail,error from like above or 'error'

//   if (process.env.NODE_ENV === 'development') {
//     res.status(err.statusCode).json({
//       status: err.status,
//       message: err.message,
//       error: err,
//       stack: err.stack,
//     });
//   } else if (process.env.NODE_ENV === 'production') {
//     res.status(err.statusCode).json({
//       status: err.status,
//       message: err.message,
//       error: err,
//       stack: err.stack,
//     });
//   }
// };

//

// app.use((err, req, res, next) => {
//     err.statusCode = err.statusCode || 500;
//     err.status = err.status || 'error'; //ie fail,error from like above or 'error'

//     res.status(err.statusCode).json({
//       status: err.status,
//       message: err.message,
//     });
//   });
