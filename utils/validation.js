/**
 * Input Validation and Sanitization Utilities
 * Production-ready data validation with comprehensive rules
 */

import { createValidationError } from './errorHandler';

/**
 * Validation rule types
 */
export const VALIDATION_RULES = {
    REQUIRED: 'required',
    MIN_LENGTH: 'minLength',
    MAX_LENGTH: 'maxLength',
    MIN_VALUE: 'minValue',
    MAX_VALUE: 'maxValue',
    PATTERN: 'pattern',
    EMAIL: 'email',
    PASSWORD: 'password',
    NUMBER: 'number',
    INTEGER: 'integer',
    POSITIVE: 'positive',
    CUSTOM: 'custom'
};

/**
 * Common validation patterns
 */
export const VALIDATION_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    PHONE: /^\+?[\d\s-()]+$/,
    ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
    DECIMAL: /^\d+(\.\d{1,2})?$/,
    INTEGER: /^\d+$/
};

/**
 * Sanitize string input
 */
export const sanitizeString = (input) => {
    if (typeof input !== 'string') return '';

    return input
        .trim() // Remove leading/trailing whitespace
        .replace(/[<>]/g, '') // Remove potential HTML/XML tags
        .replace(/['"]/g, '') // Remove quotes that could break queries
        .replace(/[\x00-\x1f\x7f]/g, ''); // Remove control characters
};

/**
 * Sanitize number input
 */
export const sanitizeNumber = (input, options = {}) => {
    const { allowDecimals = true, min, max } = options;

    if (input === null || input === undefined || input === '') return null;

    let num;
    if (typeof input === 'string') {
        // Remove any non-numeric characters except decimal point
        const cleaned = input.replace(/[^\d.-]/g, '');
        num = allowDecimals ? parseFloat(cleaned) : parseInt(cleaned, 10);
    } else {
        num = allowDecimals ? parseFloat(input) : parseInt(input, 10);
    }

    if (isNaN(num)) return null;

    // Apply bounds if specified
    if (typeof min === 'number' && num < min) num = min;
    if (typeof max === 'number' && num > max) num = max;

    return num;
};

/**
 * Sanitize email input
 */
export const sanitizeEmail = (input) => {
    if (typeof input !== 'string') return '';
    return input.trim().toLowerCase();
};

/**
 * Individual validation functions
 */
const validationFunctions = {
    [VALIDATION_RULES.REQUIRED]: (value, rule) => {
        if (value === null || value === undefined || value === '') {
            return `${rule.field || 'Field'} is required`;
        }
        return null;
    },

    [VALIDATION_RULES.MIN_LENGTH]: (value, rule) => {
        if (typeof value === 'string' && value.length < rule.value) {
            return `${rule.field || 'Field'} must be at least ${rule.value} characters`;
        }
        return null;
    },

    [VALIDATION_RULES.MAX_LENGTH]: (value, rule) => {
        if (typeof value === 'string' && value.length > rule.value) {
            return `${rule.field || 'Field'} must be no more than ${rule.value} characters`;
        }
        return null;
    },

    [VALIDATION_RULES.MIN_VALUE]: (value, rule) => {
        const num = parseFloat(value);
        if (!isNaN(num) && num < rule.value) {
            return `${rule.field || 'Field'} must be at least ${rule.value}`;
        }
        return null;
    },

    [VALIDATION_RULES.MAX_VALUE]: (value, rule) => {
        const num = parseFloat(value);
        if (!isNaN(num) && num > rule.value) {
            return `${rule.field || 'Field'} must be no more than ${rule.value}`;
        }
        return null;
    },

    [VALIDATION_RULES.PATTERN]: (value, rule) => {
        if (typeof value === 'string' && !rule.value.test(value)) {
            return rule.message || `${rule.field || 'Field'} format is invalid`;
        }
        return null;
    },

    [VALIDATION_RULES.EMAIL]: (value, rule) => {
        if (typeof value === 'string' && !VALIDATION_PATTERNS.EMAIL.test(value)) {
            return `${rule.field || 'Email'} is not a valid email address`;
        }
        return null;
    },

    [VALIDATION_RULES.PASSWORD]: (value, rule) => {
        if (typeof value === 'string') {
            if (value.length < 8) {
                return 'Password must be at least 8 characters';
            }
            if (!VALIDATION_PATTERNS.PASSWORD.test(value)) {
                return 'Password must contain uppercase, lowercase, number, and special character';
            }
        }
        return null;
    },

    [VALIDATION_RULES.NUMBER]: (value, rule) => {
        const num = parseFloat(value);
        if (isNaN(num)) {
            return `${rule.field || 'Field'} must be a valid number`;
        }
        return null;
    },

    [VALIDATION_RULES.INTEGER]: (value, rule) => {
        const num = parseInt(value, 10);
        if (isNaN(num) || !Number.isInteger(num)) {
            return `${rule.field || 'Field'} must be a whole number`;
        }
        return null;
    },

    [VALIDATION_RULES.POSITIVE]: (value, rule) => {
        const num = parseFloat(value);
        if (!isNaN(num) && num <= 0) {
            return `${rule.field || 'Field'} must be a positive number`;
        }
        return null;
    },

    [VALIDATION_RULES.CUSTOM]: (value, rule) => {
        return rule.validator(value, rule);
    }
};

/**
 * Validate single field
 */
export const validateField = (value, rules, fieldName = '') => {
    const errors = [];

    for (const rule of rules) {
        const ruleWithField = { ...rule, field: fieldName || rule.field };
        const validationFn = validationFunctions[rule.type];

        if (validationFn) {
            const error = validationFn(value, ruleWithField);
            if (error) {
                errors.push(error);
                // Stop on first error unless specified otherwise
                if (!rule.continueOnError) break;
            }
        }
    }

    return errors;
};

/**
 * Validate entire object
 */
export const validateObject = (data, schema) => {
    const errors = {};
    let hasErrors = false;

    Object.entries(schema).forEach(([fieldName, rules]) => {
        const fieldValue = data[fieldName];
        const fieldErrors = validateField(fieldValue, rules, fieldName);

        if (fieldErrors.length > 0) {
            errors[fieldName] = fieldErrors;
            hasErrors = true;
        }
    });

    return {
        isValid: !hasErrors,
        errors,
        errorMessages: hasErrors ? Object.values(errors).flat() : []
    };
};

/**
 * Common validation schemas
 */
export const VALIDATION_SCHEMAS = {
    // User authentication
    SIGN_UP: {
        email: [
            { type: VALIDATION_RULES.REQUIRED },
            { type: VALIDATION_RULES.EMAIL }
        ],
        password: [
            { type: VALIDATION_RULES.REQUIRED },
            { type: VALIDATION_RULES.PASSWORD }
        ],
        confirmPassword: [
            { type: VALIDATION_RULES.REQUIRED },
            {
                type: VALIDATION_RULES.CUSTOM,
                validator: (value, rule, data) => {
                    if (value !== data?.password) {
                        return 'Passwords do not match';
                    }
                    return null;
                }
            }
        ]
    },

    SIGN_IN: {
        email: [
            { type: VALIDATION_RULES.REQUIRED },
            { type: VALIDATION_RULES.EMAIL }
        ],
        password: [
            { type: VALIDATION_RULES.REQUIRED }
        ]
    },

    // Food database
    FOOD_ITEM: {
        name: [
            { type: VALIDATION_RULES.REQUIRED },
            { type: VALIDATION_RULES.MIN_LENGTH, value: 2 },
            { type: VALIDATION_RULES.MAX_LENGTH, value: 100 }
        ],
        calories: [
            { type: VALIDATION_RULES.REQUIRED },
            { type: VALIDATION_RULES.NUMBER },
            { type: VALIDATION_RULES.MIN_VALUE, value: 0 },
            { type: VALIDATION_RULES.MAX_VALUE, value: 10000 }
        ],
        protein: [
            { type: VALIDATION_RULES.NUMBER },
            { type: VALIDATION_RULES.MIN_VALUE, value: 0 },
            { type: VALIDATION_RULES.MAX_VALUE, value: 1000 }
        ],
        carbs: [
            { type: VALIDATION_RULES.NUMBER },
            { type: VALIDATION_RULES.MIN_VALUE, value: 0 },
            { type: VALIDATION_RULES.MAX_VALUE, value: 1000 }
        ],
        fat: [
            { type: VALIDATION_RULES.NUMBER },
            { type: VALIDATION_RULES.MIN_VALUE, value: 0 },
            { type: VALIDATION_RULES.MAX_VALUE, value: 1000 }
        ]
    },

    // Meal entry
    MEAL_ENTRY: {
        foodId: [
            { type: VALIDATION_RULES.REQUIRED }
        ],
        quantity: [
            { type: VALIDATION_RULES.REQUIRED },
            { type: VALIDATION_RULES.NUMBER },
            { type: VALIDATION_RULES.POSITIVE }
        ],
        mealType: [
            { type: VALIDATION_RULES.REQUIRED },
            {
                type: VALIDATION_RULES.CUSTOM,
                validator: (value) => {
                    const validTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
                    if (!validTypes.includes(value)) {
                        return 'Invalid meal type';
                    }
                    return null;
                }
            }
        ]
    },

    // Water entry
    WATER_ENTRY: {
        amount: [
            { type: VALIDATION_RULES.REQUIRED },
            { type: VALIDATION_RULES.NUMBER },
            { type: VALIDATION_RULES.MIN_VALUE, value: 1 },
            { type: VALIDATION_RULES.MAX_VALUE, value: 5000 }
        ]
    },

    // User profile
    USER_PROFILE: {
        name: [
            { type: VALIDATION_RULES.MIN_LENGTH, value: 2 },
            { type: VALIDATION_RULES.MAX_LENGTH, value: 50 }
        ],
        age: [
            { type: VALIDATION_RULES.INTEGER },
            { type: VALIDATION_RULES.MIN_VALUE, value: 13 },
            { type: VALIDATION_RULES.MAX_VALUE, value: 120 }
        ],
        height: [
            { type: VALIDATION_RULES.NUMBER },
            { type: VALIDATION_RULES.MIN_VALUE, value: 50 },
            { type: VALIDATION_RULES.MAX_VALUE, value: 300 }
        ],
        weight: [
            { type: VALIDATION_RULES.NUMBER },
            { type: VALIDATION_RULES.MIN_VALUE, value: 20 },
            { type: VALIDATION_RULES.MAX_VALUE, value: 500 }
        ],
        activityLevel: [
            {
                type: VALIDATION_RULES.CUSTOM,
                validator: (value) => {
                    const validLevels = ['sedentary', 'light', 'moderate', 'active', 'very_active'];
                    if (!validLevels.includes(value)) {
                        return 'Invalid activity level';
                    }
                    return null;
                }
            }
        ],
        goal: [
            {
                type: VALIDATION_RULES.CUSTOM,
                validator: (value) => {
                    const validGoals = ['lose', 'maintain', 'gain'];
                    if (!validGoals.includes(value)) {
                        return 'Invalid goal';
                    }
                    return null;
                }
            }
        ]
    }
};

/**
 * Convenience validation functions
 */
export const validateSignUp = (data) => validateObject(data, VALIDATION_SCHEMAS.SIGN_UP);
export const validateSignIn = (data) => validateObject(data, VALIDATION_SCHEMAS.SIGN_IN);
export const validateFoodItem = (data) => validateObject(data, VALIDATION_SCHEMAS.FOOD_ITEM);
export const validateMealEntry = (data) => validateObject(data, VALIDATION_SCHEMAS.MEAL_ENTRY);
export const validateWaterEntry = (data) => validateObject(data, VALIDATION_SCHEMAS.WATER_ENTRY);
export const validateUserProfile = (data) => validateObject(data, VALIDATION_SCHEMAS.USER_PROFILE);

/**
 * Create validation error for invalid data
 */
export const throwValidationError = (validationResult) => {
    if (!validationResult.isValid) {
        throw createValidationError(
            `Validation failed: ${validationResult.errorMessages.join(', ')}`,
            new Error(JSON.stringify(validationResult.errors))
        );
    }
};

export default {
    VALIDATION_RULES,
    VALIDATION_PATTERNS,
    VALIDATION_SCHEMAS,
    sanitizeString,
    sanitizeNumber,
    sanitizeEmail,
    validateField,
    validateObject,
    validateSignUp,
    validateSignIn,
    validateFoodItem,
    validateMealEntry,
    validateWaterEntry,
    validateUserProfile,
    throwValidationError
};