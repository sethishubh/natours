module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next); //next ='(err) => next(err)'
  };
};

// const catchAsync = (fn) => {
//     return (req, res, next) => {
//       fn(req, res, next).catch(next); //next ='(err) => next(err)'
//     };
//   };
