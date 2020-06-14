const crypto = require('crypto'); //Built-in node module; No need to install anything
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A user must have a name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: {
    //path to the photo that was uploaded in our file system
    type: String,
    default: 'default.jpg', //All the newly created users will have this default image as their profile pic/photo
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, //false for not showing p/w in any o/p while sending data or o/p to client by reading it from db
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please provide a password'],
    validate: {
      //'this' below points to current doc on NEW doc creation and it will NOT work on updating doc
      //So below function works only for new doc creation ie ONLY on CREATE AND SAVE( '.save() and .Create() method' ).
      //And for due to above reason, whenever we want to update a user, we will always have to use SAVE ( '.save() method' ) as well and NOT for example findOne, findOneAndUpdate like we did with tours
      //If we updated the user's p/w simply with a regular update, then in that case the p/w confirm validation that we have here will no longer work so we will have to there update user also with .save() or .Create()
      //So this will only work when we create a new object so on .Create() or .save()
      validator: function (el) {
        //It is callback f'n which will be called when new doc is created
        //el -> current element -> passwordConfirm
        return el === this.password; // true -> no validation error; false -> validation error
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date, //when reset token expires, reset will expire after a certain amount of time as a security measure. So you will only have 10 minutes( for e.g.) in order to actually reset ur p/w
  //Date on which the p/w was changed and this property/object will exist on only those users who have actually changed their p/w and so if user has not changed his p/w ever since signup then this property will not be in his data
  active: {
    //User account status
    type: Boolean,
    default: true, //ie By default user account is active
    select: false, //ie we dont want this schema property to show up in results( o/p ) in postman
  },
});

// PASSWORD ENCRYPTION(HASHING)

// Using Mongoose middleware for p/w encryption: So the middleware f'n (which will do encryption here) will run b/w the moment that we receive the data and the moment where it's actually saved to db
//So encryption would have happened before actually saving the data below
//Using PRE-SAVE DOCUMENT MIDDLEWARE
//'this' below -> current doc/user

userSchema.pre('save', async function (next) {
  //Only run this f'n if p/w was actually modified
  if (!this.isModified('password')) return next(); //ie if p/w has not been modified, exit the f'n and call next() middleware

  //Using bcrypt hashing algorithm below //npm i bcryptjs -> install bcrypt package
  //hash = Asynchronously generates a hash for the string (this.password below) and as it(hash) is an async f'n, it will return a promise, so we added async await now
  this.password = await bcrypt.hash(this.password, 12); // 12 -> cost parameter -> higher cost -> more CPU intensive process to encrypt p/w  -> more secure p/w

  //Deleting passwordConfirm here below by setting it to undefined as we only need passwordConfirm field for p/w validation and after validation is successful, we no longer need this p/wConfirm field So we don't want to save this p/wConfirm to db so deleting below
  this.passwordConfirm = undefined;

  next();
});

//We dont want to show up inactive users (ie users with active:false in db) in o/p(ie results of postman) in getAllUsers so we are using
//..contd pre-query middleware below which will run before any db mongoose query
// this pre-"find-query" middleware will run before every other mongoose query that starts with find like find, findAndUpdate, findAndDelete etc..
//And so by using this we will show up users with active:true (ie only users having account status active) in o/p results in postman
userSchema.pre(/^find/, function (next) {
  // this here points to current query
  this.find({ active: { $ne: false } });
  //So all docs  where active is not equal to false should now show up in o/p results on postman
  next();
});

//Creating pre-save document middleware f'n for passwordChangedAt property when user sets a new p/w
// pre-save document middleware f'n runs just before a new doc is actually saved to db
userSchema.pre('save', function (next) {
  //If we didn't modify the password property, then we will not manipulate the passwordChangedAt and "'will right away return from this f'n' and 'will run next middleware f'n' (ie return next();)" below
  if (!this.isModified('password') || this.isNew) return next();
  //this.isNew = document is new

  //But when we create a new doc, then we did actually modify the p/w, and then we would set the passwordChangedAt property below
  this.passwordChangedAt = Date.now() - 1000;

  //Now in theory,this should just work fine, but sometimes in practice, a small problem happens:-
  //contd..sometimes saving to the db is a bit slower than issuing json web token so the changedPasswordAt/(P/wChangedAt) timestamp is sometimes set a bit after the json web token has been created. So the user will not be able to login using the new token in step 4 in authController's resetPassword f'n as the user's p/w has not been updated yet in time in db so subtracting one sec from this above
  // So putting this p/wChangedAt one sec in the past will ensure that the json web token is always created after the p/w has been changed.
  next();
});

//Creating f'n for checking if entered p/w by user = stored p/w of that user
//Creating instance method (A method which is gonna be available on all documents (user documents here coz created out of userSchema) of a certain collection) correctPassword here
// correctPassword = method's name; candidatePassword = non-encrypted p/w that the user passes in body so this is p/w that the user is entering to login and so is non-encrypted
//userPassword = encrypted stored p/w of user trying to log in
//So using Compare F'n (For comparing hashed p/w(encrypted p/w) against plain entered p/w) below will return true if entered p/w = stored p/w and otherwise false

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

//Creating instance method changedPasswordAfter for 'Check if user changed p/w after the token was issued' for authController
//below function(JWT Timestamp(the timestamp that says when token was issued))
//By default we will return fasle from this method that means the user has not changed his p/w after the token was issued
//'this' = current document //{ _id: 5ea05e85297bd642405adc18, name: 'sethi', email: 'sethi2@gmail.com',  __v: 0 }

userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  //console.log(JWTTimestamp); // { id: '5ea05e85297bd642405adc18', iat: 1587568297, exp: 1595344297 }
  if (this.passwordChangedAt) {
    //ie if user has changed his p/w after JWTTimestamp
    console.log(this.passwordChangedAt, JWTTimestamp); // 2020-05-30T00:00:00.000Z 1587572919

    //Converting this.passwordChangedAt = 2020-05-30T00:00:00.000Z  to also a timestamp(ms) like JWTTimestamp (=1587572919 ) below
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    ); //10 = base

    //JWTTimestamp = Date or time at which the token was issued (=100ms for example below), changedTimestamp(=200ms for example below) = Date or time at which the p/w was changed by user
    return JWTTimestamp < changedTimestamp; //returns true/false; 100 < 200 ; So we changed the p/w after token was issued; So it will now return true
  }
  return false; // So if 'this.passwordChangedAt = false' ie if 'user has not changed his p/w after JWTTimestamp' then we return false here ie p/w has not been changed by user
  // False = p/w not changed
};

