const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');

const catchAsync = require('../utilities/catchAsync');
const AppError = require('../utilities/appError');

exports.getOverview = catchAsync(async (req, res, next) => {
  // 1) Get the tour data from collection
  const tours = await Tour.find(); //tours -> All the tours in our tour collection in db/model
  //Now we have to "pass all the above defined tour data stored in 'const tours'" into "the template" so that in there in template we can actually use and display this tours data on the website
  //

  // 2) Build template

  // 3) Render that template using tour data from step 1) defined above

  res.status(200).render('overview', {
    title: 'All Tours',
    tours: tours,
  }); //here above-> .render('Pug Template(pug template here is overview.pug in views folder here) we want to render in website in this controller f'n', {variables/locals that are going to be passed(title and tours here in this case above) into the overview.pug(in this case) template  }) ; title -> title of the rendered page(overview.pug here) in browser
});

exports.getTour = catchAsync(async (req, res, next) => {
  // 1) Get the tour data(including reviews and guides for that specific/requested tour) for the requested/specific tour(ie tour data for tour/tourCard on which we clicked on AllTours/overview/HomePage)

  //Below Finding specific/requested tour by slug received as parameter in url and then populating the reviews field in tour doc
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rating user', //ie we need these three fields only in Populated reviews field of tour doc in o/p
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name.', 404));
  }

  // 2) Build template page for requested/specific tour

  // 3) Render that/above template using data from above step 1)
  res.status(200).render('tour', {
    title: `${tour.name} Tour`,
    tour,
  }); //here above-> .render('Pug Template(in views folder here)(tour.pug here above) we want to render in website', {variables/locals(title and tour here above) we want to pass in template(tour.pug here above)}); title -> title of the rendered page(tour here) in browser
});

//Below is f'n/middleware for getting form on login webpage
exports.getLoginForm = (req, res) => {
  //below Rendering a template called 'login.pug' in browser and passing variable/local 'title' into that login.pug file/login template
  res.status(200).render('login', {
    title: 'Log into your account',
  });

  //So we are gonna allow users to log in by doing an HTTP req (ie an AJAX Call) and we're doing that http req to the login API endpoint with the data that the user provides in this login form and our API will then send back a cookie vch automatically gets stored in the browser And also automatically gets sent back with each subsequent req AND this is the fundamental key/thing in oreder to make our authentication system work and we implemented this by working on client side like we did in Mapbox and so we're creating a login.js file in public folder
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.getMyTours = catchAsync(async (req, res, next) => {
  //Here, Finding all d tours dat d user has booked. So, basically, first we need to find all the bookings for the currently logged-in users which will then give us a bunch of tour IDs, and then we have to find the tours with those IDs.
  //Now, instead, we could also do a virtual populate on the tours, and it would be great if you would implement this on your own exactly as we have done it before with the tours and the reviews, but here in this function I actually wanted to show you how we can do it manually because I think that's also kind of important and actually a virtual populate should work something similar to what we're gonna do here. And so you see that actually we need two queries in order to really find the tours corresponding to the user's bookings. Any way, let's now start, so let's create a variable for all the bookings(const bookings) below

  // 1) Find all bookings
  //below-> const bookings -> it has all d booking docs for d current user but really that only gives us the tour IDs. And so now we want to find the tours with the returned IDs in step 2)
  const bookings = await Booking.find({ user: req.user.id });

  // 2) Find tours with the returned IDs(basically the IDs of the bookings for the user)
  //Below we create an array of all the IDs, and then after that query for tours that have one of these IDs.
  //Below basically this loops through the entire bookings array and on each element it will grab the el.tour. And actually, we don't even need the ID here(so commented below-> el.tour.id) because the tour itself is already the tour ID, right? Then in the end, we have a nice array with all the tour IDs in there here in const tourIDs and that's because we used a map.
  const tourIDs = bookings.map((el) => el.tour);
  // el.tour.id;
  const tours = await Tour.find({ _id: { $in: tourIDs } }); //<- So basically what this is going to do is dat it will select all the tours which have an _id which is in the tourIDs array.

  res.status(200).render('overview', {
    title: 'My Tours',
    tours,
  });
});

exports.updateUserData = catchAsync(async (req, res, next) => {
  //Using catchAsync() f'n above(instead of using try,catch) to basically catch all the async errors
  //Now use this code in app.js to basically parse the data coming from submitted form into req.body ->  app.use(express.urlencoded({ extended: true, limit: '10kb' })); in app.js file
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name, //'name' in req.body.'name' here and in below's req.body.'email' are the names of the fields, because we gave them the name attribute in the HTML form.
      email: req.body.email,
    },
    {
      new: true, //ie we want the new/updated doc as a result
      runValidators: true,
    }
  ); //req.user.id from authController.protect -> currentUser(currently logged-in User) = req.user

  //Below is code for what we want to do after submitting the data from the form on the website And We actually want to render the account page now WITH THE UPDATED DATA. So we want to render the account page with One Important thing and that is we need to pass in the user, so the UPDATED USER NOW in the account page/account.pugTemplate, because otherwise, the user that the template is going to use, is the one that's coming from the protect middleware(ie from authController.protect -> currentUser(currently logged-in User) = req.user), remember, and so that one is not going to be the updated user. Right, and So NOW we need to pass in user:updatedUser below.
  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});
