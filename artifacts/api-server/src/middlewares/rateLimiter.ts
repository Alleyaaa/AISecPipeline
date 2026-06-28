import { rateLimit, ipKeyGenerator } from "express-rate-limit";

/**
 * General API rate limiter — applies to all /api/* endpoints
 * 120 requests per 15 minutes per IP
 */
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
  skipSuccessfulRequests: false,
});

/**
 * Auth rate limiter — stricter for login endpoint
 * 10 attempts per 15 minutes per IP to prevent brute-force
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many login attempts. Please wait 15 minutes before trying again." },
  skipSuccessfulRequests: true,
});

/**
 * AI Analysis rate limiter — expensive operation, strictly limited
 * 100 analyze requests per hour per IP
 */
export const analyzeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: "AI analysis rate limit exceeded. Maximum 100 analyses per hour.",
    retryAfter: "1 hour",
  },
  keyGenerator: (req) => {
    // Use ipKeyGenerator helper to properly handle IPv6 addresses
    const ip = ipKeyGenerator(req);
    return `${ip}:analyze`;
  },
});

/**
 * Log ingestion rate limiter — moderate limits
 * 300 log entries per 15 minutes per IP
 */
export const logIngestionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Log ingestion rate limit exceeded. Please slow down." },
});
