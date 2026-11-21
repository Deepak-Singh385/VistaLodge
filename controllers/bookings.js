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

    let savedBooking;
    // Optimistic locking makes overlapping requests re-check availability before
    // they can create a reservation for the same listing.
    for (let attempt = 0; attempt < 3 && !savedBooking; attempt += 1) {
      const listing = await Listing.findById(id);
      if (!listing) {
        req.flash("error", "Listing not found");
        return res.redirect("/listings");
      }

      const existingBooking = await Booking.exists({
        listing: id,
        status: "confirmed",
        $or: [{ checkInDate: { $lt: checkOut }, checkOutDate: { $gt: checkIn } }],
      });
      if (existingBooking) {
        req.flash("error", "Selected dates are not available. Please choose different dates.");
        return res.redirect(`/listings/${id}/book`);
      }

      const versionFilter = listing.bookingVersion === 0
        ? { $or: [{ bookingVersion: 0 }, { bookingVersion: { $exists: false } }] }
        : { bookingVersion: listing.bookingVersion };
      const lock = await Listing.findOneAndUpdate(
        { _id: id, ...versionFilter },
        { $inc: { bookingVersion: 1 } },
      );
      if (!lock) continue;

      savedBooking = await new Booking({
        listing: id,
        user: req.user._id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests,
        specialRequests,
        pricePerNight: listing.price,
        status: "confirmed",
      }).save();
    }

    if (!savedBooking) {
      req.flash("error", "Availability changed. Please try again.");
      return res.redirect(`/listings/${id}/book`);
    }

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

    const listing = await Listing.exists({ _id: id });
    if (!listing) return res.status(404).json({ error: "Listing not found" });

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
