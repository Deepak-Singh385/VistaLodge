(() => {
  "use strict";

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll(".needs-validation");

  // Loop over them and prevent submission
  Array.from(forms).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add("was-validated");
      },
      false
    );
  });
})();

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".flash-alert").forEach((alert) => {
    const closeBtn = alert.querySelector(".btn-close");

    // Auto close after 4 seconds
    setTimeout(() => {
      alert.style.opacity = "0";
      setTimeout(() => alert.remove(), 400);
    }, 4000);

    // Manual close
    closeBtn.addEventListener("click", () => {
      alert.remove();
    });
  });
});
