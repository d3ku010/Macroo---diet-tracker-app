import PropTypes from 'prop-types';
import { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useTheme } from '../ui/ThemeProvider';

const screenWidth = Dimensions.get('window').width;

const DailyCalorieChart = ({ data, showDetails = false, onBarPress }) => {
    const { theme } = useTheme();
    const [selectedBar, setSelectedBar] = useState(null);

    if (!data || data.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.subText }]}>
                    No meal data available
                </Text>
            </View>
        );
    }

    const labels = data.map(d => d.meal.length > 8 ? d.meal.substring(0, 8) + '...' : d.meal);
    const values = data.map(d => Math.max(0, d.calories || 0));
    const maxValue = Math.max(...values);

    const handleDataPointClick = (data, index) => {
        setSelectedBar(index);
        if (onBarPress) {
            onBarPress(data, index);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: theme.text }]}>
                Calories Per Meal
            </Text>

            {selectedBar !== null && (
                <View style={[styles.tooltip, { backgroundColor: theme.card, borderColor: theme.primary }]}>
                    <Text style={[styles.tooltipTitle, { color: theme.text }]}>
                        {data[selectedBar]?.meal}
                    </Text>
                    <Text style={[styles.tooltipValue, { color: theme.primary }]}>
                        {Math.round(data[selectedBar]?.calories || 0)} kcal
                    </Text>
                    {showDetails && data[selectedBar]?.nutrients && (
                        <View style={styles.tooltipDetails}>
                            <Text style={[styles.tooltipDetail, { color: theme.success }]}>
                                P: {Math.round(data[selectedBar].nutrients.protein || 0)}g
                            </Text>
                            <Text style={[styles.tooltipDetail, { color: theme.primary }]}>
                                C: {Math.round(data[selectedBar].nutrients.carbs || 0)}g
                            </Text>
                            <Text style={[styles.tooltipDetail, { color: theme.fat }]}>
                                F: {Math.round(data[selectedBar].nutrients.fat || 0)}g
                            </Text>
                        </View>
                    )}
                </View>
            )}

            <BarChart
                data={{
                    labels,
                    datasets: [{ data: values }],
                }}
                width={screenWidth - 32}
                height={220}
                fromZero
                chartConfig={{
                    backgroundGradientFrom: theme.card,
                    backgroundGradientTo: theme.card,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `${theme.success}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
                    labelColor: () => theme.subText,
                    barPercentage: 0.7,
                    propsForBackgroundLines: {
                        stroke: theme.muted,
                        strokeWidth: 1,
                    },
                }}
                style={styles.chart}
                onDataPointClick={handleDataPointClick}
                withInnerLines={true}
                showValuesOnTopOfBars={true}
                withCustomBarColorFromData={true}
            />

            {showDetails && (
                <View style={styles.summary}>
                    <Text style={[styles.summaryText, { color: theme.subText }]}>
                        Total: {Math.round(values.reduce((a, b) => a + b, 0))} kcal •
                        Avg: {Math.round(values.reduce((a, b) => a + b, 0) / values.length)} kcal
                    </Text>
                </View>
            )}

            <TouchableOpacity
                style={styles.clearSelection}
                onPress={() => setSelectedBar(null)}
            >
                <Text style={[styles.clearText, { color: theme.primary }]}>
                    Clear selection
                </Text>
            </TouchableOpacity>
        </View>
    );
};

DailyCalorieChart.propTypes = {
    data: PropTypes.arrayOf(PropTypes.shape({
        meal: PropTypes.string.isRequired,
        calories: PropTypes.number.isRequired,
        nutrients: PropTypes.shape({
            protein: PropTypes.number,
            carbs: PropTypes.number,
            fat: PropTypes.number,
        }),
    })),
    showDetails: PropTypes.bool,
    onBarPress: PropTypes.func,
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 10,
    },
    chart: {
        borderRadius: 12,
        marginVertical: 8,
    },
    tooltip: {
        position: 'absolute',
        top: 40,
        right: 16,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        zIndex: 10,
        shadowOpacity: 0.1,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    tooltipTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
    },
    tooltipValue: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
    },
    tooltipDetails: {
        flexDirection: 'row',
        gap: 8,
    },
    tooltipDetail: {
        fontSize: 12,
        fontWeight: '500',
    },
    summary: {
        alignItems: 'center',
        marginTop: 8,
    },
    summaryText: {
        fontSize: 12,
    },
    clearSelection: {
        alignItems: 'center',
        marginTop: 8,
        opacity: 0.7,
    },
    clearText: {
        fontSize: 12,
        textDecorationLine: 'underline',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 150,
    },
    emptyText: {
        fontSize: 16,
        fontStyle: 'italic',
    },
});

export default DailyCalorieChart;