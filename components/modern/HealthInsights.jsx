import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getHealthRecommendations } from '../../utils/healthCalculations';
import ResponsiveCard from '../layout/ResponsiveCard';
import { useTheme } from '../ui/ThemeProvider';

const HealthInsights = ({ profile, onViewMore }) => {
    const { theme } = useTheme();

    if (!profile || !profile.height || !profile.weight || !profile.age) {
        return null;
    }

    const recommendations = getHealthRecommendations(profile);
    const highPriorityRecommendations = recommendations.filter(rec => rec.priority === 'high');
    const hasRecommendations = recommendations.length > 0;

    if (!hasRecommendations) {
        return (
            <ResponsiveCard size="medium" style={{ marginBottom: 16 }}>
                <View style={styles.healthInsightsContent}>
                    <View style={styles.insightHeader}>
                        <Ionicons name="heart-outline" size={20} color={theme.primary} />
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>Health Insights</Text>
                    </View>
                    <View style={[styles.statusCard, styles.goodStatus, { backgroundColor: theme.success + '20' || '#10b98120' }]}>
                        <Ionicons name="checkmark-circle" size={24} color="#10b981" />
                        <View style={styles.statusText}>
                            <Text style={[styles.statusTitle, { color: '#10b981' }]}>Looking Good!</Text>
                            <Text style={[styles.statusDescription, { color: theme.subText }]}>
                                Your profile looks healthy. Keep up the great work!
                            </Text>
                        </View>
                    </View>
                </View>
            </ResponsiveCard>
        );
    }

    return (
        <ResponsiveCard size="medium" style={{ marginBottom: 16 }}>
            <View style={styles.healthInsightsContent}>
                <View style={styles.insightHeader}>
                    <Ionicons name="analytics-outline" size={20} color={theme.primary} />
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Health Insights</Text>
                </View>

                {highPriorityRecommendations.length > 0 ? (
                    <View style={[styles.statusCard, styles.warningStatus, { backgroundColor: theme.warning + '20' || '#f59e0b20' }]}>
                        <Ionicons name="warning-outline" size={24} color="#f59e0b" />
                        <View style={styles.statusText}>
                            <Text style={[styles.statusTitle, { color: '#f59e0b' }]}>
                                Health Recommendations
                            </Text>
                            <Text style={[styles.statusDescription, { color: theme.subText }]}>
                                {highPriorityRecommendations[0].message}
                            </Text>
                        </View>
                    </View>
                ) : (
                    <View style={[styles.statusCard, styles.infoStatus, { backgroundColor: theme.primary + '20' }]}>
                        <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
                        <View style={styles.statusText}>
                            <Text style={[styles.statusTitle, { color: theme.primary }]}>
                                Optimize Your Health
                            </Text>
                            <Text style={[styles.statusDescription, { color: theme.subText }]}>
                                {recommendations[0]?.message || 'Check your profile settings for optimization tips.'}
                            </Text>
                        </View>
                    </View>
                )}

                {recommendations.length > 1 && (
                    <TouchableOpacity style={styles.viewMoreButton} onPress={onViewMore}>
                        <Text style={[styles.viewMoreText, { color: theme.primary }]}>
                            View {recommendations.length - 1} more recommendation{recommendations.length > 2 ? 's' : ''}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} color={theme.primary} />
                    </TouchableOpacity>
                )}
            </View>
        </ResponsiveCard>
    );
};

const styles = StyleSheet.create({
    healthInsightsContent: {
        gap: 12,
    },
    insightHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    statusCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    goodStatus: {
        borderColor: '#10b98120',
    },
    warningStatus: {
        borderColor: '#f59e0b20',
    },
    infoStatus: {
        borderColor: 'transparent',
    },
    statusText: {
        flex: 1,
        marginLeft: 12,
    },
    statusTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    statusDescription: {
        fontSize: 13,
        lineHeight: 18,
    },
    viewMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    viewMoreText: {
        fontSize: 14,
        fontWeight: '500',
        marginRight: 4,
    },
});

export default HealthInsights;