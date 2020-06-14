//const fs = require('fs');
//Below path = built-in node module, so a core module which is used to manipulate path names(ie locations of files in our require(....))
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
//Below-> in order to actually get access to the cookies that are in a request(made using browser or API), In Express, we need to install a certain middleware/NPMpackage called cookie-parser from npm. So do -> npm i cookie-parser    in terminal . So basically, this package will then parse all the cookies from the incoming request.
const cookieParser = require('cookie-parser'); //And we use this cookie parser below
const compression = require('compression'); //npm i compression; for deployment

const AppError = require('./utilities/appError');
const globalErrorHandler = require('./controllers/errorController');

const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');

const viewRouter = require('./routes/viewRoutes');

//Start express app
const app = express();

app.set('view engine', 'pug'); //Setting template engine to pug for building/rendering website
//pug templates = views in express coz templates are views in MVC architecture

//Below is which location/folder our views are actually located in
// app.set('views', './views'); So here path = './views' and using this './views' as path is NOT ideal here coz path in app.set('views', 'path'); is always relative to the directory from where we launched our node application and that usually is the "root project folder"->(ie C:\Users\hp\Desktop\Natours>) BUT it might not be, so we should not use dot(ie ./) here but we should use the directory name variable
app.set('views', path.join(__dirname, 'views')); // path.join will create the path joining the directory-name/views (<- '/' = slash just here as name slash views). So this path.join will eliminate slash errors coz node now will automatically create a correct path

//// 1) GLOBAL MIDDLEWARES
//Global middleware ie executed for every req (not just to specific route like /api etc)

//SERVING STATIC FILES
//Middleware to serve static files from public folder(folder called 'starter/public' in our directory) and NOT from route url
//So all the static assets/files will always automatically be served from a folder called 'starter/public' by defining below code
//app.use(express.static(`${__dirname}/starter/public`));
app.use(express.static(path.join(__dirname, 'starter/public')));

//Setting security http headers (using helmet package)
//npm i helmet
app.use(helmet());

//DEVELOPMENT LOGGING
//console.log(process.env.NODE_ENV);
//Req logger ; It will show the url of req made in postman/browser as an o/p here in VSCode terminal
//Turn THIS REQ LOGGER OFF/ Ie comment it out when using browser requests
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//LIMIT REQUESTS FROM SAME API
//RATE LIMITING: Blocking ceratin IP if there are too many requests in a ceratin span of time from that IP
//npm i express-rate-limit
//This is middleware f'n just below (ie limiter)
const limiter = rateLimit({
  max: 100, //No of reqs allowed from a certain ip in a certain span of time
  windowMs: 60 * 60 * 1000, // 1 hour ie 60 minutes Time window in Milli seconds
  message: 'Too many requests from this IP, please try again in an hour',
});
app.use('/api', limiter); //We want to apply this limiter middleware f'n to /api route
//Here above app should not crash in between otherwise rate limit will be reset in headers on restart after crash of application

//BODY PARSER: reading the data from body into req.body ie It parses the data from the body
app.use(express.json({ limit: '10kb' })); //Middleware to add data from the 'incoming request body' to 'request object' for post route
//limit:10kb -> limiting the amount of data to 10kb that comes in the body
//So if we have body larger than 10kb, it will not be accepted

//
//Using middleware below in order to parse the data coming from a form(upon submission of form)
//Contd.. and it's called 'urlencoded'(below in express.urlencoded) because remember, the way that the form sends data to the server is actually also called URL encoded, and so here, we need that middleware to basically parse data coming from a URL encoded form.
//Below-> extended: true -> ie this will simply allow us to pass some more complex data,
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

//

//COOKIE PARSER BELOW: It parses the data from cookies ie Reading the data from the cookies that are in an incoming request(made using browser(and browser actually saves jwt as cookie for every logged-in user) or API)  into req.cookie
//Below-> in order to actually get access to the cookies that are in a request(made using browser or API), In Express, we need to install a certain middleware/NPMpackage called cookie-parser from npm. So do -> npm i cookie-parser    in terminal . So basically, this package will then parse all the cookies from the incoming request.
app.use(cookieParser());
//AND BELOW IN TEST MIDDLEWARE we can use request.cookies (and we can use request.cookies now below in TEST Middleware coz we defined this code above ->'app.use(cookieParser());' and defining <-this code above actually enabled us to use this code now -> request.cookies). And so now for each request, we will always display all the cookies in the console(in VSCodeTerminal console) below.

