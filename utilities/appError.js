//Extending built-in error class below
//Constructor f'n is a MUST in every class; constructor f'n runs as soon as new object is created out of this class
//constructor() is where we pass the arguments ie what we are going to pass into a new object created from this class
// We call super to call parent constructor and below we pass message of this below class coz message is only parameter that the built-in Error class accepts
class AppError extends Error {
  constructor(message, statusCode) {
    super(message); //Here this means that we set this.message(message property on this object) = message received from parent Error('Error messsage') class

    this.statusCode = statusCode; //ie setting statusCode property on this object = statusCode received from above as parameter
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; //setting property isOperational to identify this error

    //tracking/capturing stacktrace ie tracking where/on whch line Error occurred
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
