// Centralized Express Error Handler

export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err.stack || err.message || err);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
};
