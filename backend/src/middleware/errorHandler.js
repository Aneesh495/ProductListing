const AppError = require('../utils/appError');

// Handle 404 errors
const notFound = (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
};

// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  // Default error response
  let error = { ...err };
  error.message = err.message;
  error.stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;

  // Log the error for development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error 💥', {
      message: error.message,
      status: error.statusCode,
      stack: error.stack,
      error: error
    });
  }

  // Handle specific error types
  if (err.name === 'CastError') {
    // Handle invalid ObjectId
    const message = `Invalid ${err.path}: ${err.value}`;
    error = new AppError(message, 400);
  } else if (err.code === 11000) {
    // Handle duplicate field values
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value: ${value}. Please use another value!`;
    error = new AppError(message, 400);
  } else if (err.name === 'ValidationError') {
    // Handle validation errors
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    error = new AppError(message, 400);
  } else if (err.name === 'JsonWebTokenError') {
    // Handle JWT errors
    const message = 'Invalid token. Please log in again!';
    error = new AppError(message, 401);
  } else if (err.name === 'TokenExpiredError') {
    // Handle expired tokens
    const message = 'Your token has expired! Please log in again.';
    error = new AppError(message, 401);
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    status: error.status || 'error',
    message: error.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(err);
  
  // If server is defined, close it before exiting
  if (typeof server !== 'undefined' && server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  // Close server & exit process
  server.close(() => {
    process.exit(1);
  });
});

module.exports = {
  notFound,
  errorHandler
};