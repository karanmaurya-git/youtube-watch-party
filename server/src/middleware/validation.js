// Input Validation Helpers

export const validateRegisterInput = (req, res, next) => {
  const { username, email, password } = req.body;

  if (!username || typeof username !== 'string' || username.trim().length < 3) {
    res.status(400);
    return next(new Error('Username must be at least 3 characters long.'));
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    res.status(400);
    return next(new Error('Please provide a valid email address.'));
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    res.status(400);
    return next(new Error('Password must be at least 6 characters long.'));
  }

  next();
};

export const validateLoginInput = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    return next(new Error('Please provide both email and password.'));
  }

  next();
};
