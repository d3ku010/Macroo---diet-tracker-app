/**
 * Health calculation utilities for diet tracking app
 */

/**
 * Calculate BMI (Body Mass Index)
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @returns {number} BMI value
 */
export const calculateBMI = (weight, height) => {
    if (!weight || !height || weight <= 0 || height <= 0) {
        return 0;
    }
    const heightInMeters = height / 100;
    return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
};

/**
 * Get BMI category based on BMI value
 * @param {number} bmi - BMI value
 * @returns {object} Category info with name, color, and description
 */
export const getBMICategory = (bmi) => {
    if (bmi < 18.5) {
        return {
            category: 'Underweight',
            color: '#3b82f6',
            description: 'Below normal weight',
            range: '< 18.5'
        };
    } else if (bmi < 25) {
        return {
            category: 'Normal',
            color: '#10b981',
            description: 'Normal weight range',
            range: '18.5 - 24.9'
        };
    } else if (bmi < 30) {
        return {
            category: 'Overweight',
            color: '#f59e0b',
            description: 'Above normal weight',
            range: '25.0 - 29.9'
        };
    } else {
        return {
            category: 'Obese',
            color: '#ef4444',
            description: 'Significantly above normal weight',
            range: '≥ 30.0'
        };
    }
};

/**
 * Calculate daily calorie needs using Mifflin-St Jeor Equation
 * @param {number} weight - Weight in kg
 * @param {number} height - Height in cm
 * @param {number} age - Age in years
 * @param {string} gender - 'male', 'female', or 'other'
 * @param {string} activityLevel - Activity level
 * @returns {number} Estimated daily calorie needs
 */
export const calculateDailyCalories = (weight, height, age, gender, activityLevel) => {
    if (!weight || !height || !age) {
        return 0;
    }

    // Basal Metabolic Rate (BMR) using Mifflin-St Jeor Equation
    let bmr;
    if (gender === 'male') {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
    } else if (gender === 'female') {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
    } else {
        // For 'other', use average of male and female
        const maleBmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
        const femaleBmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
        bmr = (maleBmr + femaleBmr) / 2;
    }

    // Activity multipliers
    const activityMultipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
    };

    const multiplier = activityMultipliers[activityLevel] || 1.55;
    return Math.round(bmr * multiplier);
};

/**
 * Calculate ideal weight range using BMI
 * @param {number} height - Height in cm
 * @returns {object} Min and max ideal weight
 */
export const calculateIdealWeightRange = (height) => {
    if (!height || height <= 0) {
        return { min: 0, max: 0 };
    }

    const heightInMeters = height / 100;
    const minWeight = Math.round(18.5 * heightInMeters * heightInMeters);
    const maxWeight = Math.round(24.9 * heightInMeters * heightInMeters);

    return { min: minWeight, max: maxWeight };
};

/**
 * Calculate water intake recommendation based on weight and activity
 * @param {number} weight - Weight in kg
 * @param {string} activityLevel - Activity level
 * @returns {number} Recommended water glasses per day
 */
export const calculateWaterIntake = (weight, activityLevel) => {
    if (!weight || weight <= 0) {
        return 8; // Default 8 glasses
    }

    // Base water intake: 35ml per kg of body weight
    let baseIntake = weight * 35; // ml per day

    // Activity level adjustments
    const activityAdjustments = {
        sedentary: 1.0,
        light: 1.1,
        moderate: 1.2,
        active: 1.3,
        very_active: 1.4
    };

    const multiplier = activityAdjustments[activityLevel] || 1.2;
    baseIntake *= multiplier;

    // Convert to glasses (assuming 250ml per glass)
    const glasses = Math.round(baseIntake / 250);

    // Ensure reasonable range (6-16 glasses)
    return Math.max(6, Math.min(16, glasses));
};

/**
 * Get health recommendations based on profile
 * @param {object} profile - User profile data
 * @returns {array} Array of health recommendations
 */
export const getHealthRecommendations = (profile) => {
    const recommendations = [];

    if (!profile.height || !profile.weight || !profile.age) {
        return recommendations;
    }

    const bmi = calculateBMI(profile.weight, profile.height);
    const bmiCategory = getBMICategory(bmi);
    const idealWeight = calculateIdealWeightRange(profile.height);
    const recommendedCalories = calculateDailyCalories(
        profile.weight,
        profile.height,
        profile.age,
        profile.gender,
        profile.activityLevel
    );
    const recommendedWater = calculateWaterIntake(profile.weight, profile.activityLevel);

    // BMI-based recommendations
    if (bmi < 18.5) {
        recommendations.push({
            type: 'weight',
            icon: 'trending-up',
            title: 'Weight Management',
            message: 'Consider gaining weight gradually through a balanced diet with adequate calories and protein.',
            priority: 'high'
        });
    } else if (bmi >= 30) {
        recommendations.push({
            type: 'weight',
            icon: 'trending-down',
            title: 'Weight Management',
            message: 'Consider losing weight gradually through a balanced diet and regular exercise.',
            priority: 'high'
        });
    }

    // Calorie recommendation
    if (Math.abs(profile.dailyCaloriesTarget - recommendedCalories) > 200) {
        recommendations.push({
            type: 'calories',
            icon: 'flame',
            title: 'Calorie Target',
            message: `Based on your profile, consider adjusting your calorie target to around ${recommendedCalories} calories per day.`,
            priority: 'medium'
        });
    }

    // Water intake recommendation
    if (Math.abs(profile.dailyWaterTarget - recommendedWater) > 2) {
        recommendations.push({
            type: 'water',
            icon: 'water',
            title: 'Hydration',
            message: `Based on your weight and activity level, consider drinking around ${recommendedWater} glasses of water per day.`,
            priority: 'medium'
        });
    }

    // Activity level recommendations
    if (profile.activityLevel === 'sedentary') {
        recommendations.push({
            type: 'activity',
            icon: 'walk',
            title: 'Physical Activity',
            message: 'Try to incorporate at least 150 minutes of moderate exercise per week for better health.',
            priority: 'medium'
        });
    }

    return recommendations;
};

/**
 * Format BMI display text
 * @param {number} bmi - BMI value
 * @returns {string} Formatted BMI text
 */
export const formatBMI = (bmi) => {
    if (!bmi || bmi === 0) {
        return 'N/A';
    }
    return `${bmi} BMI`;
};

/**
 * Get goal-adjusted calorie target
 * @param {number} baseCalories - Base calorie needs
 * @param {string} goal - Weight goal ('lose', 'maintain', 'gain')
 * @returns {number} Adjusted calorie target
 */
export const getGoalAdjustedCalories = (baseCalories, goal) => {
    if (!baseCalories) return 0;

    switch (goal) {
        case 'lose':
            return Math.round(baseCalories - 500); // 1 lb per week deficit
        case 'gain':
            return Math.round(baseCalories + 300); // Gradual weight gain
        case 'maintain':
        default:
            return baseCalories;
    }
};