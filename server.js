const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPTION! Shutting down...');
  console.log(err.name, err.message, err);
  process.exit(1); // 1 = uncaught exception, 0 = success
  // process.exit = app crashed
});

dotenv.config({ path: './config.env' });

const app = require('./app'); //requiring express application here

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    //console.log(con.connections);
    console.log('DB Connection Successful');
  });

//console.log(process.env);

//Creating Document out of Tour Model

// const testTour = new Tour({
//   name: 'The Park Avenue',
//   price: 997,
// });

// //Saving above doc to dsb

// testTour
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.log('Error:', err);
//   });

//////// START Server

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}... `);
});

//

// HANDLING UNHANDLED PROMISE REJECIONS (ie in asynchronous code)

// Unhandled promise rejection: it means that somewhere in our code, there is a promise that got rejected but that rejection has not been handled anywhere
// From above :- so that promise rejection is not handled using catch handler
//So globally handling rejected promises below: so we are handling globally rejected promises that we might not have been caught somewhere in our code
//So each time, there is an unhandled rejection somewhere in our application, the process object will then emit an object(event) called unhandled rejection, so we can subscribe to that event just like below
//process.on("Name of the event we are subscribing to", callback f'n called when this event is emitted);

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED REJECTION! Shutting down...');
  console.log(err.name, err.message);

  server.close(() => {
    process.exit(1); //closing server above and when server is closed, this callback f'n in close() will be called, 1 = uncaught exception, 0 = success
    // process.exit = app crashed
  });
});

//HANDLING UNCAUGHT EXCEPTIONS

//Uncaught exceptions: These are all errors/bugs that occur in our synchronous code but not handled anywhere
