// Alternative food database strategies to replace EDAMAM API
// Since EDAMAM is now paid, here are free/affordable alternatives

const FoodDatabaseSources = {
    // 1. USDA FoodData Central (Free Government API)
    USDA_API: {
        baseUrl: 'https://api.nal.usda.gov/fdc/v1',
        apiKey: 'YOUR_USDA_API_KEY', // Free registration required

        searchFoods: async (query, pageSize = 25) => {
            try {
                const response = await fetch(`${FoodDatabaseSources.USDA_API.baseUrl}/foods/search?query=${encodeURIComponent(query)}&pageSize=${pageSize}&api_key=${FoodDatabaseSources.USDA_API.apiKey}`);
                const data = await response.json();

                return data.foods?.map(food => ({
                    id: food.fdcId,
                    name: food.description,
                    brand: food.brandOwner || food.brandName,
                    calories: food.foodNutrients?.find(n => n.nutrientId === 1008)?.value || 0,
                    protein: food.foodNutrients?.find(n => n.nutrientId === 1003)?.value || 0,
                    carbs: food.foodNutrients?.find(n => n.nutrientId === 1005)?.value || 0,
                    fat: food.foodNutrients?.find(n => n.nutrientId === 1004)?.value || 0,
                    fiber: food.foodNutrients?.find(n => n.nutrientId === 1079)?.value || 0,
                    sugar: food.foodNutrients?.find(n => n.nutrientId === 2000)?.value || 0,
                    sodium: food.foodNutrients?.find(n => n.nutrientId === 1093)?.value || 0,
                    source: 'USDA'
                })) || [];
            } catch (error) {
                console.error('USDA API search failed:', error);
                return [];
            }
        }
    },

    // 2. Open Food Facts (Free Community Database)
    OPEN_FOOD_FACTS: {
        baseUrl: 'https://world.openfoodfacts.org',

        searchFoods: async (query, pageSize = 25) => {
            try {
                const response = await fetch(`${FoodDatabaseSources.OPEN_FOOD_FACTS.baseUrl}/cgi/search.pl?search_terms=${encodeURIComponent(query)}&page_size=${pageSize}&json=1`);
                const data = await response.json();

                return data.products?.map(product => ({
                    id: product.code,
                    name: product.product_name || product.product_name_en,
                    brand: product.brands,
                    calories: product.nutriments?.['energy-kcal_100g'] || 0,
                    protein: product.nutriments?.proteins_100g || 0,
                    carbs: product.nutriments?.carbohydrates_100g || 0,
                    fat: product.nutriments?.fat_100g || 0,
                    fiber: product.nutriments?.fiber_100g || 0,
                    sugar: product.nutriments?.sugars_100g || 0,
                    sodium: product.nutriments?.sodium_100g || 0,
                    image: product.image_url,
                    barcode: product.code,
                    source: 'OpenFoodFacts'
                })).filter(food => food.name) || [];
            } catch (error) {
                console.error('Open Food Facts API search failed:', error);
                return [];
            }
        },

        searchByBarcode: async (barcode) => {
            try {
                const response = await fetch(`${FoodDatabaseSources.OPEN_FOOD_FACTS.baseUrl}/api/v0/product/${barcode}.json`);
                const data = await response.json();

                if (data.status === 1) {
                    const product = data.product;
                    return {
                        id: product.code,
                        name: product.product_name || product.product_name_en,
                        brand: product.brands,
                        calories: product.nutriments?.['energy-kcal_100g'] || 0,
                        protein: product.nutriments?.proteins_100g || 0,
                        carbs: product.nutriments?.carbohydrates_100g || 0,
                        fat: product.nutriments?.fat_100g || 0,
                        fiber: product.nutriments?.fiber_100g || 0,
                        sugar: product.nutriments?.sugars_100g || 0,
                        sodium: product.nutriments?.sodium_100g || 0,
                        image: product.image_url,
                        barcode: product.code,
                        source: 'OpenFoodFacts'
                    };
                }
                return null;
            } catch (error) {
                console.error('Open Food Facts barcode search failed:', error);
                return null;
            }
        }
    },

    // 3. Enhanced Local Database with Nutritionix Fallback (Limited Free Tier)
    NUTRITIONIX: {
        baseUrl: 'https://trackapi.nutritionix.com/v2',
        appId: 'YOUR_NUTRITIONIX_APP_ID',
        appKey: 'YOUR_NUTRITIONIX_APP_KEY',

        searchFoods: async (query, limit = 20) => {
            try {
                const response = await fetch(`${FoodDatabaseSources.NUTRITIONIX.baseUrl}/search/instant?query=${encodeURIComponent(query)}`, {
                    headers: {
                        'x-app-id': FoodDatabaseSources.NUTRITIONIX.appId,
                        'x-app-key': FoodDatabaseSources.NUTRITIONIX.appKey,
                    }
                });
                const data = await response.json();

                const results = [];

                // Common foods
                if (data.common) {
                    results.push(...data.common.slice(0, Math.floor(limit / 2)).map(food => ({
                        id: food.food_name,
                        name: food.food_name,
                        brand: 'Common',
                        calories: 0, // Would need additional API call for details
                        protein: 0,
                        carbs: 0,
                        fat: 0,
                        image: food.photo?.thumb,
                        source: 'Nutritionix-Common'
                    })));
                }

                // Branded foods
                if (data.branded) {
                    results.push(...data.branded.slice(0, Math.floor(limit / 2)).map(food => ({
                        id: food.nix_item_id,
                        name: food.food_name,
                        brand: food.brand_name,
                        calories: food.nf_calories || 0,
                        protein: food.nf_protein || 0,
                        carbs: food.nf_total_carbohydrate || 0,
                        fat: food.nf_total_fat || 0,
                        image: food.photo?.thumb,
                        source: 'Nutritionix-Branded'
                    })));
                }

                return results;
            } catch (error) {
                console.error('Nutritionix API search failed:', error);
                return [];
            }
        }
    }
};

