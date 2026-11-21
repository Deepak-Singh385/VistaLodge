const User = require("../models/user.js");

module.exports.renderSignup = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.signup = async (req, res, next) => {
  try {
    let { username, email, password } = req.body;
    username = typeof username === "string" ? username.trim() : "";
    email = typeof email === "string" ? email.trim().toLowerCase() : "";
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (
      !/^[a-zA-Z0-9_-]{3,30}$/.test(username) ||
      !isEmail ||
      !password ||
      password.length > 128
    ) {
      req.flash(
        "error",
        "Use a username, valid email, and a password of at least 12 characters.",
      );
      return res.redirect("/signup");
    }
    const newUser = new User({
      username,
      email,
    });
    const registeredUser = await User.register(newUser, password);
    req.login(registeredUser, (err) => {
      if (err) {
        return next(err);
      } else {
        req.flash("success", "User registered successfully!");
        return res.redirect("/listings");
      }
    });
  } catch (error) {
    req.flash("error", error.message);
    return res.redirect("/signup");
  }
};

module.exports.renderLogin = (req, res) => {
  return res.render("users/login.ejs");
};

module.exports.login = async (req, res) => {
  req.flash("success", `Welcome Back ${req.user.username} to VistaLodge`);
  let redirectUrl = res.locals.redirectUrl || "/listings";
  //Clean up the session after user logout
  delete req.session.redirectUrl;

  res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
  //req,logout() is a callback method
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash("success", "Logout successfully");
    res.redirect("/listings");
  });
};
