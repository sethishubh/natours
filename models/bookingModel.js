const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  //Here below we are gonna use parent referencing here on the bookings, so basically keeping a reference to the tour that's being purchased and also to the user who booked/purchased the tour.
  tour: {
    type: mongoose.Schema.ObjectId,
    ref: 'Tour', //Tour Model
    required: [true, 'Booking must belong to a Tour!'],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User', //User Model
    required: [true, 'Booking must belong to a User!'],
  },
  //below is d price of d tour at vch d purchase actually happened, and so that's because the price might change in the future, and so then we would no longer know how much a certain user paid for a tour. And so it's important to also have this here in the booking, so this is going to be a number below.
  price: {
    type: Number,
    required: [true, 'Booking must have a price.'],
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  //Below we create a paid property, and this one will be automatically set to true, but this is just in case that, for example, an administrator wants to create a booking outside of Stripe. So, for example, if a customer doesn't have a credit card and wants to pay directly, like in a store with cash, or something like that. And in this case, an administrator might then use our bookings API in order to basically manually create a tour, and so that might then be paid or not yet paid.
  paid: {
    type: Boolean,
    default: true,
  },
});

//Below we populate the tour and the user automatically whenever there is a query, all right? using query middleware.
bookingSchema.pre(/^find/, function (next) {
  this.populate('user').populate({
    path: 'tour',
    select: 'name',
  });
  next();
});

//Below Creating Model out of (from) above's definded schema
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
