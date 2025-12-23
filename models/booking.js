const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  listing: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Listing",
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  checkInDate: {
    type: Date,
    required: true,
  },
  checkOutDate: {
    type: Date,
    required: true,
  },
  numberOfGuests: {
    type: Number,
    required: true,
    default: 1,
  },
  numberOfNights: {
    type: Number,
    min: 1,
  },
  pricePerNight: {
    type: Number,
    required: true,
  },
  totalPrice: {
    type: Number,
  },
  status: {
    type: String,
    enum: ["confirmed", "cancelled", "completed"],
    default: "confirmed",
  },
  specialRequests: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});
bookingSchema.pre("save", function (next) {
  if (this.checkInDate && this.checkOutDate && this.pricePerNight) {
    const oneDay = 1000 * 60 * 60 * 24;
    const diff = this.checkOutDate - this.checkInDate;

    this.numberOfNights = Math.ceil(diff / oneDay);

    if (this.numberOfNights <= 0) {
      return next(new Error("Invalid booking dates"));
    }

    this.totalPrice = this.numberOfNights * this.pricePerNight;
  }

  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