//DATA SANITIZATION: ie to clean all the data that comes into the application from malicious code

//Data sanitization against NoSQL query injection
//npm i express-mongo-sanitize
app.use(mongoSanitize());
//mongoSanitize basically removes $ and dots from req body, req query string and req.params coz that's how mongodb operators are written in a query
//mongoSanitize is a f'n that we called and which in turn will return a middleware f'n which we can then use
//coz in app.use we always need a f'n eventually, not a f'n call. So here we above are calling mongoSanitize f'n and this will then in turn return a middleware f'n eventually that's gonna be sitting here in app.use untill app.use is called

//Data sanitization against XSS(Cross-site-scripting-attacks)
//npm i xss-clean
app.use(xss());
//xss() will clean any user i/p from malicious html code

//PREVENTING PARAMETER POLLUTION:
//contd.. like /api/v1/tours?sort=duration&sort=price gives error as we're prepared for only one sort parameter in url but user puts two sorts ie polluting our paameters in url
//So we are gonna use middleware to remove these types of duplicate fields of parameters (like sort above) in our url
//npm i hpp (http parameter pollution)
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ], //Array of properties for which we allow duplicates (duplicate parameters) in the query string of url like we want to allow ?duration=5&duration=9
  })
);

app.use(compression()); //For deployment; it will return a middleware f'n vch will compress all d TEXT dat is sent 2 clients as response.

//TEST MIDDLEWARE
//Global middleware ie executed for every req
//MIDDLEWARES BELOW IS CALLED/RUN/EXECUTED ONLY WHEN THERE IS a Request/Response (req, res)
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();

  //console.log(req.headers);
  //Accessing req headers above in consoleLog ie http headers that client can send along with their request
  //Below using request.cookies. And so now for each incoming request, we will always display all the cookies(that come with requests from browser) in the console.

  //console.log(req.cookies); // O/p in VSCodeTerminal -> { ext_name: 'ojplmecpdpgccookcobabopnaifgidhf', jwt: 'eyJhbGciOiJIUzI1Ni...' }<- this is cookie and <-this code appears in VSCodeTerminal/console after we log-in on login webpage by entering correct email and p/w details into login-form and after successful login, we reload that login webpage or load any other webpage/page after successful login and so by doing this, we will see this o/p in terminal -> O/p in VSCodeTerminal/ConsoleInTerminal -> { ext_name: 'ojplmecpdpgccookcobabopnaifgidhf', jwt: 'eyJhbGciOiJIUzI1Ni...' } and after successful login, the browser stores the cookie(vch has jwt also) for that user who successfully logged-in just now and the browser will then send this cookie(vch also has jwt) along with every subsequent requests(to show jwt as passport) to the API for that logged-in user
  //..contd and So this(in console's code ->{ ext_name: 'ojplmecpdpgccookcobabopnaifgidhf', jwt: 'eyJhbGciOiJIUzI1Ni...' } ) is the cookie that was just sent with the req by the browser(for the logged-in user) on/after above mentioned comment's page load/reload And so now we can use this in order to protect our route.
  // So cookie above -> in console.log(req.cookies) = { ext_name: 'ojplmecpdpgccookcobabopnaifgidhf', jwt: 'eyJhbGciOiJIUzI1Ni...' } = cookie
  //NOW GOTO authController.js file in exports.protect f'n/middleware f'n in code there -> else if (req.cookies.jwt)...
  // AND If we remove the cookie(cookie also has jwt in it) that was saved into browser on logging-in of a user, then the user will be logged out
  next();
});

///////Routes

// app.get("/api/v1/tours", getAllTours);
// app.post("/api/v1/tours", createTour);
// app.get("/api/v1/tours/:id", getTour);
// app.patch("/api/v1/tours/:id", updateTour);
// app.delete("/api/v1/tours/:id", deleteTour);

///////ROUTES

//WEBSITE ROUTES just below (Commented coz we moved these below three routes to viewRoutes.js file)

