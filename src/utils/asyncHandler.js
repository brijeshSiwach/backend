const asyncHandler = (requestHandler) => {
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err))
    }
}


export { asyncHandler }




// using try catch block
// const asyncHandler = (fn) => async (req, res, next) => {
//     try {

//         fn(req, res, next);

//     } catch(error){
//         console.log(error);
//     }
// }