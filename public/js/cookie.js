document.addEventListener("DOMContentLoaded", () => {
  const cookieBox = document.getElementById("cookieConsent");
  const rejectBtn = document.getElementById("rejectCookies");

  // Show popup only if no decision yet
  if (!localStorage.getItem("cookiesDecision")) {
    cookieBox.classList.remove("d-none");
  }

  rejectBtn.addEventListener("click", () => {
    localStorage.setItem("cookiesDecision", "rejected");
    cookieBox.classList.add("d-none");
  });
});
