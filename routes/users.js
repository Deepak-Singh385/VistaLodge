const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");
const rateLimit = require("express-rate-limit");

const authenticationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many attempts. Please try again in 15 minutes.",
});

//Signup Route
router.get("/signup", userController.renderSignup);

//Route to Create Signup
router.post("/signup", authenticationLimiter, userController.signup);

//Login Route
router.get("/login", userController.renderLogin);

//Route to login Route to check username and password is correct using passport library
router.post(
  "/login",
  authenticationLimiter,
  saveRedirectUrl,
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  userController.login
);

router.post("/logout", userController.logout);

module.exports = router;
