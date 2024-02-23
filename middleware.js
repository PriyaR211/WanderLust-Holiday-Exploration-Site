const Listing = require("./models/listing.js")
const Review = require("./models/review.js")

const ExpressError = require("./utils/ExpressError.js");
// For server-side validation
const {listingSchema} = require("./schema.js"); 
const {reviewSchema} = require("./schema.js"); 


// Middleware to check user is logged in or not
module.exports.isLoggedIn = (req, res, next)=>{
    if(!req.isAuthenticated()){ 
        req.session.redirectUrl = req.originalUrl;
        req.flash("error", "You must be looged in to do changes!");
        return res.redirect("/login");
    }
    next();
}


module.exports.saveRedirectUrl = (req, res, next)=>{
    if(req.session.redirectUrl){
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next();
}

// Middleware to check the owner of listing to edit or update
module.exports.isOwner = async(req, res, next)=>{
    let {id} = req.params;
    let listing = await Listing.findById(id);
    if(!listing.owner.equals(res.locals.currUser._id)){
        req.flash("error", "You are not owner of this Listing!");
        return res.redirect(`/listings/${id}`);
    }
    next();
}


// Server side schema validation using middleware
module.exports.validateListing = (req, res, next)=>{
    let {error} = listingSchema.validate(req.body);
    if(error){
        throw new ExpressError(400, error);
    }
    else{
        next();
    }
}

module.exports.validateReview = (req, res, next)=>{
    let {error} = reviewSchema.validate(req.body);
    if(error){
        throw new ExpressError(400, error);
    }
    else{
        next();
    }
}


// Middleware to check the author of review to edit or update
module.exports.isReviewAuthor = async(req, res, next)=>{
    let {id, reviewId } = req.params;
    let review = await Review.findById(reviewId);
    console.log("review is: ", review);
    if(!review.author._id.equals(res.locals.currUser._id)){
        req.flash("error", "You are not author of this Review!");
        return res.redirect(`/listings/${id}`);
    }
    next();
}
