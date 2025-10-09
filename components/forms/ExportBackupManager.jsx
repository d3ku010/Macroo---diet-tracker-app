import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
    View,
} from 'react-native';
import {
    createQuickBackup,
    exportDataToFile,
    exportMealsToCSV,
    exportNutritionSummary,
    importDataFromFile
} from '../../utils/exportUtils';
import Toast from '../ui/Toast';

const ExportBackupManager = ({ onClose, onDataImported }) => {
    const colorScheme = useColorScheme();
    const [isLoading, setIsLoading] = useState(false);
    const [loadingAction, setLoadingAction] = useState('');
    const [toast, setToast] = useState(null);

    const isDark = colorScheme === 'dark';
    const colors = {
        background: isDark ? '#1a1a1a' : '#ffffff',
        surface: isDark ? '#2a2a2a' : '#f5f5f5',
        text: isDark ? '#ffffff' : '#333333',
        textSecondary: isDark ? '#b0b0b0' : '#666666',
        accent: '#4CAF50',
        warning: '#FF9800',
        error: '#f44336',
        border: isDark ? '#444444' : '#e0e0e0',
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleExportData = async () => {
        setIsLoading(true);
        setLoadingAction('Exporting data...');

        try {
            const result = await exportDataToFile();
            if (result.success) {
                showToast(result.message, 'success');
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast('Export failed: ' + error.message, 'error');
        } finally {
            setIsLoading(false);
            setLoadingAction('');
        }
    };

    const handleImportData = async () => {
        Alert.alert(
            'Import Data',
            'This will replace all your current data. Make sure you have a backup first. Continue?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Continue',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        setLoadingAction('Importing data...');

                        try {
                            const result = await importDataFromFile();
                            if (result.success) {
                                showToast(result.message, 'success');
                                if (onDataImported) onDataImported();
                            } else {
                                showToast(result.message, 'error');
                            }
                        } catch (error) {
                            showToast('Import failed: ' + error.message, 'error');
                        } finally {
                            setIsLoading(false);
                            setLoadingAction('');
                        }
                    },
                },
            ]
        );
    };

    const handleExportCSV = async () => {
        setIsLoading(true);
        setLoadingAction('Generating CSV...');

        try {
            const result = await exportMealsToCSV(30);
            if (result.success) {
                showToast(result.message, 'success');
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast('CSV export failed: ' + error.message, 'error');
        } finally {
            setIsLoading(false);
            setLoadingAction('');
        }
    };

    const handleExportSummary = async () => {
        setIsLoading(true);
        setLoadingAction('Generating summary...');

        try {
            const result = await exportNutritionSummary(30);
            if (result.success) {
                showToast('Nutrition summary generated', 'success');
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast('Summary generation failed: ' + error.message, 'error');
        } finally {
            setIsLoading(false);
            setLoadingAction('');
        }
    };

    const handleQuickBackup = async () => {
        setIsLoading(true);
        setLoadingAction('Creating backup...');

        try {
            const result = await createQuickBackup();
            if (result.success) {
                showToast('Quick backup created', 'success');
            } else {
                showToast(result.message, 'error');
            }
        } catch (error) {
            showToast('Backup failed: ' + error.message, 'error');
        } finally {
            setIsLoading(false);
            setLoadingAction('');
        }
    };

    const ExportOption = ({
        icon,
        title,
        description,
        onPress,
        type = 'primary',
        disabled = false
    }) => (
        <TouchableOpacity
            style={[
                styles.optionCard,
                {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: disabled ? 0.6 : 1,
                }
            ]}
            onPress={disabled ? null : onPress}
            disabled={disabled}
        >
            <View style={styles.optionIcon}>
                <Ionicons
                    name={icon}
                    size={24}
                    color={type === 'warning' ? colors.warning : colors.accent}
                />
            </View>
            <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: colors.text }]}>
                    {title}
                </Text>
                <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                    {description}
                </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>
                    Export & Backup
                </Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Loading Overlay */}
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <View style={[styles.loadingContainer, { backgroundColor: colors.surface }]}>
                        <ActivityIndicator size="large" color={colors.accent} />
                        <Text style={[styles.loadingText, { color: colors.text }]}>
                            {loadingAction}
                        </Text>
                    </View>
                </View>
            )}

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Backup Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Backup Data
                    </Text>
                    <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                        Keep your data safe with regular backups
                    </Text>

                    <ExportOption
                        icon="download-outline"
                        title="Full Data Export"
                        description="Export all your data (meals, templates, settings) as JSON file"
                        onPress={handleExportData}
                        disabled={isLoading}
                    />

                    <ExportOption
                        icon="flash-outline"
                        title="Quick Backup"
                        description="Create a quick backup saved to your device"
                        onPress={handleQuickBackup}
                        disabled={isLoading}
                    />
                </View>

                {/* Export Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Export Reports
                    </Text>
                    <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                        Generate and share nutrition reports
                    </Text>

                    <ExportOption
                        icon="document-text-outline"
                        title="Meals CSV Export"
                        description="Export last 30 days of meals as spreadsheet (CSV)"
                        onPress={handleExportCSV}
                        disabled={isLoading}
                    />

                    <ExportOption
                        icon="analytics-outline"
                        title="Nutrition Summary"
                        description="Generate detailed nutrition report with insights"
                        onPress={handleExportSummary}
                        disabled={isLoading}
                    />
                </View>

                {/* Import Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>
                        Restore Data
                    </Text>
                    <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                        Import data from backup files
                    </Text>

                    <ExportOption
                        icon="cloud-upload-outline"
                        title="Import Data"
                        description="Restore data from a backup file (replaces current data)"
                        onPress={handleImportData}
                        type="warning"
                        disabled={isLoading}
                    />
                </View>

                {/* Info Section */}
                <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Ionicons name="information-circle" size={20} color={colors.accent} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                        Regular backups help keep your nutrition data safe.
                        Export files can be shared with healthcare providers or used for analysis.
                    </Text>
                </View>
            </ScrollView>

            {/* Toast */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onHide={() => setToast(null)}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '600',
    },
    closeButton: {
        padding: 4,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingContainer: {
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        minWidth: 200,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 4,
    },
    sectionDescription: {
        fontSize: 14,
        marginBottom: 16,
        lineHeight: 20,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
    },
    optionIcon: {
        marginRight: 16,
    },
    optionContent: {
        flex: 1,
    },
    optionTitle: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 4,
    },
    optionDescription: {
        fontSize: 14,
        lineHeight: 20,
    },
    infoCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginTop: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        marginLeft: 12,
    },
});

export default ExportBackupManager;