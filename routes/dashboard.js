const express = require("express");
const router = express.Router();

const dashboardController = require("../controllers/dashboard");
const { isLoggedin, isDashboardOwner } = require("../middleware");

router.get(
  "/",
  isLoggedin,
  isDashboardOwner,
  dashboardController.renderDashboard,
);

module.exports = router;
