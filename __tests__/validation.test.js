/**
 * Validation Tests
 * Test input validation and sanitization
 */

import {
    sanitizeEmail,
    sanitizeNumber,
    sanitizeString,
    validateField,
    validateFoodItem,
    validateMealEntry,
    validateObject,
    validateSignIn,
    validateSignUp,
    VALIDATION_RULES,
    VALIDATION_SCHEMAS
} from '../utils/validation';

describe('Validation Utils', () => {
    describe('Field Validation', () => {
        test('should validate required fields', () => {
            const rules = [{ type: VALIDATION_RULES.REQUIRED }];

            expect(validateField('', rules)).toContain('Field is required');
            expect(validateField(null, rules)).toContain('Field is required');
            expect(validateField(undefined, rules)).toContain('Field is required');
            expect(validateField('valid', rules)).toEqual([]);
        });

        test('should validate minimum length', () => {
            const rules = [{ type: VALIDATION_RULES.MIN_LENGTH, value: 3 }];

            expect(validateField('ab', rules)).toContain('must be at least 3 characters');
            expect(validateField('abc', rules)).toEqual([]);
            expect(validateField('abcd', rules)).toEqual([]);
        });

        test('should validate maximum length', () => {
            const rules = [{ type: VALIDATION_RULES.MAX_LENGTH, value: 5 }];

            expect(validateField('abcdef', rules)).toContain('must be no more than 5 characters');
            expect(validateField('abcde', rules)).toEqual([]);
            expect(validateField('abcd', rules)).toEqual([]);
        });

        test('should validate email format', () => {
            const rules = [{ type: VALIDATION_RULES.EMAIL }];

            expect(validateField('invalid-email', rules)).toContain('not a valid email');
            expect(validateField('test@example.com', rules)).toEqual([]);
            expect(validateField('user.name+tag@domain.co.uk', rules)).toEqual([]);
        });

        test('should validate password requirements', () => {
            const rules = [{ type: VALIDATION_RULES.PASSWORD }];

            expect(validateField('weak', rules)).toContain('must be at least 8 characters');
            expect(validateField('weakpassword', rules)).toContain('must contain uppercase, lowercase, number, and special character');
            expect(validateField('StrongPass123!', rules)).toEqual([]);
        });

        test('should validate numeric fields', () => {
            const rules = [{ type: VALIDATION_RULES.NUMBER }];

            expect(validateField('not-a-number', rules)).toContain('must be a valid number');
            expect(validateField('123.45', rules)).toEqual([]);
            expect(validateField('0', rules)).toEqual([]);
        });

        test('should validate positive numbers', () => {
            const rules = [{ type: VALIDATION_RULES.POSITIVE }];

            expect(validateField('-5', rules)).toContain('must be a positive number');
            expect(validateField('0', rules)).toContain('must be a positive number');
            expect(validateField('5', rules)).toEqual([]);
        });

        test('should validate custom rules', () => {
            const rules = [{
                type: VALIDATION_RULES.CUSTOM,
                validator: (value) => {
                    if (value !== 'expected') {
                        return 'Value must be "expected"';
                    }
                    return null;
                }
            }];

            expect(validateField('wrong', rules)).toContain('Value must be "expected"');
            expect(validateField('expected', rules)).toEqual([]);
        });
    });

    describe('Object Validation', () => {
        test('should validate complete objects', () => {
            const schema = {
                email: [{ type: VALIDATION_RULES.REQUIRED }, { type: VALIDATION_RULES.EMAIL }],
                age: [{ type: VALIDATION_RULES.NUMBER }, { type: VALIDATION_RULES.MIN_VALUE, value: 18 }]
            };

            const invalidData = { email: 'invalid', age: '15' };
            const result = validateObject(invalidData, schema);

            expect(result.isValid).toBe(false);
            expect(result.errors.email).toBeDefined();
            expect(result.errors.age).toBeDefined();
        });

        test('should return valid for correct data', () => {
            const schema = {
                email: [{ type: VALIDATION_RULES.EMAIL }],
                age: [{ type: VALIDATION_RULES.NUMBER }]
            };

            const validData = { email: 'test@example.com', age: '25' };
            const result = validateObject(validData, schema);

            expect(result.isValid).toBe(true);
            expect(result.errors).toEqual({});
        });
    });

    describe('Predefined Schemas', () => {
        test('should validate sign up data', () => {
            const validSignUp = {
                email: 'test@example.com',
                password: 'StrongPass123!',
                confirmPassword: 'StrongPass123!'
            };

            const result = validateSignUp(validSignUp);
            expect(result.isValid).toBe(true);
        });

        test('should validate sign in data', () => {
            const validSignIn = {
                email: 'test@example.com',
                password: 'password123'
            };

            const result = validateSignIn(validSignIn);
            expect(result.isValid).toBe(true);
        });

        test('should validate food item data', () => {
            const validFood = {
                name: 'Apple',
                calories: 95,
                protein: 0.5,
                carbs: 25,
                fat: 0.3
            };

            const result = validateFoodItem(validFood);
            expect(result.isValid).toBe(true);
        });

        test('should validate meal entry data', () => {
            const validMeal = {
                foodId: 'food-123',
                quantity: 2,
                mealType: 'breakfast'
            };

            const result = validateMealEntry(validMeal);
            expect(result.isValid).toBe(true);
        });

        test('should reject invalid meal types', () => {
            const invalidMeal = {
                foodId: 'food-123',
                quantity: 1,
                mealType: 'invalid-meal-type'
            };

            const result = validateMealEntry(invalidMeal);
            expect(result.isValid).toBe(false);
            expect(result.errors.mealType).toBeDefined();
        });
    });

    describe('Sanitization', () => {
        test('should sanitize strings', () => {
            expect(sanitizeString('  hello world  ')).toBe('hello world');
            expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
            expect(sanitizeString('test"quotes\'here')).toBe('testquoteshere');
            expect(sanitizeString('control\x00chars\x1f')).toBe('controlchars');
        });

        test('should sanitize numbers', () => {
            expect(sanitizeNumber('123.45')).toBe(123.45);
            expect(sanitizeNumber('abc123def')).toBe(123);
            expect(sanitizeNumber('not-a-number')).toBe(null);
            expect(sanitizeNumber('')).toBe(null);
        });

        test('should apply number constraints', () => {
            const options = { min: 10, max: 100 };

            expect(sanitizeNumber('5', options)).toBe(10);
            expect(sanitizeNumber('150', options)).toBe(100);
            expect(sanitizeNumber('50', options)).toBe(50);
        });

        test('should sanitize emails', () => {
            expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
            expect(sanitizeEmail('User@Domain.Com')).toBe('user@domain.com');
        });

        test('should handle invalid input types', () => {
            expect(sanitizeString(123)).toBe('');
            expect(sanitizeString(null)).toBe('');
            expect(sanitizeEmail(123)).toBe('');
        });
    });

    describe('Complex Validation Scenarios', () => {
        test('should validate password confirmation', () => {
            const data = {
                password: 'StrongPass123!',
                confirmPassword: 'DifferentPass123!'
            };

            const result = validateSignUp({ ...data, email: 'test@example.com' });
            expect(result.isValid).toBe(false);
            expect(result.errorMessages).toContain('Passwords do not match');
        });

        test('should validate food item ranges', () => {
            const invalidFood = {
                name: 'Test Food',
                calories: -50, // Invalid: negative
                protein: 1500, // Invalid: too high
                carbs: 25,
                fat: 15
            };

            const result = validateFoodItem(invalidFood);
            expect(result.isValid).toBe(false);
        });

        test('should validate activity levels', () => {
            const validProfile = {
                name: 'Test User',
                age: 30,
                height: 175,
                weight: 70,
                activityLevel: 'moderate',
                goal: 'maintain'
            };

            const invalidProfile = {
                ...validProfile,
                activityLevel: 'invalid-level'
            };

            const validResult = validateObject(validProfile, VALIDATION_SCHEMAS.USER_PROFILE);
            const invalidResult = validateObject(invalidProfile, VALIDATION_SCHEMAS.USER_PROFILE);

            expect(validResult.isValid).toBe(true);
            expect(invalidResult.isValid).toBe(false);
        });
    });
});