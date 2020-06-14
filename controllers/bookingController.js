const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY); //coz require('stripe') -> a f'n
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');

const catchAsync = require('../utilities/catchAsync');
const AppError = require('../utilities/appError');
const factory = require('./handlerFactory');

exports.getCheckoutSession = catchAsync(async (req, res, next) => {
  // 1) Get the currently tour being booked by the logged-in user
  const tour = await Tour.findById(req.params.tourId);

  // 2) Create checkout session
  //Stripe Checkout session -> in dis session, we store a bunch of details about d tour. so dis is all dat stuff below dat we want 2 show up on d checkout page and also in our stripe.com dashboard
  //npm i stripe
  //Below till client_reference_id: code, is the code for session itself
  //Below 'await' stripe.checkout.session.create() coz .create() below basically returns a promise because setting all these options here below will basically do an API call to Stripe and so then of course that's an asynchronous function that we should await here.
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'], //card-> credit card
    //Below let's now create a new booking document in our database whenever a user successfully purchases a tour. So we're back here in the booking controller and in the route handler, which creates the checkout sessions, right? And remember that here we have this success url below and this success url below is the basis of the functionality that we're going to implement in this lecture. So whenever a stripe payment check out is successful, the browser will automatically go to this below's success url, which right now is basically simply our homepage, right? It's also at this point in time, so when a checkout is successful that we want to create a new booking, right? So basically we want to create a new booking whenever this success url here below is accessed. Now we could now create a new route for this success, but then we would have to create a whole new page and that's not really worth it in this case. And that's because what we're going to do in this lecture is only a temporary solution anyway because it's not really secure, okay? So remember how we said some lectures ago and that nice diagram that later when a website is actually deployed on a server we will get access to the session object once the purchase is completed using Stripe Webhooks. And so these webhooks will then be perfect for us to create a new booking. But for now, since we can't do that yet, let's use a work around, which is simply to put the data that we need to create a new booking right into this success url as a url query string. And we need to create a query string because Stripe will just make a get request to this success url here, and so we cannot really send a body or any data with it except for the query string. So let's do that and what we need here is basically the three required fields in our booking model. So tour, user, and price.
    //Contd.. Now as I said before, this is of course not secure at all because right now anyone who knows this success url structure here below (with query string in url) could simply call it without going through the checkout process, right? And so anyone really could just book a tour without having to pay. All they'd have to do is to open this success url with the tour, user, and price in d query string in url and then they would automatically create a new booking without even paying, okay? So again, not really secure, but for now as a work around it works just fine because not many people will of course will know that this is our success url. Because actually we're going to hide that fact a little bit in a second, okay?
    //success_url: `${req.protocol}://${req.get('host')}/`, //RHS: Home url(ie '/' -> root url) of our website, LHS: It is basically the URL that will get called as soon as a credit card has been successfully charged. So as soon as the purchase was successful the user will be redirected to this URL.
    //So, below's success url is called whenever a purchase is successful with Stripe.
    //So below we added tour,user and price variables in d success url as url's query string and these variables are needed to create a new booking(in createBookingCheckout() below) to d success url.
    success_url: `${req.protocol}://${req.get('host')}/?tour=${
      req.params.tourId
    }&user=${req.user.id}&price=${tour.price}`,
    cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`, //LHS: so basically it's the page where the user goes if they choose to cancel the current payment. ; RHS: the tour page where user was previously.
    customer_email: req.user.email, //RHS: req.user.email from req.user = currentUser(Currently logged-in user) in authController.protect
    client_reference_id: req.params.tourId, //This is a custom field made by us. So this field is gonna allow us to pass in some data about the session that we are currently creating. And that's important because later once the purchase was successful, we will then get access to the session object again.And by then, we want to create a new booking in our database. So remember the diagram in d image in phone. Basically what I'm talking about here is the last step in that diagram. And also remember how that is only going to work with deployed websites. But still, let's already prepare for that here. Okay, so to create a new booking in our database we will need the user's ID, the tour ID, and the price. And in this session we already have access to the user's email and from that we can then recreate the user's ID because email here is unique. We will also specify the tour's price here in a second and so all that's missing is then the tour ID. And so that's what we're gonna specify here belowon this custom field basically.
    line_items: [
      {
        //line_items -> Specifying some details about the product(tour here) itself dat d user is about to purchase.
        name: `${tour.name} Tour`, //Name of d product/tour
        description: tour.summary,
        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`], //specifying an array of images. Now these images here they need to be live images. So basically images that are hosted on the internet. because Stripe will actually upload this image to their own server. And so this is another of the things that we can only really do once the website is deployed. But for now, as a placeholder, I will basically use the ones from our hosted example website on natours.dev.
        amount: tour.price * 100, //It is basically the price of the product/tourHere in cents(thats y *100) that is being purchased. ; 1 dollar = 100 cents
        currency: 'usd',
        quantity: 1, //ie 1 tour
      },
    ],
  });

  console.log(session);

  // 3) Create/send above created session(ie code-> const session = ...) as response to d client/user ie send above created checkout session in step 2) to d client as response
  res.status(200).json({
    status: 'success',
    session,
  });
});

//Below is the function that will actually create the new booking in the database.
exports.createBookingCheckout = catchAsync(async (req, res, next) => {
  //This all code below is TEMPORARY, coz it's Unsecure: everyone can make bookings w/o paying
  const { tour, user, price } = req.query; //query= query string in url (ie /tour=...&user=... .. in url)
  //console.log('exports.createBookingCheckout');

  if (!tour && !user && !price) return next();
  //Create new booking/BookingDoc below when tour, user, price variables r specified in d url's query string in d browser search tab.
  await Booking.create({ tour, user, price });
  //console.log(req.originalUrl);

  //Below remove d above url query string (containing tour, user, price variables)  from d url
  // originalUrl -> the entire url from which the request came.
  //Below-> what redirect here does is basically to create a new request but to this new url that we passed in here below(ie (req.originalUrl.split('?')[0]) -> root url ('/' url) ). So this will now create yet another request to our root url.
  res.redirect(req.originalUrl.split('?')[0]); // result of dis is home page('/' url ) nd it is calculated from success_url defined above
});

exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);
