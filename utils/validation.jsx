// Input validation utilities with user-friendly error messages
import { toast } from './toast';

// Validation rules
export const ValidationRules = {
    required: (value, fieldName = 'Field') => {
        if (value === null || value === undefined || value === '') {
            return `${fieldName} is required`;
        }
        return null;
    },

    number: (value, fieldName = 'Field') => {
        const num = Number(value);
        if (isNaN(num)) {
            return `${fieldName} must be a valid number`;
        }
        return null;
    },

    positiveNumber: (value, fieldName = 'Field') => {
        const num = Number(value);
        if (isNaN(num) || num <= 0) {
            return `${fieldName} must be a positive number`;
        }
        return null;
    },

    range: (value, min, max, fieldName = 'Field') => {
        const num = Number(value);
        if (isNaN(num)) {
            return `${fieldName} must be a valid number`;
        }
        if (num < min || num > max) {
            return `${fieldName} must be between ${min} and ${max}`;
        }
        return null;
    },

    email: (value, fieldName = 'Email') => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return `${fieldName} must be a valid email address`;
        }
        return null;
    },

    date: (value, fieldName = 'Date') => {
        const date = new Date(value);
        if (isNaN(date.getTime())) {
            return `${fieldName} must be a valid date`;
        }
        return null;
    },

    length: (value, minLength, maxLength, fieldName = 'Field') => {
        const str = String(value || '');
        if (str.length < minLength) {
            return `${fieldName} must be at least ${minLength} characters`;
        }
        if (str.length > maxLength) {
            return `${fieldName} cannot exceed ${maxLength} characters`;
        }
        return null;
    }
};

// Validate single field
export function validateField(value, rules, fieldName = 'Field') {
    for (const rule of rules) {
        const error = rule(value, fieldName);
        if (error) {
            return error;
        }
    }
    return null;
}

// Validate multiple fields
export function validateFields(data, schema) {
    const errors = {};
    let hasErrors = false;

    for (const [fieldName, rules] of Object.entries(schema)) {
        const value = data[fieldName];
        const error = validateField(value, rules, fieldName);
        if (error) {
            errors[fieldName] = error;
            hasErrors = true;
        }
    }

    return hasErrors ? errors : null;
}

// Validate and show toast for first error
export function validateAndShowError(data, schema) {
    const errors = validateFields(data, schema);
    if (errors) {
        const firstError = Object.values(errors)[0];
        toast(firstError, 'error');
        return false;
    }
    return true;
}

// Common validation schemas
export const CommonSchemas = {
    waterEntry: {
        amount: [
            ValidationRules.required,
            (value) => ValidationRules.range(value, 1, 5000, 'Water amount (ml)')
        ]
    },

    mealEntry: {
        food: [
            ValidationRules.required,
            (value) => ValidationRules.length(value, 1, 100, 'Food name')
        ],
        quantity: [
            ValidationRules.required,
            (value) => ValidationRules.range(value, 0.1, 10000, 'Quantity (g)')
        ]
    },

    profile: {
        height: [
            (value) => value ? ValidationRules.range(value, 50, 300, 'Height (cm)') : null
        ],
        weight: [
            (value) => value ? ValidationRules.range(value, 20, 500, 'Weight (kg)') : null
        ],
        age: [
            (value) => value ? ValidationRules.range(value, 1, 150, 'Age') : null
        ]
    }
};

// Sanitize user input
export function sanitizeInput(value, type = 'string') {
    if (value === null || value === undefined) {
        return type === 'number' ? 0 : '';
    }

    switch (type) {
        case 'number':
            const num = Number(value);
            return isNaN(num) ? 0 : num;

        case 'string':
            return String(value).trim();

        case 'email':
            return String(value).toLowerCase().trim();

        case 'date':
            const date = new Date(value);
            return isNaN(date.getTime()) ? new Date() : date;

        default:
            return value;
    }
}

// Safe parsing utilities
export const SafeParsers = {
    int: (value, defaultValue = 0) => {
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? defaultValue : parsed;
    },

    float: (value, defaultValue = 0) => {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? defaultValue : parsed;
    },

    date: (value, defaultValue = null) => {
        const date = new Date(value);
        return isNaN(date.getTime()) ? defaultValue : date;
    },

    json: (value, defaultValue = {}) => {
        try {
            return JSON.parse(value);
        } catch {
            return defaultValue;
        }
    }
};

export default {
    ValidationRules,
    validateField,
    validateFields,
    validateAndShowError,
    CommonSchemas,
    sanitizeInput,
    SafeParsers
};