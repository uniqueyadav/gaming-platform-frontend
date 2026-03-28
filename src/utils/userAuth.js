const USER_SESSION_KEY = "golfUserSession";

export function getUserSession() {
  try {
    const rawValue = localStorage.getItem(USER_SESSION_KEY);
    return rawValue ? JSON.parse(rawValue) : null;
  } catch (error) {
    console.error("Failed to parse user session", error);
    return null;
  }
}

export function setUserSession(user) {
  if (!user?._id) {
    return;
  }

  const payload = {
    _id: user._id,
    fullName: user.fullName || "",
    email: user.email || "",
  };

  localStorage.setItem(USER_SESSION_KEY, JSON.stringify(payload));
}

export function clearUserSession() {
  localStorage.removeItem(USER_SESSION_KEY);
}

export function isUserAuthenticated() {
  return Boolean(getUserSession()?._id);
}
