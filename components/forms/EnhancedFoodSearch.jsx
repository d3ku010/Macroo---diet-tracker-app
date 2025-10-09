import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useTheme } from '../ui/ThemeProvider';

// Enhanced search component inspired by MyFitnessPal
const EnhancedFoodSearch = ({
    onFoodSelect,
    onBarcodePress,
    placeholder = "Search foods...",
    showRecentSearches = true
}) => {
    const { theme } = useTheme();
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [searchResults, setSearchResults] = useState([]);
    const [recentSearches, setRecentSearches] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        loadRecentSearches();
    }, []);

    useEffect(() => {
        if (search.length > 2) {
            const debounceTimer = setTimeout(() => {
                performSearch(search);
            }, 300);
            return () => clearTimeout(debounceTimer);
        } else {
            setSearchResults([]);
            setShowSuggestions(false);
        }
    }, [search]);

    const loadRecentSearches = async () => {
        // Implementation to load recent searches from storage
        // This would replace EDAMAM with your local database + user history
    };

    const performSearch = async (query) => {
        setIsLoading(true);
        setShowSuggestions(true);

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();

        try {
            // Enhanced search logic combining multiple sources
            const results = await searchMultipleSources(query);
            setSearchResults(results);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const searchMultipleSources = async (query) => {
        try {
            // Use the enhanced search function from storage
            const { searchFoodsEnhanced } = require('../../utils/supabaseStorage');

            const results = await searchFoodsEnhanced(query, {
                limit: 20,
                includeRecent: true,
                includeSources: ['local', 'recent', 'external']
            });

            return results;
        } catch (error) {
            console.error('Enhanced search failed, falling back to local:', error);

            // Fallback to basic local search
            const { getFoodDatabase } = require('../../utils/supabaseStorage');
            const database = await getFoodDatabase();

            return database
                .filter(food =>
                    food.name.toLowerCase().includes(query.toLowerCase()) ||
                    food.brand?.toLowerCase().includes(query.toLowerCase())
                )
                .slice(0, 20)
                .map(food => ({ ...food, source: 'Local' }));
        }
    };

    const searchCustomFoods = async (query) => {
        // Implementation for searching user's custom foods
        return [];
    };

    const searchRecentFoods = async (query) => {
        // Implementation for searching recently used foods
        return [];
    };

    const searchLocalDatabase = async (query) => {
        // Implementation for searching your local food database
        // This replaces EDAMAM API calls
        const { getFoodDatabase } = require('../../utils/supabaseStorage');
        const database = await getFoodDatabase();

        return database.filter(food =>
            food.name.toLowerCase().includes(query.toLowerCase()) ||
            food.brand?.toLowerCase().includes(query.toLowerCase())
        );
    };

    const renderFoodItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.foodItem, { backgroundColor: theme.card, borderColor: theme.muted }]}
            onPress={async () => {
                onFoodSelect(item);
                await saveRecentSearch(item);
                setShowSuggestions(false);
                setSearch('');
            }}
        >
            <View style={styles.foodInfo}>
                <Text style={[styles.foodName, { color: theme.text }]}>{item.name}</Text>
                <View style={styles.nutritionRow}>
                    <Text style={[styles.calories, { color: theme.primary }]}>
                        {item.calories} cal
                    </Text>
                    {item.brand && (
                        <Text style={[styles.brand, { color: theme.subText }]}>
                            • {item.brand}
                        </Text>
                    )}
                    <View style={[styles.sourceTag, {
                        backgroundColor: item.source === 'custom' ? theme.success :
                            item.source === 'recent' ? theme.warning : theme.muted
                    }]}>
                        <Text style={[styles.sourceText, { color: theme.onPrimary }]}>
                            {item.source === 'custom' ? 'MY' :
                                item.source === 'recent' ? 'RECENT' : 'DB'}
                        </Text>
                    </View>
                </View>
                <Text style={[styles.macros, { color: theme.subText }]}>
                    P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                </Text>
            </View>
            <Ionicons name="add-circle" size={24} color={theme.primary} />
        </TouchableOpacity>
    );

    const saveRecentSearch = async (food) => {
        try {
            const { saveRecentFood } = require('../../utils/supabaseStorage');
            await saveRecentFood(food);
        } catch (error) {
            console.error('Failed to save recent food:', error);
        }
    };

    return (
        <View style={styles.container}>
            <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
                <Ionicons name="search" size={20} color={theme.subText} style={styles.searchIcon} />
                <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder={placeholder}
                    placeholderTextColor={theme.subText}
                    value={search}
                    onChangeText={setSearch}
                    onFocus={() => setShowSuggestions(true)}
                />
                <TouchableOpacity onPress={onBarcodePress} style={styles.barcodeButton}>
                    <Ionicons name="barcode-outline" size={24} color={theme.primary} />
                </TouchableOpacity>
            </View>

            {showSuggestions && (
                <Animated.View style={[styles.suggestionsContainer, { opacity: fadeAnim }]}>
                    {isLoading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="small" color={theme.primary} />
                            <Text style={[styles.loadingText, { color: theme.subText }]}>
                                Searching...
                            </Text>
                        </View>
                    ) : searchResults.length > 0 ? (
                        <FlatList
                            data={searchResults}
                            keyExtractor={(item, index) => `${item.id || index}`}
                            renderItem={renderFoodItem}
                            showsVerticalScrollIndicator={false}
                            keyboardShouldPersistTaps="handled"
                        />
                    ) : search.length > 2 ? (
                        <View style={styles.noResults}>
                            <Text style={[styles.noResultsText, { color: theme.subText }]}>
                                No foods found for "{search}"
                            </Text>
                            <TouchableOpacity
                                style={[styles.createFoodButton, { backgroundColor: theme.primary }]}
                                onPress={() => {/* Navigate to create custom food */ }}
                            >
                                <Text style={[styles.createFoodText, { color: theme.onPrimary }]}>
                                    Create Custom Food
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : showRecentSearches && recentSearches.length > 0 ? (
                        <View>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Searches</Text>
                            <FlatList
                                data={recentSearches.slice(0, 5)}
                                keyExtractor={(item, index) => `recent-${index}`}
                                renderItem={renderFoodItem}
                                showsVerticalScrollIndicator={false}
                            />
                        </View>
                    ) : null}
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 25,
        marginHorizontal: 16,
        marginVertical: 8,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 8,
    },
    barcodeButton: {
        padding: 8,
    },
    suggestionsContainer: {
        maxHeight: 400,
        marginHorizontal: 16,
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 14,
    },
    foodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        marginVertical: 2,
        borderRadius: 8,
        borderWidth: 1,
    },
    foodInfo: {
        flex: 1,
    },
    foodName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    nutritionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 2,
    },
    calories: {
        fontSize: 14,
        fontWeight: '500',
    },
    brand: {
        fontSize: 12,
        marginLeft: 4,
    },
    sourceTag: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginLeft: 8,
    },
    sourceText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    macros: {
        fontSize: 12,
    },
    noResults: {
        alignItems: 'center',
        padding: 20,
    },
    noResultsText: {
        fontSize: 14,
        marginBottom: 12,
    },
    createFoodButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    createFoodText: {
        fontSize: 14,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
        marginLeft: 4,
    },
});

export default EnhancedFoodSearch;