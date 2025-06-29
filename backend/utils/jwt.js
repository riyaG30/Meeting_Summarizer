import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

/**
 * Generates a JSON Web Token (JWT) with the provided payload.
 *
 * @param {Object} payload - The payload object containing the token data.
 * @returns {String} - The generated JWT string.
 */
export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });
}

/**
 * Verifies a JSON Web Token (JWT) using the secret key.
 *
 * @param {String} token - The JWT string to be verified.
 * @returns {Object} - The decoded payload if the token is valid, otherwise throws an error.
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
