const Listing = require("../models/listing.js");
const { cloudinary } = require("../cloudconfig.js");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

module.exports.renderIndex = async (req, res) => {
  let allList = await Listing.find();
  res.render("listings/index.ejs", { allList });
};

module.exports.search = async (req, res) => {
  const city = typeof req.query.city === "string" ? req.query.city.trim().slice(0, 120) : "";

  if (!city) {
    return res.redirect("/listings");
  }

  const listings = await Listing.find({
    location: { $regex: escapeRegex(city), $options: "i" },
  });

  res.render("listings/search.ejs", { listings, city });
};

module.exports.renderNew = (req, res) => {
  return res.render("listings/new.ejs");
};

module.exports.renderShow = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findById(id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("owner");
  if (!listing) {
    req.flash("error", "Listing you request Does not exist");
    return res.redirect("/listings");
  }
  res.render("listings/show.ejs", { listing });
};

module.exports.renderCreate = async (req, res, next) => {
  try {
    if (!req.file) throw new Error("An image is required to create a listing.");
    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };
    await newListing.save();
    req.flash(
      "success",
      "Success! Your room listing has been created and is now visible to users."
    );
    return res.redirect("/listings");
  } catch (err) {
    next(err);
  }
};

module.exports.renderEdit = async (req, res) => {
  let { id } = req.params;
  const listing = await Listing.findById(id);
  if (!listing) {
    req.flash("error", "Listing does not exist");
    return res.redirect("/listings");
  }
  let originalUrl = listing.image.url;
  originalUrl = originalUrl.replace("/upload", "/upload/w_300");
  return res.render("listings/edit.ejs", { listing, originalUrl });
};

module.exports.renderUpdate = async (req, res) => {
  let { id } = req.params;
  let listing = await Listing.findByIdAndUpdate(id, { ...req.body.listing }, { runValidators: true });
  if (!listing) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }
  if (typeof req.file !== "undefined") {
    const previousFilename = listing.image?.filename;
    let url = req.file.path;
    let filename = req.file.filename;
    listing.image = { url, filename };
    await listing.save();
    if (previousFilename && previousFilename !== filename) {
      await cloudinary.uploader.destroy(previousFilename).catch(console.error);
    }
  }

  req.flash("success", " Listing Updated Successfully.");
  return res.redirect(`/listings/${id}`);
};

module.exports.renderDelete = async (req, res) => {
  let { id } = req.params;
  let deleted = await Listing.findByIdAndDelete(id);
  if (!deleted) {
    req.flash("error", "Listing not found");
    return res.redirect("/listings");
  }
  if (deleted.image?.filename) {
    await cloudinary.uploader.destroy(deleted.image.filename).catch(console.error);
  }
  req.flash("success", "Listing Deleted Successfully.");
  return res.redirect("/listings");
};
