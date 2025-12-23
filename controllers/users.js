const User = require("../models/user.js");

module.exports.renderSignup = (req, res) => {
  res.render("users/signup.ejs");
};

module.exports.signup = async (req, res) => {
  try {
    let { username, email, password } = req.body;
    const newUser = new User({
      username,
      email,
    });
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
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
