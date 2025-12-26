//It is use for telling that we not working with production environment
require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError.js");
const listingsRouter = require("./routes/listing.js");
const reviewsRouter = require("./routes/review.js");
const userRouter = require("./routes/users.js");
const bookingRouter = require("./routes/booking.js");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");

const dbUrl = process.env.ATLASDB_URL;
main()
  .then(() => {
    console.log("connected to DB");
  })
  .catch((err) => {
    console.log(err);
  });
async function main() {
  await mongoose.connect(dbUrl);
}

const port = 8000;
app.engine("ejs", ejsMate);
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "/public")));

//It is use for Mongo Atlas Service
const store = MongoStore.create({
  mongoUrl: dbUrl,
  crypto: {
    secret: process.env.SECRET,
  },
  touchAfter: 24 * 3600,
});
store.on("error", (error) => {
  console.log("error in Mongo Session store", error);
});
app.use(
  session({
    store,
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
      expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
    },
  })
);
app.use(flash());

//Authentication of User
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// app.get("/", (req, res) => {
//   res.send("Root Page");
// });

app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.currentUser = req.user;
  next();
});
// Example of adding data

// app.get("/testlisting", (req, res) => {
//   let sampleList = new Listing({
//     title: "Harbor Villa",
//     description: "A modern, spacious room featuring a king-size bed",
//     price: 1899,
//     location: "Seawoods,Navi-Mumbai",
//     country: "India",
//   });
//   sampleList
//     .save()
//     .then(console.log("saved"))
//     .catch((err) => {
//       console.log(err);
//     });
//   res.send("Successfull!");
// });

// //Demouser Just for Practice
// app.get("/demouser", async (req, res) => {
//   let user = new User({
//     email: "jassi@gmail.com",
//     username: "jassi",
//   });
//   let newUser = await User.register(user, "jassi");
//   res.send(newUser);
// });

//Listing Routes
app.use("/listings", listingsRouter);

//Reviews
app.use("/listings/:id/reviews", reviewsRouter);

//SignUp
app.use("/", userRouter);

//Booking
app.use("/", bookingRouter);

//Root Route
app.get("/", (req, res) => {
  res.redirect("/listings");
});

// Multer error handling (add before your other error handlers)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      req.flash("error", "File size too large! Maximum 10MB allowed.");
      return res.redirect("/listings/new");
    }
  }
  next(err);
});

//Error Handling
app.use((req, res, next) => {
  next(new ExpressError(404, "Page not found!"));
});

app.use((err, req, res, next) => {
  let { status = 500, message = "Something went Wrong" } = err;
  res.render("error.ejs", { err });
  // res.status(status).send(message);
});

app.listen(port, (req, res) => {
  console.log(`Server is Listening on ${port}`);
});
