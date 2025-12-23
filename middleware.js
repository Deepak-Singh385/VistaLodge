const Listing = require("./models/listing");
const Review = require("./models/reviews.js");
const Booking = require("./models/booking.js");

module.exports.isLoggedin = (req, res, next) => {
  if (!req.isAuthenticated()) {
    req.session.redirectUrl = req.originalUrl;
    req.flash("error", "You must be login first! ");
    return res.redirect("/login");
  }
  next();
};

module.exports.saveRedirectUrl = (req, res, next) => {
  if (req.session.redirectUrl) {
    res.locals.redirectUrl = req.session.redirectUrl;
  }
  next();
};

module.exports.isOwner = async (req, res, next) => {
  let { id } = req.params;
  let listing = await Listing.findById(id);
  if (!listing.owner.equals(res.locals.currentUser._id)) {
    req.flash("error", `You don't have permission to make changes`);
    return res.redirect(`/listings/${id}`);
  }
  next();
};

module.exports.isReviewAuthor = async (req, res, next) => {
  let { id, reviewId } = req.params;
  let review = await Review.findById(reviewId);
  if (!review.author.equals(res.locals.currentUser._id)) {
    req.flash("error", `You don't have permission to make changes`);
    return res.redirect(`/listings/${id}`);
  }
  next();
};

module.exports.isBookingUser = async (req, res, next) => {
  let { bookingId } = req.params;
  let booking = await Booking.findById(bookingId);

  if (!booking) {
    req.flash("error", "Booking not found");
    return res.redirect("/listings");
  }

  if (!booking.user.equals(req.user._id)) {
    req.flash("error", "You don't have permission to perform this action");
    return res.redirect("/my-bookings");
  }
  next();
};
