import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import {
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { FOOD_CATEGORIES } from '../../types';
import { getFoodDatabase, searchFoods } from '../../utils/supabaseStorage';
import { useTheme } from '../ui/ThemeProvider';

const FoodSearchForm = ({ onFoodSelect, selectedFood, showFilters = true }) => {
    const { theme } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [foods, setFoods] = useState([]);
    const [filteredFoods, setFilteredFoods] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [sortBy, setSortBy] = useState('name'); // name, calories, protein
    const [loading, setLoading] = useState(false);
    const [showFiltersModal, setShowFiltersModal] = useState(false);

    useEffect(() => {
        loadFoods();
    }, []);

    useEffect(() => {
        filterAndSortFoods();
    }, [foods, searchQuery, selectedCategory, sortBy]);

    const loadFoods = async () => {
        setLoading(true);
        try {
            const allFoods = await getFoodDatabase();
            setFoods(allFoods);
        } catch (error) {
            console.error('Failed to load foods:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterAndSortFoods = async () => {
        let filtered = foods;

        // Apply search filter
        if (searchQuery.trim()) {
            filtered = await searchFoods(searchQuery);
        }

        // Apply category filter
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(food => food.category === selectedCategory);
        }

        // Apply sorting
        filtered.sort((a, b) => {
            switch (sortBy) {
                case 'calories':
                    return b.calories - a.calories;
                case 'protein':
                    return b.protein - a.protein;
                case 'name':
                default:
                    return a.name.localeCompare(b.name);
            }
        });

        setFilteredFoods(filtered);
    };

    const handleFoodPress = (food) => {
        if (onFoodSelect) {
            onFoodSelect(food);
        }
    };

    const renderFoodItem = ({ item }) => (
        <TouchableOpacity
            style={[
                styles.foodItem,
                {
                    backgroundColor: theme.card,
                    borderColor: selectedFood?.name === item.name ? theme.primary : theme.muted,
                },
            ]}
            onPress={() => handleFoodPress(item)}
        >
            <View style={styles.foodInfo}>
                <Text style={[styles.foodName, { color: theme.text }]}>
                    {item.name}
                </Text>
                <Text style={[styles.foodDetails, { color: theme.subText }]}>
                    {item.calories} kcal • P {item.protein}g • C {item.carbs}g • F {item.fat}g
                </Text>
                {item.category && (
                    <Text style={[styles.foodCategory, { color: theme.primary }]}>
                        {item.category}
                    </Text>
                )}
            </View>
            {selectedFood?.name === item.name && (
                <Ionicons name="checkmark-circle" size={24} color={theme.success} />
            )}
        </TouchableOpacity>
    );

    const renderCategoryFilter = () => (
        <View style={styles.categoryFilter}>
            <FlatList
                horizontal
                data={[{ key: 'all', label: 'All' }, ...FOOD_CATEGORIES.map(cat => ({ key: cat, label: cat }))]}
                keyExtractor={(item) => item.key}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[
                            styles.categoryButton,
                            {
                                backgroundColor: selectedCategory === item.key ? theme.primary : theme.muted,
                            },
                        ]}
                        onPress={() => setSelectedCategory(item.key)}
                    >
                        <Text
                            style={[
                                styles.categoryButtonText,
                                {
                                    color: selectedCategory === item.key ? theme.onPrimary : theme.text,
                                },
                            ]}
                        >
                            {item.label}
                        </Text>
                    </TouchableOpacity>
                )}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryList}
            />
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Search Input */}
            <View style={[styles.searchContainer, { backgroundColor: theme.card, borderColor: theme.muted }]}>
                <Ionicons name="search-outline" size={20} color={theme.subText} />
                <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Search foods..."
                    placeholderTextColor={theme.subText}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {showFilters && (
                    <TouchableOpacity
                        style={styles.filterButton}
                        onPress={() => setShowFiltersModal(true)}
                    >
                        <Ionicons name="options-outline" size={20} color={theme.primary} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Quick Stats */}
            <View style={styles.quickStats}>
                <Text style={[styles.statsText, { color: theme.subText }]}>
                    {filteredFoods.length} foods found
                </Text>
            </View>

            {/* Category Filter */}
            {showFilters && renderCategoryFilter()}

            {/* Food List */}
            <FlatList
                data={filteredFoods}
                keyExtractor={(item) => item.name}
                renderItem={renderFoodItem}
                style={styles.foodList}
                contentContainerStyle={styles.foodListContent}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="restaurant-outline" size={48} color={theme.subText} />
                        <Text style={[styles.emptyText, { color: theme.subText }]}>
                            {loading ? 'Loading foods...' : 'No foods found'}
                        </Text>
                        {!loading && searchQuery && (
                            <Text style={[styles.emptySubtext, { color: theme.subText }]}>
                                Try adjusting your search or filters
                            </Text>
                        )}
                    </View>
                }
            />

            {/* Filters Modal */}
            <Modal
                visible={showFiltersModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowFiltersModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>
                            Filter & Sort Options
                        </Text>

                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            Sort by:
                        </Text>
                        <View style={styles.sortOptions}>
                            {[
                                { key: 'name', label: 'Name (A-Z)' },
                                { key: 'calories', label: 'Calories (High to Low)' },
                                { key: 'protein', label: 'Protein (High to Low)' },
                            ].map((option) => (
                                <TouchableOpacity
                                    key={option.key}
                                    style={[
                                        styles.sortOption,
                                        {
                                            backgroundColor: sortBy === option.key ? theme.primary : theme.muted,
                                        },
                                    ]}
                                    onPress={() => setSortBy(option.key)}
                                >
                                    <Text
                                        style={[
                                            styles.sortOptionText,
                                            {
                                                color: sortBy === option.key ? theme.onPrimary : theme.text,
                                            },
                                        ]}
                                    >
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <TouchableOpacity
                            style={[styles.modalCloseButton, { backgroundColor: theme.primary }]}
                            onPress={() => setShowFiltersModal(false)}
                        >
                            <Text style={[styles.modalCloseButtonText, { color: theme.onPrimary }]}>
                                Apply Filters
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

FoodSearchForm.propTypes = {
    onFoodSelect: PropTypes.func.isRequired,
    selectedFood: PropTypes.object,
    showFilters: PropTypes.bool,
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginBottom: 12,
    },
    searchInput: {
        flex: 1,
        marginLeft: 8,
        fontSize: 16,
    },
    filterButton: {
        padding: 4,
    },
    quickStats: {
        marginBottom: 8,
    },
    statsText: {
        fontSize: 12,
        textAlign: 'center',
    },
    categoryFilter: {
        marginBottom: 12,
    },
    categoryList: {
        paddingHorizontal: 4,
    },
    categoryButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 4,
    },
    categoryButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    foodList: {
        flex: 1,
    },
    foodListContent: {
        paddingBottom: 20,
    },
    foodItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        marginBottom: 8,
    },
    foodInfo: {
        flex: 1,
    },
    foodName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    foodDetails: {
        fontSize: 12,
        marginBottom: 2,
    },
    foodCategory: {
        fontSize: 10,
        fontWeight: '500',
        textTransform: 'capitalize',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '500',
        marginTop: 12,
    },
    emptySubtext: {
        fontSize: 12,
        marginTop: 4,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 16,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
        textAlign: 'center',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    sortOptions: {
        marginBottom: 20,
    },
    sortOption: {
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    sortOptionText: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'center',
    },
    modalCloseButton: {
        padding: 14,
        borderRadius: 10,
        alignItems: 'center',
    },
    modalCloseButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default FoodSearchForm;