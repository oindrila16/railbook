/**
 * Authentication business logic: register, OTP verify, login.
 */
const bcrypt = require('bcrypt');
const ApiError = require('../utils/ApiError');
const { generateOtp, getOtpExpiry } = require('../utils/otp');
const { signToken } = require('../utils/jwt');
const userModel = require('../models/user.model');
const otpModel = require('../models/otp.model');
const notificationService = require('./notification.service');

const SALT_ROUNDS = 12;

function buildAuthResponse(user) {
  const role = user.role || 'user';
  const token = signToken({
    userId: user.id,
    email: user.email,
    phone: user.phone,
    role,
  });
  return {
    token,
    user: {
      id: user.id,
      email: user.email,
      phone: user.phone,
      fullName: user.full_name,
      role,
      isVerified: Boolean(user.is_verified),
      isAdmin: role === 'admin',
    },
  };
}

async function createAndSendOtp({ userId, email, phone, purpose }) {
  await otpModel.invalidatePrevious({ email, phone, purpose });

  const otpCode = generateOtp();
  const expiresAt = getOtpExpiry();

  await otpModel.create({
    userId,
    email,
    phone,
    otpCode,
    purpose,
    expiresAt,
  });

  await notificationService.sendOtpNotification({ email, phone, otpCode });

  return otpCode;
}

/**
 * Register with email or phone + password.
 * Creates unverified user and sends OTP.
 */
async function register({ email, phone, password, fullName }) {
  const normalizedEmail = email?.toLowerCase().trim() || null;
  const normalizedPhone = phone?.trim() || null;

  let existing = null;
  if (normalizedEmail) existing = await userModel.findByEmail(normalizedEmail);
  if (!existing && normalizedPhone) existing = await userModel.findByPhone(normalizedPhone);

  if (existing?.is_verified) {
    throw ApiError.conflict('An account with this email or phone already exists');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  let user;
  if (existing) {
    await userModel.updatePassword(existing.id, passwordHash);
    user = await userModel.findById(existing.id);
  } else {
    user = await userModel.create({
      email: normalizedEmail,
      phone: normalizedPhone,
      passwordHash,
      fullName,
    });
  }

  await createAndSendOtp({
    userId: user.id,
    email: normalizedEmail,
    phone: normalizedPhone,
    purpose: 'registration',
  });

  return {
    message: 'Registration successful. Please verify OTP sent to your email/phone.',
    userId: user.id,
    email: user.email,
    phone: user.phone,
    expiresInMinutes: require('../config').otp.expiryMinutes,
  };
}

/**
 * Verify OTP and activate account; returns JWT on success.
 */
async function verifyOtp({ email, phone, otpCode }) {
  const normalizedEmail = email?.toLowerCase().trim() || null;
  const normalizedPhone = phone?.trim() || null;

  const otpRecord = await otpModel.findValidOtp({
    email: normalizedEmail,
    phone: normalizedPhone,
    otpCode,
    purpose: 'registration',
  });

  if (!otpRecord) {
    throw ApiError.badRequest('Invalid or expired OTP');
  }

  const user = await userModel.findById(otpRecord.user_id);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

  await otpModel.markUsed(otpRecord.id);
  await userModel.markVerified(user.id);

  const verifiedUser = await userModel.findById(user.id);
  return {
    message: 'Account verified successfully',
    ...buildAuthResponse({ ...verifiedUser, is_verified: 1 }),
  };
}

/**
 * Login with email or phone + password (verified users only).
 */
async function login({ email, phone, password }) {
  const normalizedEmail = email?.toLowerCase().trim() || null;
  const normalizedPhone = phone?.trim() || null;

  const user = await userModel.findByEmailOrPhoneWithPassword(
    normalizedEmail,
    normalizedPhone
  );

  if (!user) {
    throw ApiError.unauthorized('Invalid email/phone or password');
  }

  if (!user.is_verified) {
    throw ApiError.forbidden(
      'Account not verified. Please complete OTP verification first.'
    );
  }

  if (!user.is_active) {
    throw ApiError.forbidden('Account is deactivated');
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);
  if (!passwordMatch) {
    throw ApiError.unauthorized('Invalid email/phone or password');
  }

  return {
    message: 'Login successful',
    ...buildAuthResponse(user),
  };
}

module.exports = { register, verifyOtp, login, buildAuthResponse };
