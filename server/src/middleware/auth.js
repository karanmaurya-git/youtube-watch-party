import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    res.status(401);
    return next(new Error('Not authorized, token missing.'));
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    res.status(401);
    return next(new Error('Not authorized, token invalid or expired.'));
  }

  try {
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      res.status(401);
      return next(new Error('User not found.'));
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401);
    return next(new Error('Authentication failed.'));
  }
};
