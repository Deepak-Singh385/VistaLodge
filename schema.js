const Joi = require("joi");
module.exports.listingSchema = Joi.object({
  listing: Joi.object({
    title: Joi.string().trim().max(120).required(),
    description: Joi.string().trim().max(5000).required(),
    price: Joi.number().required().min(0),
    location: Joi.string().trim().max(120).required(),
    country: Joi.string().trim().max(120).required(),
    image: Joi.string().allow("", null),
  }).required(),
});

module.exports.reviewSchema = Joi.object({
  review: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().trim().max(2000).required(),
  }).required(),
});

module.exports.bookingSchema = Joi.object({
  booking: Joi.object({
    checkInDate: Joi.date().required().messages({
      "any.required": "Check-in date is required",
      "date.base": "Check-in date must be a valid date",
    }),
    checkOutDate: Joi.date().required().messages({
      "any.required": "Check-out date is required",
      "date.base": "Check-out date must be a valid date",
    }),
    numberOfGuests: Joi.number().required().min(1).max(10).messages({
      "any.required": "Number of guests is required",
      "number.min": "At least 1 guest is required",
      "number.max": "Maximum 10 guests allowed",
    }),
    specialRequests: Joi.string().trim().max(1000).allow("", null).optional(),
  }).required(),
});
