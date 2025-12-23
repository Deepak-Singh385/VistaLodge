const express = require("express");
const router = express.Router();
const { bookingSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const { isLoggedin, isBookingUser } = require("../middleware.js");
const bookingController = require("../controllers/bookings.js");

const validateBooking = (req, res, next) => {
  let { error } = bookingSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(", ");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};

// Booking form route
router.get(
  "/listings/:id/book",
  isLoggedin,
  bookingController.renderBookingForm
);

// Create booking
router.post(
  "/listings/:id/book",
  isLoggedin,
  validateBooking,
  bookingController.createBooking
);

// Booking confirmation
router.get(
  "/bookings/:bookingId/confirmation",
  isLoggedin,
  bookingController.showConfirmation
);

// Get all user bookings
router.get("/my-bookings", isLoggedin, bookingController.myBookings);

// Cancel booking
router.post(
  "/bookings/:bookingId/cancel",
  isLoggedin,
  isBookingUser,
  bookingController.cancelBooking
);

// API endpoint for available dates (for frontend validation)
router.get(
  "/api/listings/:id/available-dates",
  bookingController.getAvailableDates
);

module.exports = router;
