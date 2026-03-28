export function isAdminAuthenticated() {
  return localStorage.getItem("adminAuthenticated") === "true";
}

export function setAdminSession(email = "") {
  localStorage.setItem("adminAuthenticated", "true");
  localStorage.setItem("adminEmail", email);
}

export function clearAdminSession() {
  localStorage.removeItem("adminAuthenticated");
  localStorage.removeItem("adminEmail");
}
