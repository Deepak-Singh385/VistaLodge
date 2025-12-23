const togglePassword = document.getElementById("togglePassword");
const password = document.getElementById("password");
const icon = togglePassword.querySelector("i");

togglePassword.addEventListener("click", () => {
  // Toggle type
  const type = password.type === "password" ? "text" : "password";
  password.type = type;

  // Toggle icon
  icon.classList.toggle("fa-eye");
  icon.classList.toggle("fa-eye-slash");
});
