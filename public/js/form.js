const pricePerNight = window.LISTING_DATA.pricePerNight;

const checkInInput = document.getElementById("checkInDate");
const checkOutInput = document.getElementById("checkOutDate");

const nightsValue = document.getElementById("nightsValue");
const priceNights = document.getElementById("priceNights");
const subtotal = document.getElementById("subtotal");
const totalPrice = document.getElementById("totalPrice");
const nightsInfo = document.getElementById("nightsInfo");

function calculatePrice() {
  if (!checkInInput.value || !checkOutInput.value) {
    resetPrice();
    return;
  }

  const checkIn = new Date(checkInInput.value);
  const checkOut = new Date(checkOutInput.value);

  const oneDay = 1000 * 60 * 60 * 24;
  const diff = checkOut - checkIn;
  const nights = Math.ceil(diff / oneDay);

  if (nights <= 0) {
    resetPrice();
    nightsInfo.innerText = "Check-out must be after check-in";
    return;
  }

  const total = nights * pricePerNight;

  // Update UI
  nightsValue.innerText = nights;
  priceNights.innerText = nights;
  subtotal.innerText = `₹${total.toLocaleString("en-IN")}`;
  totalPrice.innerText = `₹${total.toLocaleString("en-IN")}`;

  nightsInfo.innerText = `${nights} night${nights > 1 ? "s" : ""} selected`;
}

function resetPrice() {
  nightsValue.innerText = "0";
  priceNights.innerText = "0";
  subtotal.innerText = "₹0";
  totalPrice.innerText = "₹0";
  nightsInfo.innerText = "";
}

// 🔥 Recalculate when dates change
checkInInput.addEventListener("change", calculatePrice);
checkOutInput.addEventListener("change", calculatePrice);
// ===== GUEST COUNTER LOGIC =====
let guestCount = 1;

const guestCountEl = document.getElementById("guestCount");
const guestInput = document.getElementById("numberOfGuests");

function increaseGuests() {
  if (guestCount < 10) {
    // optional max limit
    guestCount++;
    updateGuests();
  }
}

function decreaseGuests() {
  if (guestCount > 1) {
    guestCount--;
    updateGuests();
  }
}

function updateGuests() {
  guestCountEl.innerText = guestCount;
  guestInput.value = guestCount; // 👈 THIS is what backend receives
}
