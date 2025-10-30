/**
 * Simple Utility Test
 * Basic test to verify Jest setup works
 */

describe('Jest Setup Test', () => {
    test('should run basic JavaScript test', () => {
        const add = (a, b) => a + b;
        expect(add(2, 3)).toBe(5);
    });

    test('should handle async operations', async () => {
        const asyncFunction = () => Promise.resolve('success');
        const result = await asyncFunction();
        expect(result).toBe('success');
    });

    test('should mock functions', () => {
        const mockFn = jest.fn();
        mockFn('test');
        expect(mockFn).toHaveBeenCalledWith('test');
    });
});