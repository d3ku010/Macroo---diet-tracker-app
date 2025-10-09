import PropTypes from 'prop-types';
import { useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import SegmentedControl from '../ui/SegmentedControl';
import { useTheme } from '../ui/ThemeProvider';

const screenWidth = Dimensions.get('window').width;

const WeeklyMonthlyChart = ({
    weeklyData = [],
    monthlyData = [],
    showComparison = true,
    defaultPeriod = 'week'
}) => {
    const { theme } = useTheme();
    const [selectedPeriod, setSelectedPeriod] = useState(defaultPeriod);
    const [selectedMetric, setSelectedMetric] = useState('calories');
    const [comparisonMode, setComparisonMode] = useState(false);

    const currentData = selectedPeriod === 'week' ? weeklyData : monthlyData;

    if (!currentData || currentData.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.subText }]}>
                    No data available for {selectedPeriod}ly view
                </Text>
            </View>
        );
    }

    // Process data for different metrics
    const processDataForMetric = (data, metric) => {
        return data.map(item => {
            switch (metric) {
                case 'calories':
                    return item.calories || 0;
                case 'protein':
                    return item.protein || 0;
                case 'carbs':
                    return item.carbs || 0;
                case 'fat':
                    return item.fat || 0;
                case 'water':
                    return item.water || 0;
                default:
                    return item.calories || 0;
            }
        });
    };

    const chartData = processDataForMetric(currentData, selectedMetric);
    const labels = currentData.map((item, index) => {
        if (selectedPeriod === 'week') {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return days[index % 7] || `Day ${index + 1}`;
        } else {
            return item.label || `${index + 1}`;
        }
    });

    // Calculate trend and comparison
    const average = chartData.length > 0 ? chartData.reduce((a, b) => a + b, 0) / chartData.length : 0;
    const trend = chartData.length >= 2 ?
        ((chartData[chartData.length - 1] - chartData[0]) / chartData[0] * 100) : 0;

    const getMetricColor = () => {
        switch (selectedMetric) {
            case 'protein': return theme.success;
            case 'carbs': return theme.primary;
            case 'fat': return theme.fat;
            case 'water': return theme.primary;
            default: return theme.danger;
        }
    };

    const getMetricUnit = () => {
        switch (selectedMetric) {
            case 'calories': return 'kcal';
            case 'water': return 'ml';
            default: return 'g';
        }
    };

    const datasets = [{
        data: chartData,
        color: () => getMetricColor(),
        strokeWidth: 3,
    }];

    // Add comparison line if enabled
    if (comparisonMode && showComparison) {
        const previousPeriodData = selectedPeriod === 'week' ? monthlyData.slice(-7) : weeklyData;
        if (previousPeriodData.length > 0) {
            const comparisonData = processDataForMetric(previousPeriodData, selectedMetric);
            datasets.push({
                data: comparisonData.slice(0, chartData.length),
                color: () => `${getMetricColor()}80`,
                strokeWidth: 2,
                withDots: false,
            });
        }
    }

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: theme.text }]}>
                Progress Over Time
            </Text>

            {/* Period selector */}
            <SegmentedControl
                options={[
                    { key: 'week', label: 'Week' },
                    { key: 'month', label: 'Month' }
                ]}
                value={selectedPeriod}
                onChange={setSelectedPeriod}
                style={styles.periodSelector}
            />

            {/* Metric selector */}
            <SegmentedControl
                options={[
                    { key: 'calories', label: 'Calories' },
                    { key: 'protein', label: 'Protein' },
                    { key: 'carbs', label: 'Carbs' },
                    { key: 'fat', label: 'Fat' },
                    { key: 'water', label: 'Water' }
                ]}
                value={selectedMetric}
                onChange={setSelectedMetric}
                style={styles.metricSelector}
            />

            {/* Chart */}
            <LineChart
                data={{
                    labels: labels,
                    datasets: datasets,
                    legend: comparisonMode ? ['Current', 'Previous'] : undefined,
                }}
                width={screenWidth - 32}
                height={220}
                chartConfig={{
                    backgroundGradientFrom: theme.card,
                    backgroundGradientTo: theme.card,
                    decimalPlaces: 0,
                    color: (opacity = 1) => `${getMetricColor()}${Math.round(opacity * 255).toString(16)}`,
                    labelColor: () => theme.subText,
                    propsForBackgroundLines: {
                        stroke: theme.muted,
                        strokeWidth: 1,
                    },
                    propsForDots: {
                        r: '4',
                        strokeWidth: '2',
                        stroke: getMetricColor(),
                    },
                }}
                bezier
                style={styles.chart}
                withDots={chartData.length <= 7}
                withShadow={false}
                withInnerLines={true}
                withOuterLines={false}
            />

            {/* Statistics */}
            <View style={styles.stats}>
                <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.subText }]}>
                        Average
                    </Text>
                    <Text style={[styles.statValue, { color: theme.text }]}>
                        {average.toFixed(1)} {getMetricUnit()}
                    </Text>
                </View>

                <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.subText }]}>
                        Trend
                    </Text>
                    <Text style={[
                        styles.statValue,
                        { color: trend > 0 ? theme.success : trend < 0 ? theme.danger : theme.text }
                    ]}>
                        {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                    </Text>
                </View>

                <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: theme.subText }]}>
                        Peak
                    </Text>
                    <Text style={[styles.statValue, { color: theme.text }]}>
                        {Math.max(...chartData).toFixed(1)} {getMetricUnit()}
                    </Text>
                </View>
            </View>

            {/* Comparison toggle */}
            {showComparison && (
                <TouchableOpacity
                    style={styles.comparisonToggle}
                    onPress={() => setComparisonMode(!comparisonMode)}
                >
                    <Text style={[styles.comparisonText, { color: theme.primary }]}>
                        {comparisonMode ? 'Hide' : 'Show'} Comparison
                    </Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

WeeklyMonthlyChart.propTypes = {
    weeklyData: PropTypes.arrayOf(PropTypes.shape({
        calories: PropTypes.number,
        protein: PropTypes.number,
        carbs: PropTypes.number,
        fat: PropTypes.number,
        water: PropTypes.number,
        label: PropTypes.string,
    })),
    monthlyData: PropTypes.arrayOf(PropTypes.shape({
        calories: PropTypes.number,
        protein: PropTypes.number,
        carbs: PropTypes.number,
        fat: PropTypes.number,
        water: PropTypes.number,
        label: PropTypes.string,
    })),
    showComparison: PropTypes.bool,
    defaultPeriod: PropTypes.oneOf(['week', 'month']),
};

const styles = StyleSheet.create({
    container: {
        marginVertical: 16,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
    },
    periodSelector: {
        marginBottom: 12,
    },
    metricSelector: {
        marginBottom: 16,
    },
    chart: {
        borderRadius: 12,
        marginVertical: 8,
    },
    stats: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginTop: 16,
        paddingHorizontal: 16,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    comparisonToggle: {
        alignItems: 'center',
        marginTop: 12,
        padding: 8,
    },
    comparisonText: {
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 200,
    },
    emptyText: {
        fontSize: 16,
        fontStyle: 'italic',
    },
});

export default WeeklyMonthlyChart;