 import { verifyToken } from '../utils/jwt.js';

/**
 * Middleware function to authenticate requests using JWT.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 * @throws {Error} - Throws an error if the token is missing, invalid, or expired.
 */
export function authenticateJWT(req, res, next) {
  console.log("In middleware",req.headers.authorization,"Stored");
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer '))
    return res.status(401).send('Missing token');

  try {
    req.user = verifyToken(auth.split(' ')[1]);
    next();
  } catch {
    res.status(403).send('Invalid / expired token');
  }
}
