const Listing = require("../models/listing.js");
const Booking = require("../models/booking.js");
const Review = require("../models/reviews.js");
module.exports.renderDashboard = async (req, res) => {
  const totalListings = await Listing.countDocuments();
  const totalBookings = await Booking.countDocuments();
  const totalReviews = await Review.countDocuments();

  const listings = await Listing.find({}).sort({ _id: -1 }).limit(5);

  res.render("dashboard/index", {
    totalListings,
    totalBookings,
    totalReviews,
    listings,
    user: req.user,
  });
};
