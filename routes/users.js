const express = require("express");
const router = express.Router();
const User = require("../models/user.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middleware.js");
const userController = require("../controllers/users.js");

//Signup Route
router.get("/signup", userController.renderSignup);

//Route to Create Signup
router.post("/signup", userController.signup);

//Login Route
router.get("/login", userController.renderLogin);

//Route to login Route to check username and password is correct using passport library
router.post(
  "/login",
  saveRedirectUrl,
  passport.authenticate("local", {
    failureFlash: true,
    failureRedirect: "/login",
  }),
  userController.login
);

router.get("/logout", userController.logout);

module.exports = router;