//

//Creating instance method for 'Generating random p/w reset token'
userSchema.methods.createPasswordResetToken = function () {
  //p/w reset token = random string and NOT JWT, 32 = no of characters in string(size of string)
  //.toString('hex'); = converting to hexa-decimal string
  //Why we are creating this token here below, reason is:
  //contd.. Basically this token is what we are gonna send to the user and so it is like a reset p/w really that the user can then use to create a new real p/w.
  //contd.. And of course, only the user will have access to this token and so in fact it really behaves kind of like a p/w. AND so since essentially it is just a p/w it means that if a hacker can get access to our db, well then that's gonna allow the hacker to gain access to the a/c by setting a new p/w.
  //contd..  So, if we would just simply store this reset token in our db now, then if some attacker gains access to the db, they could then use that token and create a new p/w using that token instead of you doing it. So they would then effectively control ur a/c instead of u doing it.
  //contd.. So, just like a p/w, we should never store a plain reset token in the db.

  const resetToken = crypto.randomBytes(32).toString('hex');

  //encrypting resetToken here below using crypto module, sha256 = algorithm
  //crypto.createHash('sha256').update('Variable where token is stored ie whatever string we want to encrypt')
  //And now where are we actually gonna save this 'encrypted reset token' (ie this.passwordResetToken)?
  //contd.. Well we will create a new field in our db schema coz of course we want to save 'it/passwordResetToken' in the db, so that we can then compare it/passwordResetToken with the 'token that the user provides'/(ie Un-encryped plain token ie resetToken)
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; //Expires after 10 minutes in ms
  console.log(this.passwordResetToken, { resetToken });

  //returning the 'plain text token'(ie 'resetToken') here below coz that's actually the one that we're gonna send through the email to user
  return resetToken;

  // So, 'un-encrypted/plain reset token' = 'resetToken'
  // 'Encrypted version of above reset token' = 'passwordResetToken' = 'Encrypted reset token'
  //And we are not saving the plain/un-encrypted version directly in db coz if hacker gets access to this reset token then he can reset user's p/w himself so we are saving this reset token into db by encrypting it and so hacker will not be able to decrypt/see this token even if he gets access to our db

  //So the un-encrypted reset token should be sent via email coz otherwise it wouldn't make much sense to encrypt it at all.
  //contd.. So if the token that was in db was the exact same that we could use to actually change the p/w, well then that wouldn't be any encryption at all.
  //contd.. So we sent one token via email(which is un-encrypted, plain token ie resetToken) and then we have the encrypted version of this reset token ( ie passwordResetToken) in our db and that encrypted one is then basically useless to change the p/w.
  //contd.. So it is just like when we are saving only the  encrypted p/w itself to db so just like we did above in await bcrypt.hash ... so where we encrypted the p/w using bcrypt.
  //contd.. So keep in mind that we only ever save sensitive data in an encrypted form into our db and then of course compare it with the encrypted version that's in the db.
  // So basically we are comparing the 'resetToken (The one that we sent to user over email and got back from user as an reply)' and 'passwordResetToken(The one that we encrypted from resetToken 'the moment we sent resetToken to user over email' and stored this encrypted version passwordResetToken into our db) '
};

//Creating 'U'ser ('U'ser coz model variables are always capital) model out of above schema
const User = mongoose.model('User', userSchema);

module.exports = User;

//Authentication examples: Creating new users, logging users in, updating passwords
