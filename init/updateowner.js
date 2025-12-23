const mongoose = require("mongoose");
const Listing = require("../models/listing.js");
const User = require("../models/user.js");

async function main() {
  await mongoose.connect("mongodb://127.0.0.1:27017/wanderlust");
}

const updateOwners = async () => {
  // Get first user
  const user = await User.findOne();

  if (!user) {
    console.log("❌ No user found!");
    return;
  }

  // Update all listings without owner
  const result = await Listing.updateMany(
    { owner: { $exists: false } }, // Find listings without owner
    { $set: { owner: user._id } }
  );

  console.log(
    `✅ Updated ${result.modifiedCount} listings with owner: ${user.username}`
  );
  mongoose.connection.close();
};

main()
  .then(() => {
    console.log("Connected to DB");
    updateOwners();
  })
  .catch(console.log);
