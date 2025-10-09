// Export and backup functionality for user data
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Export user data function
const exportUserData = async () => {
    try {
        const [foods, meals, profile, waterEntries] = await Promise.all([
            getFoodDatabase(),
            getMeals(),
            getProfile(),
            getWaterEntries()
        ]);

        return {
            foods,
            meals,
            profile,
            waterEntries,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    } catch (error) {
        console.error('Error exporting user data:', error);
        throw error;
    }
};

// Import user data function (placeholder - full implementation would need data validation and migration logic)
const importUserData = async (importData) => {
    try {
        console.log('Import functionality not fully implemented for Supabase migration');
        console.log('Data structure:', Object.keys(importData.data || {}));

        // This would need careful implementation to:
        // 1. Validate data structure
        // 2. Handle data migration between versions
        // 3. Safely merge or replace existing data
        // 4. Handle conflicts and duplicates

        // For now, return false to indicate not implemented
        return false;
    } catch (error) {
        console.error('Error importing user data:', error);
        return false;
    }
};

// Export user data to JSON file
export const exportDataToFile = async () => {
    try {
        const userData = await exportUserData();
        if (!userData) {
            throw new Error('No data to export');
        }

        const fileName = `diet_tracker_backup_${new Date().toISOString().split('T')[0]}.json`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(userData, null, 2));

        // Check if sharing is available
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
                mimeType: 'application/json',
                dialogTitle: 'Export Diet Tracker Data',
            });
        } else {
            // Fallback: just save to device
            return {
                success: true,
                message: `Data exported to ${fileName}`,
                filePath: fileUri,
            };
        }

        return {
            success: true,
            message: 'Data exported successfully',
            filePath: fileUri,
        };
    } catch (error) {
        console.error('Export failed:', error);
        return {
            success: false,
            message: `Export failed: ${error.message}`,
        };
    }
};

// Import user data from JSON file
export const importDataFromFile = async () => {
    try {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'application/json',
            copyToCacheDirectory: true,
        });

        if (result.canceled) {
            return {
                success: false,
                message: 'Import cancelled',
            };
        }

        const fileContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
        const importData = JSON.parse(fileContent);

        // Validate import data structure
        if (!importData.data || !importData.version) {
            throw new Error('Invalid backup file format');
        }

        const success = await importUserData(importData);

        if (success) {
            return {
                success: true,
                message: 'Data imported successfully',
                dataCount: {
                    foods: importData.data.foods?.length || 0,
                    meals: importData.data.meals?.length || 0,
                    waterEntries: importData.data.waterEntries?.length || 0,
                    templates: importData.data.templates?.length || 0,
                },
            };
        } else {
            throw new Error('Failed to import data');
        }
    } catch (error) {
        console.error('Import failed:', error);
        return {
            success: false,
            message: `Import failed: ${error.message}`,
        };
    }
};

// Generate CSV export for meals data
export const exportMealsToCSV = async (dateRange = 30) => {
    try {
        const userData = await exportUserData();
        if (!userData?.data?.meals) {
            throw new Error('No meal data to export');
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - dateRange);

        const recentMeals = userData.data.meals.filter(meal =>
            new Date(meal.timestamp) >= cutoffDate
        );

        if (recentMeals.length === 0) {
            throw new Error('No recent meal data to export');
        }

        // Create CSV header
        const csvHeader = 'Date,Time,Meal Type,Food,Quantity (g),Calories,Protein (g),Carbs (g),Fat (g)\n';

        // Create CSV rows
        const csvRows = recentMeals.map(meal => {
            const date = new Date(meal.timestamp);
            const dateStr = date.toISOString().split('T')[0];
            const timeStr = date.toTimeString().split(' ')[0];

            return [
                dateStr,
                timeStr,
                meal.type || 'Unknown',
                `"${meal.food || 'Unknown'}"`, // Quotes to handle commas in food names
                meal.quantity || 0,
                (meal.nutrients?.calories || 0).toFixed(1),
                (meal.nutrients?.protein || 0).toFixed(1),
                (meal.nutrients?.carbs || 0).toFixed(1),
                (meal.nutrients?.fat || 0).toFixed(1),
            ].join(',');
        }).join('\n');

        const csvContent = csvHeader + csvRows;
        const fileName = `diet_tracker_meals_${new Date().toISOString().split('T')[0]}.csv`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(fileUri, csvContent);

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
                mimeType: 'text/csv',
                dialogTitle: 'Export Meals Data',
            });
        }

        return {
            success: true,
            message: `Exported ${recentMeals.length} meals to CSV`,
            filePath: fileUri,
        };
    } catch (error) {
        console.error('CSV export failed:', error);
        return {
            success: false,
            message: `CSV export failed: ${error.message}`,
        };
    }
};

