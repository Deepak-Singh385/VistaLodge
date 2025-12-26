const Booking = require("../models/booking.js");
const Listing = require("../models/listing.js");

module.exports.renderBookingForm = async (req, res) => {
  try {
    const { id } = req.params;
    const listing = await Listing.findById(id);

    if (!listing) {
      req.flash("error", "Listing not found!");
      return res.redirect("/listings");
    }
    res.render("bookings/preview.ejs", { listing });
  } catch (err) {
    console.log(err);
    req.flash("error", "Something went wrong");
    res.redirect("/listings");
  }
};

module.exports.createBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkInDate, checkOutDate, numberOfGuests, specialRequests } =
      req.body.booking;

    const listing = await Listing.findById(id);
    if (!listing) {
      req.flash("error", "Listing not found");
      return res.redirect("/listings");
    }

    // Date validation
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      req.flash("error", "Check-in date cannot be in the past");
      return res.redirect(`/listings/${id}/book`);
    }

    if (checkOut <= checkIn) {
      req.flash("error", "Check-out date must be after check-in date");
      return res.redirect(`/listings/${id}/book`);
    }

    // Check for existing bookings
    const existingBooking = await Booking.findOne({
      listing: id,
      status: "confirmed",
      $or: [{ checkInDate: { $lt: checkOut }, checkOutDate: { $gt: checkIn } }],
    });

    if (existingBooking) {
      req.flash(
        "error",
        "Selected dates are not available. Please choose different dates."
      );
      return res.redirect(`/listings/${id}/book`);
    }

    // Create booking
    const newBooking = new Booking({
      listing: id,
      user: req.user._id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfGuests,
      specialRequests,
      pricePerNight: listing.price,
      status: "confirmed",
    });

    const savedBooking = await newBooking.save();

    req.flash("success", "Booking confirmed! Check your bookings for details.");
    res.redirect(`/bookings/${savedBooking._id}/confirmation`);
  } catch (err) {
    console.log(err);
    req.flash("error", "Failed to create booking. Please try again.");
    res.redirect(`/listings/${req.params.id}/book`);
  }
};

module.exports.showConfirmation = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId)
      .populate("listing")
      .populate("user");

    if (!booking) {
      req.flash("error", "Booking not found");
      return res.redirect("/listings");
    }

    if (!booking.user._id.equals(req.user._id)) {
      req.flash("error", "You don't have permission to view this booking");
      return res.redirect("/listings");
    }

    res.render("bookings/confirmation.ejs", { booking });
  } catch (err) {
    console.log(err);
    req.flash("error", "Something went wrong");
    res.redirect("/listings");
  }
};

module.exports.myBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("listing")
      .sort({ createdAt: -1 });

    res.render("bookings/myBookings", { bookings });
  } catch (err) {
    console.log(err);
    req.flash("error", "Failed to load bookings");
    res.redirect("/listings");
  }
};

module.exports.cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);

    if (!booking) {
      req.flash("error", "Booking not found");
      return res.redirect("/my-bookings");
    }

    if (!booking.user.equals(req.user._id)) {
      req.flash("error", "You don't have permission to cancel this booking");
      return res.redirect("/my-bookings");
    }

    if (booking.status === "cancelled") {
      req.flash("error", "Booking is already cancelled");
      return res.redirect("/my-bookings");
    }

    // Check if check-in date has passed
    const today = new Date();
    if (booking.checkInDate <= today) {
      req.flash("error", "Cannot cancel bookings that have already started");
      return res.redirect("/my-bookings");
    }

    booking.status = "cancelled";
    await booking.save();

    req.flash("success", "Booking cancelled successfully");
    res.redirect("/my-bookings");
  } catch (err) {
    console.log(err);
    req.flash("error", "Failed to cancel booking");
    res.redirect("/my-bookings");
  }
};

module.exports.getAvailableDates = async (req, res) => {
  try {
    const { id } = req.params;

    const bookedDates = await Booking.find({
      listing: id,
      status: "confirmed",
    }).select("checkInDate checkOutDate");

    const unavailableDates = [];
    bookedDates.forEach((booking) => {
      const current = new Date(booking.checkInDate);
      while (current < booking.checkOutDate) {
        unavailableDates.push(current.toISOString().split("T")[0]);
        current.setDate(current.getDate() + 1);
      }
    });

    res.json({ unavailableDates });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch available dates" });
  }
};
