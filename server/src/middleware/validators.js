const { body, validationResult } = require('express-validator');

/**
 * Middleware checking validation results and returning standard error format
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Invalid input parameters',
      errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
    });
  }
  next();
};

/**
 * Validation rules for passenger report submission
 */
const reportValidationRules = [
  body('routeCode')
    .trim()
    .notEmpty()
    .withMessage('BRT Route selection is required'),
  body('stationName')
    .trim()
    .notEmpty()
    .withMessage('Station name is required'),
  body('category')
    .trim()
    .isIn([
      'Delay',
      'Overcrowding',
      'AC / Climate Control',
      'Safety & Security',
      'Ticketing / Zu Card',
      'Station Infrastructure',
      'Bus Breakdown',
      'Other'
    ])
    .withMessage('Valid issue category must be selected'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Please provide a descriptive explanation (10 to 1000 characters)'),
  body('passengerContact')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Contact details cannot exceed 100 characters')
];

/**
 * Validation rules for creating a service alert / announcement
 */
const alertValidationRules = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 150 })
    .withMessage('Alert title must be between 5 and 150 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Alert description must be between 10 and 2000 characters'),
  body('source')
    .trim()
    .notEmpty()
    .withMessage('Identifiable source attribution is required for information transparency'),
  body('severity')
    .optional()
    .isIn(['info', 'warning', 'disruption', 'closure'])
    .withMessage('Severity must be info, warning, disruption, or closure'),
  body('freshnessHours')
    .optional()
    .isInt({ min: 1, max: 48 })
    .withMessage('Freshness window must be between 1 and 48 hours')
];

/**
 * Validation rules for admin login
 */
const loginValidationRules = [
  body('username')
    .trim()
    .notEmpty()
    .withMessage('Username or email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

module.exports = {
  validateRequest,
  reportValidationRules,
  alertValidationRules,
  loginValidationRules
};
