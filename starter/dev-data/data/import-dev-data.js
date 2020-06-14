const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const Tour = require('./../../../models/tourModel');
const Review = require('./../../../models/reviewModel');
const User = require('./../../../models/userModel');

dotenv.config({ path: './config.env' });

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
  .then((con) => {
    //console.log(con.connections);
    console.log('DB Connection Successful');
  });

// READ JSON FILE

const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8')); //tours is now array of js objects
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
); //tours is now array of js objects

//IMPORT DATA INTO DB
const importData = async () => {
  try {
    await Tour.create(tours); //A new doc will be created for each of the objects in tours array
    await User.create(users, { validateBeforeSave: false }); // Turning off validation of User Model
    await Review.create(reviews);
    console.log('Data successfully loaded');
  } catch (err) {
    console.log(err);
  }
  process.exit(); //Finishing server process or stopping server
};

//DELETE ALL DATA FROM COLLECTION

const deleteData = async () => {
  try {
    await Tour.deleteMany(); //Will delete all docs in Tour collection
    await User.deleteMany();
    await Review.deleteMany();
    console.log('Data deleted successfully');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  //C:\Users\hp\Desktop\Natours> node starter/dev-data/data/import-dev-data.js --import -> run this command in terminal after below's command to import json data from file mentioned above in const tours to db
  importData();
} else if (process.argv[2] === '--delete') {
  //C:\Users\hp\Desktop\Natours> node starter/dev-data/data/import-dev-data.js --delete -> run this command in terminal to delete data first from db
  deleteData();
}
//console.log(process.argv);
