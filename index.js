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
const dashboardRouter = require("./routes/dashboard.js");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const flash = require("connect-flash");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user.js");
const multer = require("multer");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const crypto = require("crypto");
const dbUrl = process.env.ATLASDB_URL;
const isProduction = process.env.NODE_ENV === "production";
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

const port = process.env.PORT || 8000;
app.engine("ejs", ejsMate);
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "/views"));
if (isProduction) app.set("trust proxy", 1);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://kit.fontawesome.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com", "https://ka-f.fontawesome.com"],
      connectSrc: ["'self'", "https://ka-f.fontawesome.com"],
    },
  },
}));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(express.static(path.join(__dirname, "/public")));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: true, legacyHeaders: false }));

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
    saveUninitialized: false,
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      secure: isProduction,
      sameSite: "lax",
    },
  }),
);
app.use(flash());

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);
app.use((req, res, next) => {
  if (!req.session.csrfToken) req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  res.locals.csrfToken = req.session.csrfToken;

  if (safeMethods.has(req.method)) return next();
  // Multipart bodies are parsed later by Multer, so uploads submit the token
  // in the query string while ordinary forms submit it in the request body.
  const submittedToken = req.body?._csrf || req.query?._csrf || req.get("x-csrf-token");
  const expectedToken = req.session.csrfToken;
  const valid = typeof submittedToken === "string" &&
    submittedToken.length === expectedToken.length &&
    crypto.timingSafeEqual(Buffer.from(submittedToken), Buffer.from(expectedToken));

  if (valid) {
    // Prevent CSRF metadata from reaching Joi/model validation for normal forms.
    if (req.body) delete req.body._csrf;
    return next();
  }
  req.flash("error", "Your form expired. Please try again.");
  return res.status(403).redirect(req.get("referer") || "/listings");
});

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
  res.locals.isAdmin = Boolean(req.user && (req.user.role === "admin" || req.user.email === process.env.ADMIN_EMAIL));
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

//Dashboard Route
app.use("/dashboard", dashboardRouter);

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
  if (status >= 500) console.error(err);
  res.status(status).render("error.ejs", { err: { status, message } });
});

app.listen(port, (req, res) => {
  console.log(`Server is Listening on ${port}`);
});
