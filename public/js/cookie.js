document.addEventListener("DOMContentLoaded", () => {
  const cookieBanner = document.getElementById("cookieConsent");
  const acceptBtn = document.getElementById("acceptCookies");
  const rejectBtn = document.getElementById("rejectCookies");

  // If already accepted → hide banner
  if (localStorage.getItem("cookieConsent") === "accepted") {
    cookieBanner.style.display = "none";
  }

  // Accept cookies
  acceptBtn?.addEventListener("click", () => {
    localStorage.setItem("cookieConsent", "accepted");
    cookieBanner.style.display = "none";
  });

  // Reject cookies (still hide, but mark rejected)
  rejectBtn?.addEventListener("click", () => {
    localStorage.setItem("cookieConsent", "rejected");
    cookieBanner.style.display = "none";
  });
});
