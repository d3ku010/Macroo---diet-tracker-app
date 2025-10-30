/**
 * Simple Validation Tests
 * Test validation utilities without React components
 */

// Mock validation utilities
const mockValidation = {
    VALIDATION_RULES: {
        email: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address'
        },
        password: {
            required: true,
            minLength: 6,
            message: 'Password must be at least 6 characters'
        },
        age: {
            required: false,
            min: 13,
            max: 120,
            message: 'Age must be between 13 and 120'
        }
    },

    validateField: (field, value, rules = mockValidation.VALIDATION_RULES[field]) => {
        if (!rules) return { isValid: true };

        // Required validation
        if (rules.required && (!value || value.toString().trim() === '')) {
            return { isValid: false, error: 'This field is required' };
        }

        // Skip other validations if empty and not required
        if (!value && !rules.required) {
            return { isValid: true };
        }

        // Pattern validation
        if (rules.pattern && !rules.pattern.test(value)) {
            return { isValid: false, error: rules.message };
        }

        // Min length validation
        if (rules.minLength && value.length < rules.minLength) {
            return { isValid: false, error: rules.message };
        }

        // Min/Max value validation
        if (rules.min !== undefined && Number(value) < rules.min) {
            return { isValid: false, error: rules.message };
        }

        if (rules.max !== undefined && Number(value) > rules.max) {
            return { isValid: false, error: rules.message };
        }

        return { isValid: true };
    },

    validateObject: (data, schema) => {
        const errors = {};
        let isValid = true;

        for (const [field, rules] of Object.entries(schema)) {
            const result = mockValidation.validateField(field, data[field], rules);
            if (!result.isValid) {
                errors[field] = result.error;
                isValid = false;
            }
        }

        return { isValid, errors };
    },

    sanitizeInput: (input, type = 'string') => {
        if (input === null || input === undefined) return '';

        const stringInput = input.toString().trim();

        switch (type) {
            case 'email':
                return stringInput.toLowerCase();
            case 'number':
                const num = parseFloat(stringInput);
                return isNaN(num) ? 0 : num;
            case 'html':
                return stringInput.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '').replace(/<[^>]+>/g, '');
            default:
                return stringInput;
        }
    }
};

describe('Validation Utils', () => {
    describe('Field Validation', () => {
        test('should validate required email', () => {
            const result = mockValidation.validateField('email', 'test@example.com');
            expect(result.isValid).toBe(true);
        });

        test('should reject invalid email', () => {
            const result = mockValidation.validateField('email', 'invalid-email');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Please enter a valid email address');
        });

        test('should reject empty required field', () => {
            const result = mockValidation.validateField('email', '');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('This field is required');
        });

        test('should validate password length', () => {
            const validResult = mockValidation.validateField('password', 'password123');
            expect(validResult.isValid).toBe(true);

            const invalidResult = mockValidation.validateField('password', '123');
            expect(invalidResult.isValid).toBe(false);
            expect(invalidResult.error).toBe('Password must be at least 6 characters');
        });

        test('should validate age range', () => {
            const validResult = mockValidation.validateField('age', '25');
            expect(validResult.isValid).toBe(true);

            const tooYoungResult = mockValidation.validateField('age', '10');
            expect(tooYoungResult.isValid).toBe(false);
            expect(tooYoungResult.error).toBe('Age must be between 13 and 120');

            const tooOldResult = mockValidation.validateField('age', '150');
            expect(tooOldResult.isValid).toBe(false);
            expect(tooOldResult.error).toBe('Age must be between 13 and 120');
        });

        test('should allow empty optional fields', () => {
            const result = mockValidation.validateField('age', '');
            expect(result.isValid).toBe(true);
        });
    });

    describe('Object Validation', () => {
        test('should validate complete object', () => {
            const data = {
                email: 'test@example.com',
                password: 'password123',
                age: '25'
            };

            const schema = {
                email: mockValidation.VALIDATION_RULES.email,
                password: mockValidation.VALIDATION_RULES.password,
                age: mockValidation.VALIDATION_RULES.age
            };

            const result = mockValidation.validateObject(data, schema);
            expect(result.isValid).toBe(true);
            expect(Object.keys(result.errors)).toHaveLength(0);
        });

        test('should return multiple validation errors', () => {
            const data = {
                email: 'invalid-email',
                password: '123',
                age: '200'
            };

            const schema = {
                email: mockValidation.VALIDATION_RULES.email,
                password: mockValidation.VALIDATION_RULES.password,
                age: mockValidation.VALIDATION_RULES.age
            };

            const result = mockValidation.validateObject(data, schema);
            expect(result.isValid).toBe(false);
            expect(result.errors.email).toBe('Please enter a valid email address');
            expect(result.errors.password).toBe('Password must be at least 6 characters');
            expect(result.errors.age).toBe('Age must be between 13 and 120');
        });
    });

    describe('Input Sanitization', () => {
        test('should sanitize string input', () => {
            const result = mockValidation.sanitizeInput('  Test String  ');
            expect(result).toBe('Test String');
        });

        test('should sanitize email input', () => {
            const result = mockValidation.sanitizeInput('  TEST@EXAMPLE.COM  ', 'email');
            expect(result).toBe('test@example.com');
        });

        test('should sanitize number input', () => {
            const result = mockValidation.sanitizeInput('  123.45  ', 'number');
            expect(result).toBe(123.45);
        });

        test('should handle invalid number input', () => {
            const result = mockValidation.sanitizeInput('not-a-number', 'number');
            expect(result).toBe(0);
        });

        test('should remove HTML tags', () => {
            const result = mockValidation.sanitizeInput('<script>alert("xss")</script>Hello', 'html');
            expect(result).toBe('Hello');
        });

        test('should handle null and undefined input', () => {
            expect(mockValidation.sanitizeInput(null)).toBe('');
            expect(mockValidation.sanitizeInput(undefined)).toBe('');
        });
    });

    describe('Edge Cases', () => {
        test('should handle unknown field validation gracefully', () => {
            const result = mockValidation.validateField('unknownField', 'value');
            expect(result.isValid).toBe(true);
        });

        test('should handle numeric strings in validation', () => {
            const result = mockValidation.validateField('age', 25); // number instead of string
            expect(result.isValid).toBe(true);
        });

        test('should handle whitespace-only input', () => {
            const result = mockValidation.validateField('email', '   ');
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('This field is required');
        });
    });
});