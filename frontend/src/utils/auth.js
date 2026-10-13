const TOKEN_KEY = 'train_token';
const USER_KEY = 'train_user';
const PENDING_EMAIL_KEY = 'pending_email';

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setPendingEmail(email, verificationMode = 'delivery') {
  sessionStorage.setItem(PENDING_EMAIL_KEY, email);
  sessionStorage.setItem('railbook_pending_verification_mode', verificationMode);
}

export function getPendingEmail() {
  return sessionStorage.getItem(PENDING_EMAIL_KEY);
}

export function clearPendingEmail() {
  sessionStorage.removeItem(PENDING_EMAIL_KEY);
  sessionStorage.removeItem('railbook_pending_verification_mode');
}

export function isAuthenticated() {
  return Boolean(getToken());
}

export function getPendingVerificationMode() {
  return sessionStorage.getItem('railbook_pending_verification_mode') || 'delivery';
}