// Multi-source food search function
export const searchFoodsMultiSource = async (query, options = {}) => {
    const { limit = 30, includeBarcode = false } = options;
    const results = [];

    try {
        // 1. Search local database first (fastest)
        const { getFoodDatabase } = require('./storage');
        const localDatabase = await getFoodDatabase();
        const localResults = localDatabase
            .filter(food =>
                food.name.toLowerCase().includes(query.toLowerCase()) ||
                food.brand?.toLowerCase().includes(query.toLowerCase())
            )
            .slice(0, 10)
            .map(food => ({ ...food, source: 'Local' }));

        results.push(...localResults);

        // 2. If we need more results, search external APIs
        if (results.length < limit) {
            const remainingLimit = limit - results.length;

            // Search USDA (free, comprehensive)
            try {
                const usdaResults = await FoodDatabaseSources.USDA_API.searchFoods(query, Math.min(15, remainingLimit));
                results.push(...usdaResults);
            } catch (error) {
                console.log('USDA search skipped:', error.message);
            }

            // Search Open Food Facts (free, good for branded foods)
            if (results.length < limit) {
                try {
                    const offResults = await FoodDatabaseSources.OPEN_FOOD_FACTS.searchFoods(query, Math.min(10, limit - results.length));
                    results.push(...offResults);
                } catch (error) {
                    console.log('Open Food Facts search skipped:', error.message);
                }
            }
        }

        // 3. Remove duplicates and sort by relevance
        const uniqueResults = results.filter((food, index, self) =>
            index === self.findIndex(f => f.name.toLowerCase() === food.name.toLowerCase())
        );

        // Sort by relevance (exact matches first, then partial matches)
        const sortedResults = uniqueResults.sort((a, b) => {
            const aExact = a.name.toLowerCase() === query.toLowerCase() ? 1 : 0;
            const bExact = b.name.toLowerCase() === query.toLowerCase() ? 1 : 0;

            if (aExact !== bExact) return bExact - aExact;

            const aStarts = a.name.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0;
            const bStarts = b.name.toLowerCase().startsWith(query.toLowerCase()) ? 1 : 0;

            return bStarts - aStarts;
        });

        return sortedResults.slice(0, limit);

    } catch (error) {
        console.error('Multi-source food search failed:', error);
        return results; // Return whatever we managed to find
    }
};

// Barcode lookup function
export const searchFoodByBarcode = async (barcode) => {
    try {
        // 1. Check local database first
        const { getFoodDatabase } = require('./storage');
        const localDatabase = await getFoodDatabase();
        const localResult = localDatabase.find(food => food.barcode === barcode);

        if (localResult) {
            return { ...localResult, source: 'Local' };
        }

        // 2. Search Open Food Facts (best for barcodes)
        const offResult = await FoodDatabaseSources.OPEN_FOOD_FACTS.searchByBarcode(barcode);
        if (offResult) {
            return offResult;
        }

        // 3. Could add other barcode APIs here

        return null;
    } catch (error) {
        console.error('Barcode search failed:', error);
        return null;
    }
};

// Enhanced food database management
export const enhanceLocalDatabase = async () => {
    try {
        // Pre-populate with common foods from multiple sources
        const commonFoods = [
            'apple', 'banana', 'chicken breast', 'rice', 'bread', 'milk', 'eggs',
            'salmon', 'broccoli', 'spinach', 'yogurt', 'cheese', 'pasta', 'potato'
        ];

        const enhancedDatabase = [];

        for (const food of commonFoods) {
            const results = await searchFoodsMultiSource(food, { limit: 5 });
            enhancedDatabase.push(...results);

            // Delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Save enhanced database
        const { saveFoodDatabase } = require('./storage');
        await saveFoodDatabase(enhancedDatabase);

        console.log(`Enhanced local database with ${enhancedDatabase.length} foods`);
        return enhancedDatabase;

    } catch (error) {
        console.error('Failed to enhance local database:', error);
        return [];
    }
};

export default FoodDatabaseSources;