// //Below is route for accessing the pug templates(ie views) in browser ie route/url for rendering/building pages in a browser
// //Below -> app.get('/', HandlerFunctionInController) where '/' -> root url of website
// //Below is route for getting '/' ie root/Home page (which is overview page) of Natours website in browser
// app.get('/', (req, res) => {
//   res.status(200).render('base', {
//     tour: 'The Forest Hiker',
//     user: 'sethi',
//     //These above variables(tour and user) that we passed/defined above as properties are called LOCALS in pug file
//   }); //ie render(in browser) the .pug template having name 'base' from the location('views' folder here from path in app.set('views', ...) defined at top ) we defined in app.set('views', ...); above at top
//   //And now go to 127.0.0.1:3000 in browser to see base pug template rendered in browser; 127.0.0.1 = localhost, 3000 = port and our server is running at url- 127.0.0.1:3000 in browser(after doing 'npm start' in terminal)
//   // 127.0.0.1:3000  = 127.0.0.1:3000/ = '/'(ie root) route/url of our website
//   //Above -> res.status(200).render('base', {" pass data into this pug template here called 'base' and passed data here will be available in the pug template named 'base' "});
// });

// //Below is route for getting All Tours overview page (which is overview page) of Natours website in browser
// app.get('/overview', (req, res) => {
//   res.status(200).render('overview', {
//     title: 'All Tours',
//   }); //here above .render('Pug Template(in views folder here) we want to render in website'); title -> title of the rendered page(overview here) in browser
// });

// //Below is route for getting Tour details(of a specific tour) page (ie details of a tour which we get by clicking on a tour in overview page) of Natours website in browser
// app.get('/tour', (req, res) => {
//   res.status(200).render('tour', {
//     title: 'The Forest Hiker Tour',
//   }); //here above .render('Pug Template(in views folder here) we want to render in website'); title -> title of the rendered page(tour here) in browser
// });

//Below mounting 'viewRouter.js' on the root('/') URL of Natours website and NOT on the /API url
app.use('/', viewRouter);
//Below Mounting tourRouter/userRouter/reviewRouter (which are basically middleware f'ns) on a new path called /api/v1/tours , /api/v1/users, /api/v1/reviews
app.use('/api/v1/tours', tourRouter); //Using tourRouter middleware or mounting tourRouter middleware to api/v1/tours path. so all requests to this path/url will call tourRouter middleware
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/booking', bookingRouter);

//Defining route for all the un-handled urls like http://127.0.0.1:3000/api/xyz

//It is route for urls that were not catched by all the above route handlers
//As middlewares are run step by step in stack so if a req made it to this point here that means it is not catched by above routes
app.all('*', (req, res, next) => {
  //'all' for all the verbs/HTTP methods ie get,post,patch,delete..
  // and * for all the URLs that were not handled before
  // app.route("/api/v1/tours").get(getAllTours).post(createTour);
  // res.status(404).json({
  //   status: 'fail',
  //   message: `Can't find ${req.originalUrl} on this server`,
  // });
  //

  // const err = new Error(
  //   `Can't find ${req.originalUrl} on this server`
  // );
  // err.status = 'fail';
  // err.statusCode = 404;

  //Below passing above error into next f'n  as an argument
  //If next f'n receives an argument, no matter what it is, express will automatically know there was an error
  //So express assume whatever we pass into next is going to be an error and it applies to every next f'n in every single middleware
  //So whenever we pass anything into next, express will assume there is an error and it will skip all the other middlewares in middleware stack and send the eror that we passed in to our global error handling middleware
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

//GLOBAL ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler);

// app
//   .route("/api/v1/tours/:id")
//   .get(getTour)
//   .patch(updateTour)
//   .delete(deleteTour);

// app.route("/api/v1/users").get(getAllUsers).post(createUser);

// app
//   .route("/api/v1/users/:id")
//   .get(getUser)
//   .patch(updateUser)
//   .delete(deleteUser);

module.exports = app; //exporting for use in server.js file

//FOR BUILDING/RENDERING WEBSITE:-
//..contd We use template engine which will allows us to create a template and then easily fill up that template with our data from API.
//..contd And template engine that we're gonna use here is called pug (for e.g. other template engines are handlebars or ESG if u dont like pug)
//..contd Pug is most commonly used template engine with express
//And at top we write -> app.set('view engine', 'pug') <- So 'set'ting for the view engine for express and we set it to pug <- for telling express to use 'pug' as template engine.
//..contd npm i pug <- do to install pug
