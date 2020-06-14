class APIFeatures {
  constructor(query, queryString) {
    this.query = query; //setting query property of this class = mongoose query e.g. Tour.find() here
    this.queryString = queryString; //setting queryString property of this class = query string that we receive from url ie req.query

    //so mongoose query = query = this.query
    // and req.query = queryString
  }

  filter() {
    // 1A) FILTERING

    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    //console.log(queryObj);

    //Deleting excludedFields from query string of url ie queryObj
    excludedFields.forEach((el) => {
      delete queryObj[el];
    }); // delete will delete properties of object

    //console.log(req.query, queryObj);

    // 1B) ADVANCED FILTERING

    let queryStr = JSON.stringify(queryObj);
    // { difficulty: 'easy', duration: {gt: 5}}
    //Above will be the result of query string in url- /?difficulty=easy&duration[gt]=5

    queryStr = queryStr.replace(/\b(gte|gt|lt|lte)\b/g, (match) => `$${match}`);
    // { difficulty: 'easy', duration: {$gt: 5}}

    //console.log(JSON.parse(queryStr));

    this.query = this.query.find(JSON.parse(queryStr));

    return this; //returning entire object
  }

  //let query = Tour.find(JSON.parse(queryStr));

  // const query = Tour.find()
  //   .where('duration')
  //   .equals(5)
  //   .where('difficulty')
  //   .equals('easy');

  sort() {
    // 2) SORTING

    if (this.queryString.sort) {
      let sortBy = this.queryString.sort;
      //query= query.sort(req.query.sort); //?/sort=price for asc or ?/sort= -price for desc
      //console.log(sortBy); // ?/sort=price,ratingsAverage  ->  sortBy -> 'price,ratingsAverage' <- result of this console.log()

      sortBy = this.queryString.sort.split(','); //[ 'price', 'ratingsAverage' ] <- array
      sortBy = this.queryString.sort.split(',').join(' '); //price ratingsAverage
      //console.log(sortBy); //price ratingsAverage

      this.query = this.query.sort(sortBy); // sort('price ratingsAverage')
    } else {
      this.query = this.query.sort('-createdAt'); //else coz when user doesnt specify sort query string
    }
    return this;
  }

  limitFields() {
    // 3) FIELD LIMITING or PROJECTION

    // ?fields=name,duration,difficulty,price we want only these fields in results

    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' '); //name duration difficulty price
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v'); // '-' for excluding __v field
    }
    return this;
  }

  paginate() {
    // 4) PAGINATION

    // ?page=3&limit=10, 1-10 page 1, 11-20 page 2, 21-30 page 3
    // page is current page, limit is no of results per page

    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit; // skip is no of results to skip before for current page

    this.query = this.query.skip(skip).limit(limit);

    //Below Throwing error if user requests a page that doesnt exist
    // if (this.queryString.page) {
    //   const numTours = await Tour.countDocuments(); //num of docs in Tour collection

    //   if (skip >= numTours) {
    //     throw new Error(' This page does not exist');
    //   }
    // }

    return this;
  }
}

module.exports = APIFeatures;
