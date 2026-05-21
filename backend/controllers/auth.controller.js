/**
 * Auth HTTP handlers — thin layer over auth.service.
 */
const authService = require('../services/auth.service');

async function register(req, res) {
  const { email, phone, password, fullName } = req.body;
  const result = await authService.register({
    email,
    phone,
    password,
    fullName,
  });
  res.status(201).json({ success: true, data: result });
}

async function verifyOtp(req, res) {
  const { email, phone, otp } = req.body;
  const result = await authService.verifyOtp({
    email,
    phone,
    otpCode: otp,
  });
  res.json({ success: true, data: result });
}

async function login(req, res) {
  const { email, phone, password } = req.body;
  const result = await authService.login({ email, phone, password });
  res.json({ success: true, data: result });
}

module.exports = { register, verifyOtp, login };