// Generate nutrition summary report
export const exportNutritionSummary = async (days = 30) => {
    try {
        const userData = await exportUserData();
        if (!userData?.data?.meals) {
            throw new Error('No meal data available');
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const recentMeals = userData.data.meals.filter(meal =>
            new Date(meal.timestamp) >= cutoffDate
        );

        // Calculate daily averages
        const dailyTotals = {};
        recentMeals.forEach(meal => {
            const date = meal.timestamp.split('T')[0];
            if (!dailyTotals[date]) {
                dailyTotals[date] = { calories: 0, protein: 0, carbs: 0, fat: 0, mealCount: 0 };
            }

            dailyTotals[date].calories += meal.nutrients?.calories || 0;
            dailyTotals[date].protein += meal.nutrients?.protein || 0;
            dailyTotals[date].carbs += meal.nutrients?.carbs || 0;
            dailyTotals[date].fat += meal.nutrients?.fat || 0;
            dailyTotals[date].mealCount += 1;
        });

        const dailyValues = Object.values(dailyTotals);
        const dayCount = dailyValues.length;

        if (dayCount === 0) {
            throw new Error('No data available for summary');
        }

        const averages = {
            calories: dailyValues.reduce((sum, day) => sum + day.calories, 0) / dayCount,
            protein: dailyValues.reduce((sum, day) => sum + day.protein, 0) / dayCount,
            carbs: dailyValues.reduce((sum, day) => sum + day.carbs, 0) / dayCount,
            fat: dailyValues.reduce((sum, day) => sum + day.fat, 0) / dayCount,
            mealCount: dailyValues.reduce((sum, day) => sum + day.mealCount, 0) / dayCount,
        };

        const report = `
DIET TRACKER NUTRITION SUMMARY
Generated: ${new Date().toLocaleDateString()}
Period: Last ${days} days (${dayCount} days with data)

DAILY AVERAGES:
• Calories: ${averages.calories.toFixed(0)} kcal
• Protein: ${averages.protein.toFixed(1)} g (${((averages.protein * 4 / averages.calories) * 100).toFixed(1)}% of calories)
• Carbohydrates: ${averages.carbs.toFixed(1)} g (${((averages.carbs * 4 / averages.calories) * 100).toFixed(1)}% of calories)
• Fat: ${averages.fat.toFixed(1)} g (${((averages.fat * 9 / averages.calories) * 100).toFixed(1)}% of calories)
• Meals per day: ${averages.mealCount.toFixed(1)}

MACRO DISTRIBUTION:
${generateMacroChart(averages)}

TOP FOODS:
${generateTopFoodsList(recentMeals)}

TRENDS:
${generateTrends(dailyTotals)}
        `.trim();

        const fileName = `nutrition_summary_${new Date().toISOString().split('T')[0]}.txt`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(fileUri, report);

        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri, {
                mimeType: 'text/plain',
                dialogTitle: 'Share Nutrition Summary',
            });
        }

        return {
            success: true,
            message: 'Nutrition summary generated',
            filePath: fileUri,
            report,
        };
    } catch (error) {
        console.error('Summary generation failed:', error);
        return {
            success: false,
            message: `Summary generation failed: ${error.message}`,
        };
    }
};

// Helper function to generate ASCII macro chart
const generateMacroChart = (averages) => {
    const totalCals = averages.calories;
    const proteinCals = averages.protein * 4;
    const carbsCals = averages.carbs * 4;
    const fatCals = averages.fat * 9;

    const proteinPercent = (proteinCals / totalCals) * 100;
    const carbsPercent = (carbsCals / totalCals) * 100;
    const fatPercent = (fatCals / totalCals) * 100;

    const proteinBars = '█'.repeat(Math.round(proteinPercent / 5));
    const carbsBars = '█'.repeat(Math.round(carbsPercent / 5));
    const fatBars = '█'.repeat(Math.round(fatPercent / 5));

    return `
Protein ${proteinPercent.toFixed(1)}% ${proteinBars}
Carbs   ${carbsPercent.toFixed(1)}% ${carbsBars}
Fat     ${fatPercent.toFixed(1)}% ${fatBars}`;
};

// Helper function to generate top foods list
const generateTopFoodsList = (meals) => {
    const foodCounts = {};
    meals.forEach(meal => {
        foodCounts[meal.food] = (foodCounts[meal.food] || 0) + 1;
    });

    const sortedFoods = Object.entries(foodCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

    return sortedFoods.map(([food, count], index) =>
        `${index + 1}. ${food} (${count} times)`
    ).join('\n');
};

// Helper function to generate trends
const generateTrends = (dailyTotals) => {
    const dates = Object.keys(dailyTotals).sort();
    if (dates.length < 3) return 'Not enough data for trend analysis';

    const firstWeek = dates.slice(0, Math.min(7, dates.length));
    const lastWeek = dates.slice(-Math.min(7, dates.length));

    const firstWeekAvg = firstWeek.reduce((sum, date) => sum + dailyTotals[date].calories, 0) / firstWeek.length;
    const lastWeekAvg = lastWeek.reduce((sum, date) => sum + dailyTotals[date].calories, 0) / lastWeek.length;

    const trend = lastWeekAvg - firstWeekAvg;
    const trendDirection = trend > 50 ? 'increasing' : trend < -50 ? 'decreasing' : 'stable';

    return `Calorie intake is ${trendDirection} (${trend > 0 ? '+' : ''}${trend.toFixed(0)} kcal/day change)`;
};

// Quick backup to device storage
export const createQuickBackup = async () => {
    try {
        const userData = await exportUserData();
        const fileName = `quick_backup_${Date.now()}.json`;
        const fileUri = `${FileSystem.documentDirectory}${fileName}`;

        await FileSystem.writeAsStringAsync(fileUri, JSON.stringify(userData));

        return {
            success: true,
            message: 'Quick backup created',
            filePath: fileUri,
        };
    } catch (error) {
        console.error('Quick backup failed:', error);
        return {
            success: false,
            message: `Quick backup failed: ${error.message}`,
        };
    }
};