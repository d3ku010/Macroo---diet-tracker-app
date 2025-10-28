# Error Handling and Exception Management Documentation

## Overview

This diet tracking app now implements a comprehensive, multi-layered error handling and exception management system designed to provide robust error recovery, user-friendly messaging, and detailed logging for debugging.

## Architecture

### 1. Error Boundary Components

#### `ErrorBoundary.jsx`
- **Purpose**: Catches and handles React component errors gracefully
- **Features**:
  - Automatic error classification and logging
  - User-friendly error UI with retry functionality
  - Development vs production error display modes
  - Unique error ID generation for tracking
  - Structured error logging with context

#### `ComponentErrorBoundary.jsx`
- **Purpose**: Lightweight error boundary for individual components
- **Features**:
  - Component-specific error handling
  - Minimal UI disruption
  - Quick retry functionality
  - Development error details

### 2. Global Error Handling

#### `globalErrorHandler.jsx`
- **Purpose**: Handles uncaught errors and unhandled promise rejections
- **Features**:
  - Window error event handling
  - Unhandled promise rejection catching
  - React Native global error handler integration
  - Critical error reporting system

### 3. Enhanced Supabase Operations

#### `errorHandling.jsx`
- **Purpose**: Comprehensive wrapper for database and API operations
- **Features**:
  - Automatic error classification (Network, Auth, Permission, Server, etc.)
  - User-friendly error messages
  - Timeout protection with configurable timeouts
  - Exponential backoff retry logic
  - Fallback value support
  - Result validation
  - Structured error logging

### 4. Input Validation System

#### `validation.jsx`
- **Purpose**: Input validation with user-friendly error messages
- **Features**:
  - Reusable validation rules
  - Field and form validation
  - Common validation schemas
  - Input sanitization utilities
  - Safe parsing functions

## Implementation Details

### Error Classifications

```javascript
const ERROR_TYPES = {
    NETWORK: 'NETWORK_ERROR',        // Connection issues
    AUTH: 'AUTH_ERROR',              // Authentication failures
    PERMISSION: 'PERMISSION_ERROR',   // Authorization issues
    VALIDATION: 'VALIDATION_ERROR',   // Input validation errors
    SERVER: 'SERVER_ERROR',          // Server-side errors
    TIMEOUT: 'TIMEOUT_ERROR',        // Request timeouts
    UNKNOWN: 'UNKNOWN_ERROR'         // Unclassified errors
};
```

### User-Friendly Messages

Each error type has corresponding user-friendly messages:
- **Network**: "Network connection failed. Please check your internet connection."
- **Timeout**: "Request timed out. Please try again."
- **Validation**: "Invalid data provided. Please check your input."
- **Server**: "Server error occurred. Please try again later."

### Retry Logic

Operations support configurable retry with exponential backoff:
```javascript
await withErrorHandling(operation, 'Context', {
    timeout: 10000,     // 10 second timeout
    retries: 2,         // Retry twice
    showToast: true,    // Show user notifications
    fallbackValue: []   // Return empty array on failure
});
```

### Error Logging

All errors are logged with structured data:
```javascript
{
    timestamp: '2025-01-01T12:00:00.000Z',
    context: 'Loading meals',
    error: {
        message: 'Network request failed',
        stack: '...',
        code: 'ERR_NETWORK'
    },
    additionalData: {
        attempt: 1,
        maxAttempts: 3
    },
    userAgent: 'Mozilla/5.0...',
    url: 'http://localhost:8082'
}
```

## Usage Examples

### 1. Wrapping Components with Error Boundaries

```jsx
<ComponentErrorBoundary componentName="CalorieRingCard">
    <CalorieRingCard {...props} />
</ComponentErrorBoundary>
```

### 2. Enhanced Database Operations

```jsx
// Data fetching with fallback
const meals = await withDataFetching(
    () => getMeals(today),
    'Loading meals',
    [] // fallback to empty array
);

// Data mutations with success message
await withDataMutation(
    () => deleteMeal(mealId),
    'Deleting meal',
    'Meal deleted successfully'
);
```

### 3. Input Validation

```jsx
// Validate water entry
if (!validateAndShowError({ amount }, CommonSchemas.waterEntry)) {
    return; // Stop execution if validation fails
}
```

### 4. Component Prop Validation

```jsx
// In component
const safeCalories = Math.max(0, Number(calories) || 0);
const safeTarget = Math.max(1, Number(target) || 2000);
const clampedCalories = Math.min(safeCalories, 20000);
```

## Error Recovery Strategies

### 1. Graceful Degradation
- Components continue functioning with default values
- Non-critical features fail silently with logging
- Core functionality remains available

### 2. Automatic Retry
- Network operations retry with exponential backoff
- User can manually retry failed operations
- Critical operations have higher retry counts

### 3. Fallback Values
- Data fetching operations return safe defaults
- Components display placeholder content
- App remains functional even with data loading failures

### 4. User Communication
- Clear, actionable error messages
- Progress indicators for retry operations
- Success confirmations for completed actions

## Monitoring and Debugging

### Development Mode
- Detailed error information displayed
- Full stack traces available
- Console logging for all errors
- Error boundary shows component details

### Production Mode
- User-friendly error messages only
- Structured error logging to external service
- Critical error alerting
- Performance impact minimized

## Integration Points

### Root Level (_layout.jsx)
```jsx
<ErrorBoundary showDetails={__DEV__}>
    <AppInitializer>
        {/* App content */}
    </AppInitializer>
</ErrorBoundary>
```

### Component Level (index.jsx)
```jsx
<ComponentErrorBoundary componentName="ModernComponent">
    <ModernComponent {...props} />
</ComponentErrorBoundary>
```

### Operation Level
```jsx
const result = await withErrorHandling(() => {
    // Your operation here
}, 'Operation Context');
```

## Best Practices

### 1. Error Context
- Always provide meaningful context for operations
- Include relevant data in error logs
- Use descriptive error messages

### 2. User Experience
- Show loading states during operations
- Provide clear recovery options
- Avoid technical jargon in user messages

### 3. Performance
- Use appropriate timeout values
- Limit retry attempts for non-critical operations
- Implement exponential backoff for retries

### 4. Monitoring
- Log all errors with sufficient context
- Monitor error rates and patterns
- Set up alerts for critical errors

## Future Enhancements

1. **Error Analytics**: Integration with error tracking services (Sentry, Bugsnag)
2. **Offline Support**: Enhanced error handling for offline scenarios
3. **Progressive Error Recovery**: Smart retry strategies based on error patterns
4. **User Feedback**: Error reporting system for users to provide context
5. **Performance Monitoring**: Integration with performance monitoring tools

This comprehensive error handling system ensures the app remains stable, user-friendly, and maintainable while providing developers with the tools needed to quickly identify and resolve issues.