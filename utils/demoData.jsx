// Demo data generator for testing MyFitnessPal-inspired features

export const generateDemoData = async () => {
    try {
        console.log('🚀 Generating demo data for Phase 1 testing...');

        // Enhanced food database with variety of sources
        const demoFoods = [
            // Local database foods
            {
                id: 'apple-001',
                name: 'Apple, Red Delicious',
                brand: 'Fresh Produce',
                calories: 95,
                protein: 0.5,
                carbs: 25,
                fat: 0.3,
                fiber: 4,
                sugar: 19,
                sodium: 2,
                source: 'Local',
                category: 'Fruits'
            },
            {
                id: 'chicken-001',
                name: 'Chicken Breast, Grilled',
                brand: 'Fresh Meat',
                calories: 231,
                protein: 43.5,
                carbs: 0,
                fat: 5,
                fiber: 0,
                sugar: 0,
                sodium: 104,
                source: 'Local',
                category: 'Protein'
            },
            {
                id: 'rice-001',
                name: 'White Rice, Cooked',
                brand: 'Staple Food',
                calories: 130,
                protein: 2.7,
                carbs: 28,
                fat: 0.3,
                fiber: 0.4,
                sugar: 0.1,
                sodium: 1,
                source: 'Local',
                category: 'Grains'
            },
            // Branded foods (simulating external API results)
            {
                id: 'quaker-oats-001',
                name: 'Old Fashioned Oats',
                brand: 'Quaker',
                calories: 150,
                protein: 5,
                carbs: 27,
                fat: 3,
                fiber: 4,
                sugar: 1,
                sodium: 0,
                source: 'External',
                category: 'Breakfast'
            },
            {
                id: 'greek-yogurt-001',
                name: 'Greek Yogurt, Plain',
                brand: 'Chobani',
                calories: 100,
                protein: 18,
                carbs: 6,
                fat: 0,
                fiber: 0,
                sugar: 4,
                sodium: 60,
                source: 'External',
                category: 'Dairy'
            },
            {
                id: 'salmon-001',
                name: 'Atlantic Salmon, Baked',
                brand: 'Wild Caught',
                calories: 206,
                protein: 22,
                carbs: 0,
                fat: 12,
                fiber: 0,
                sugar: 0,
                sodium: 59,
                source: 'Local',
                category: 'Protein'
            },
            {
                id: 'avocado-001',
                name: 'Avocado, Raw',
                brand: 'Organic',
                calories: 234,
                protein: 2.9,
                carbs: 12,
                fat: 21,
                fiber: 10,
                sugar: 1,
                sodium: 10,
                source: 'Local',
                category: 'Healthy Fats'
            },
            {
                id: 'spinach-001',
                name: 'Baby Spinach, Fresh',
                brand: 'Organic Greens',
                calories: 23,
                protein: 2.9,
                carbs: 3.6,
                fat: 0.4,
                fiber: 2.2,
                sugar: 0.4,
                sodium: 79,
                source: 'Local',
                category: 'Vegetables'
            }
        ];

        // Save enhanced food database
        for (const food of demoFoods) {
            try {
                await saveFoodToDatabase(food);
            } catch (error) {
                console.warn('Error saving demo food:', food.name, error);
            }
        }

        // Note: Recent foods will be populated automatically as users add meals

        // Create some demo meals for today
        const today = new Date().toISOString().slice(0, 10);
        const demoMeals = [
            {
                id: 'meal-breakfast-001',
                timestamp: `${today}T07:30:00.000Z`,
                type: 'Breakfast',
                foods: [
                    {
                        food: 'Old Fashioned Oats',
                        brand: 'Quaker',
                        quantity: 50,
                        calories: 75,
                        protein: 2.5,
                        carbs: 13.5,
                        fat: 1.5
                    },
                    {
                        food: 'Greek Yogurt, Plain',
                        brand: 'Chobani',
                        quantity: 170,
                        calories: 170,
                        protein: 30.6,
                        carbs: 10.2,
                        fat: 0
                    }
                ],
                nutrients: {
                    calories: 245,
                    protein: 33.1,
                    carbs: 23.7,
                    fat: 1.5
                }
            },
            {
                id: 'meal-lunch-001',
                timestamp: `${today}T12:15:00.000Z`,
                type: 'Lunch',
                foods: [
                    {
                        food: 'Chicken Breast, Grilled',
                        brand: 'Fresh Meat',
                        quantity: 150,
                        calories: 346,
                        protein: 65.3,
                        carbs: 0,
                        fat: 7.5
                    },
                    {
                        food: 'White Rice, Cooked',
                        brand: 'Staple Food',
                        quantity: 150,
                        calories: 195,
                        protein: 4.1,
                        carbs: 42,
                        fat: 0.5
                    },
                    {
                        food: 'Baby Spinach, Fresh',
                        brand: 'Organic Greens',
                        quantity: 85,
                        calories: 20,
                        protein: 2.5,
                        carbs: 3.1,
                        fat: 0.3
                    }
                ],
                nutrients: {
                    calories: 561,
                    protein: 71.9,
                    carbs: 45.1,
                    fat: 8.3
                }
            }
        ];

        // Save demo meals
        for (const meal of demoMeals) {
            await saveMeal(meal);
        }

        console.log('✅ Demo data generated successfully!');
        console.log(`📊 Added ${demoFoods.length} foods to database`);
        console.log(`🍽️ Added ${demoMeals.length} meals for today`);
        console.log(`⭐ Added ${recentFoods.length} recent foods`);

        return {
            foods: demoFoods.length,
            meals: demoMeals.length,
            recentFoods: recentFoods.length
        };

    } catch (error) {
        console.error('❌ Failed to generate demo data:', error);
        throw error;
    }
};

// Quick test function for Phase 1 features
export const testPhase1Features = async () => {
    try {
        console.log('🧪 Testing Phase 1 MyFitnessPal-inspired features...');

        // Test enhanced food search
        const { searchFoodsEnhanced } = require('./storage');

        console.log('\n🔍 Testing Enhanced Food Search:');
        const chickenResults = await searchFoodsEnhanced('chicken', { limit: 5 });
        console.log(`Search "chicken": ${chickenResults.length} results`);
        chickenResults.forEach(food =>
            console.log(`  - ${food.name} (${food.source}) - ${food.calories} cal`)
        );

        const appleResults = await searchFoodsEnhanced('apple', { limit: 5 });
        console.log(`Search "apple": ${appleResults.length} results`);

        console.log('\n📈 Daily Nutrition Summary will show:');
        console.log('  - Total calories consumed today');
        console.log('  - Macro breakdown with progress bars');
        console.log('  - MyFitnessPal-style calorie equation');
        console.log('  - Visual progress indicators');

        console.log('\n✅ Phase 1 implementation test completed!');
        return true;

    } catch (error) {
        console.error('❌ Phase 1 test failed:', error);
        return false;
    }
};