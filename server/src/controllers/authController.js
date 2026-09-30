import User from '../models/User.js';
import { generateToken } from '../utils/jwt.js';
import { createWsTicket } from '../utils/wsTickets.js';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { username }],
    });

    if (existingUser) {
      res.status(409);
      if (existingUser.email === email.toLowerCase()) {
        return next(new Error('User with this email already exists.'));
      }
      return next(new Error('Username is already taken.'));
    }

    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      username,
      email: email.toLowerCase(),
      passwordHash,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user || !(await user.matchPassword(password))) {
      res.status(401);
      return next(new Error('Invalid email or password.'));
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        username: req.user.username,
        email: req.user.email,
      },
    },
  });
};

// @desc    Issue a short-lived WebSocket authentication ticket
// @route   POST /api/auth/ws-ticket
// @access  Private
export const getWsTicket = async (req, res) => {
  const ticket = createWsTicket(req.user);
  res.status(200).json({
    success: true,
    data: {
      ticket,
      expiresInSeconds: 30,
    },
  });
};
