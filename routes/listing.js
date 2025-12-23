const express = require("express");
const router = express.Router();
const { listingSchema } = require("../schema.js");
const ExpressError = require("../utils/ExpressError.js");
const Listing = require("../models/listing.js");
const { isLoggedin, isOwner } = require("../middleware.js");
const listingController = require("../controllers/listings.js");
const multer = require("multer");
const { storage } = require("../cloudconfig.js");

const validateListing = (req, res, next) => {
  let { error } = listingSchema.validate(req.body);
  if (error) {
    let errMsg = error.details.map((el) => el.message).join(",");
    throw new ExpressError(400, errMsg);
  } else {
    next();
  }
};
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});
// router
//   .route("/")
//   .get(listingController.renderIndex)
//   .post(
//     isLoggedin,
//     ,
//     validateListing,
//     listingController.renderCreate
//   );

//Index Route
router.get("/", listingController.renderIndex);

//Search Route
router.get("/search", listingController.search);
//New Route
router.get("/new", isLoggedin, listingController.renderNew);

//Show Route
router.get("/:id", listingController.renderShow);

//Create Route
router.post(
  "/",
  upload.single("listing[image]"),
  validateListing,
  listingController.renderCreate
);

//Edit Route
router.get("/:id/edit", isLoggedin, isOwner, listingController.renderEdit);

//Update Route
router.put(
  "/:id",
  isLoggedin,
  isOwner,
  upload.single("listing[image]"),
  validateListing,
  listingController.renderUpdate
);

//Delete Route
router.delete("/:id", isLoggedin, isOwner, listingController.renderDelete);

//Book now route
router.get("/:id/book", isLoggedin, async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  res.render("bookings/preview", { listing });
});

module.exports = router;
