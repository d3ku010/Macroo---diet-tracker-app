import { Ionicons } from '@expo/vector-icons';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { MEAL_TYPES } from '../../types';
import { deleteMealTemplate, getMealTemplates, saveMealTemplate } from '../../utils/supabaseStorage';
import { useTheme } from '../ui/ThemeProvider';

const MealTemplateForm = ({ onTemplateSelect, onTemplateCreate }) => {
    const { theme } = useTheme();
    const [templates, setTemplates] = useState([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newTemplateName, setNewTemplateName] = useState('');
    const [newTemplateCategory, setNewTemplateCategory] = useState('Breakfast');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        try {
            const loadedTemplates = await getMealTemplates();
            setTemplates(loadedTemplates);
        } catch (error) {
            console.error('Failed to load meal templates:', error);
        }
    };

    const handleCreateTemplate = async () => {
        if (!newTemplateName.trim()) {
            Alert.alert('Error', 'Please enter a template name');
            return;
        }

        setLoading(true);
        try {
            const newTemplate = {
                name: newTemplateName.trim(),
                category: newTemplateCategory,
                foods: [],
                isFavorite: false,
            };

            const savedTemplate = await saveMealTemplate(newTemplate);
            if (savedTemplate) {
                setTemplates([...templates, savedTemplate]);
                setShowCreateModal(false);
                setNewTemplateName('');
                setNewTemplateCategory('Breakfast');

                if (onTemplateCreate) {
                    onTemplateCreate(savedTemplate);
                }
            }
        } catch (error) {
            console.error('Failed to create template:', error);
            Alert.alert('Error', 'Failed to create meal template');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteTemplate = async (templateId) => {
        Alert.alert(
            'Delete Template',
            'Are you sure you want to delete this meal template?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteMealTemplate(templateId);
                            setTemplates(templates.filter(t => t.id !== templateId));
                        } catch (error) {
                            console.error('Failed to delete template:', error);
                            Alert.alert('Error', 'Failed to delete meal template');
                        }
                    },
                },
            ]
        );
    };

    const handleTemplatePress = (template) => {
        if (onTemplateSelect) {
            onTemplateSelect(template);
        }
    };

    const toggleFavorite = async (template) => {
        try {
            const updatedTemplate = { ...template, isFavorite: !template.isFavorite };
            await saveMealTemplate(updatedTemplate);
            setTemplates(templates.map(t =>
                t.id === template.id ? updatedTemplate : t
            ));
        } catch (error) {
            console.error('Failed to update favorite:', error);
        }
    };

    const getCategoryIcon = (category) => {
        switch (category) {
            case 'Breakfast': return '🍳';
            case 'Lunch': return '🥪';
            case 'Dinner': return '🍽️';
            case 'Snack': return '🍎';
            default: return '🍴';
        }
    };

    const favoriteTemplates = templates.filter(t => t.isFavorite);
    const regularTemplates = templates.filter(t => !t.isFavorite);

    const renderTemplateItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.templateItem, {
                backgroundColor: theme.card,
                borderColor: item.isFavorite ? theme.primary : theme.muted,
                borderWidth: item.isFavorite ? 2 : 1
            }]}
            onPress={() => handleTemplatePress(item)}
        >
            <View style={styles.templateHeader}>
                <View style={styles.templateIcon}>
                    <Text style={styles.categoryEmoji}>{getCategoryIcon(item.category)}</Text>
                </View>
                <View style={styles.templateInfo}>
                    <Text style={[styles.templateName, { color: theme.text }]}>
                        {item.name}
                    </Text>
                    <Text style={[styles.templateCategory, { color: theme.subText }]}>
                        {item.category}
                    </Text>
                    {item.foods && item.foods.length > 0 && (
                        <Text style={[styles.templateFoods, { color: theme.success }]}>
                            {item.foods.length} food{item.foods.length !== 1 ? 's' : ''} •
                            {item.foods.reduce((sum, food) => sum + (food.calories || 0), 0)} cal
                        </Text>
                    )}
                </View>
                <View style={styles.templateActions}>
                    <TouchableOpacity
                        onPress={() => toggleFavorite(item)}
                        style={[styles.actionButton, { backgroundColor: item.isFavorite ? theme.primary : theme.background }]}
                    >
                        <Ionicons
                            name={item.isFavorite ? "star" : "star-outline"}
                            size={18}
                            color={item.isFavorite ? theme.onPrimary : theme.subText}
                        />
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => handleDeleteTemplate(item.id)}
                        style={[styles.actionButton, { backgroundColor: theme.background }]}
                    >
                        <Ionicons name="trash-outline" size={18} color={theme.danger} />
                    </TouchableOpacity>
                </View>
            </View>

            {item.foods && item.foods.length > 0 && (
                <View style={styles.foodsList}>
                    {item.foods.slice(0, 3).map((food, index) => (
                        <Text key={index} style={[styles.foodItem, { color: theme.subText }]}>
                            • {food.food} ({food.quantity}g)
                        </Text>
                    ))}
                    {item.foods.length > 3 && (
                        <Text style={[styles.moreItems, { color: theme.primary }]}>
                            +{item.foods.length - 3} more
                        </Text>
                    )}
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.text }]}>
                    🍽️ Meal Templates
                </Text>
                <TouchableOpacity
                    style={[styles.createButton, { backgroundColor: theme.primary }]}
                    onPress={() => setShowCreateModal(true)}
                >
                    <Ionicons name="add" size={20} color={theme.onPrimary} />
                    <Text style={[styles.createButtonText, { color: theme.onPrimary }]}>
                        New Template
                    </Text>
                </TouchableOpacity>
            </View>

            {favoriteTemplates.length > 0 && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.primary }]}>
                        ⭐ Favorites
                    </Text>
                    <FlatList
                        data={favoriteTemplates}
                        renderItem={renderTemplateItem}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={false}
                    />
                </View>
            )}

            {regularTemplates.length > 0 && (
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        📋 All Templates
                    </Text>
                    <FlatList
                        data={regularTemplates}
                        renderItem={renderTemplateItem}
                        keyExtractor={(item) => item.id}
                        showsVerticalScrollIndicator={false}
                        scrollEnabled={false}
                    />
                </View>
            )}

            {templates.length === 0 && (
                <View style={styles.emptyState}>
                    <Text style={[styles.emptyText, { color: theme.subText }]}>
                        No meal templates yet.{'\n'}Create your first template to get started!
                    </Text>
                </View>
            )}

            <Modal
                visible={showCreateModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.text }]}>
                                🍽️ Create Template
                            </Text>
                            <TouchableOpacity
                                onPress={() => setShowCreateModal(false)}
                                style={styles.closeButton}
                            >
                                <Ionicons name="close" size={24} color={theme.subText} />
                            </TouchableOpacity>
                        </View>

                        <Text style={[styles.inputLabel, { color: theme.subText }]}>
                            Template Name
                        </Text>
                        <TextInput
                            style={[styles.textInput, { borderColor: theme.muted, color: theme.text }]}
                            placeholder="e.g., Quick Breakfast"
                            placeholderTextColor={theme.subText}
                            value={newTemplateName}
                            onChangeText={setNewTemplateName}
                        />

                        <Text style={[styles.inputLabel, { color: theme.subText, marginTop: 16 }]}>
                            Category
                        </Text>
                        <View style={styles.categoryButtons}>
                            {MEAL_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    style={[
                                        styles.categoryButton,
                                        {
                                            backgroundColor: newTemplateCategory === type ? theme.primary : theme.background,
                                            borderColor: theme.muted,
                                        },
                                    ]}
                                    onPress={() => setNewTemplateCategory(type)}
                                >
                                    <Text style={[styles.categoryButtonText, {
                                        color: newTemplateCategory === type ? theme.onPrimary : theme.text
                                    }]}>
                                        {getCategoryIcon(type)} {type}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.background, borderColor: theme.muted }]}
                                onPress={() => setShowCreateModal(false)}
                            >
                                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                                onPress={handleCreateTemplate}
                                disabled={loading || !newTemplateName.trim()}
                            >
                                <Text style={[styles.modalButtonText, { color: theme.onPrimary }]}>
                                    {loading ? 'Creating...' : 'Create'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
};

MealTemplateForm.propTypes = {
    onTemplateSelect: PropTypes.func,
    onTemplateCreate: PropTypes.func,
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
    },
    createButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        gap: 4,
    },
    createButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    templateItem: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
    },
    templateHeader: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    templateIcon: {
        marginRight: 12,
    },
    categoryEmoji: {
        fontSize: 24,
    },
    templateInfo: {
        flex: 1,
    },
    templateName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    templateCategory: {
        fontSize: 14,
        marginBottom: 4,
    },
    templateFoods: {
        fontSize: 12,
    },
    templateActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        padding: 8,
        borderRadius: 6,
    },
    foodsList: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(0,0,0,0.1)',
    },
    foodItem: {
        fontSize: 12,
        marginBottom: 2,
    },
    moreItems: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
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
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    closeButton: {
        padding: 4,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
    },
    categoryButtons: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    categoryButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
    },
    categoryButtonText: {
        fontSize: 14,
        fontWeight: '500',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
        marginTop: 24,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default MealTemplateForm;