import mongoose from 'mongoose';

const otpVerificationSchema = new mongoose.Schema(
  {
    phoneNormalized: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 5,
    },
    consumed: {
      type: Boolean,
      default: false,
    },
    lastSentAt: {
      type: Date,
      default: Date.now,
    },
    sendCountWindow: {
      type: Number,
      default: 1,
    },
    windowStartedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const OtpVerification = mongoose.model('OtpVerification', otpVerificationSchema);

export default OtpVerification;
