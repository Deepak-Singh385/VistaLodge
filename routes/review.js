const express = require("express");
const router = express.Router({ mergeParams: true });
const ExpressError = require("../utils/ExpressError.js");
const { reviewSchema } = require("../schema.js");
const Review = require("../models/reviews.js");
const Listing = require("../models/listing.js");
const { isLoggedin, isReviewAuthor } = require("../middleware.js");
const reviewController = require("../controllers/reviews.js");

const validateReview = (req, res, next) => {
  const { _csrf, ...payload } = req.body;
  let { error } = reviewSchema.validate(payload);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};
//POST Route for review
router.post("/", isLoggedin, validateReview, reviewController.postReview);

//Delete Review route
router.delete(
  "/:reviewId",
  isLoggedin,
  isReviewAuthor,
  reviewController.destroyReview
);

module.exports = router;
