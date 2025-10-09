import PropTypes from 'prop-types';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useTheme } from '../ui/ThemeProvider';

const screenWidth = Dimensions.get('window').width;

const MacroRatioPieChart = ({
    protein = 0,
    carbs = 0,
    fat = 0,
    showLegend = true,
    size = 'medium',
    showValues = true
}) => {
    const { theme } = useTheme();

    const total = protein + carbs + fat;

    if (total === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.subText }]}>
                    No macro data available
                </Text>
            </View>
        );
    }

    const proteinCals = protein * 4;
    const carbsCals = carbs * 4;
    const fatCals = fat * 9;
    const totalCals = proteinCals + carbsCals + fatCals;

    const data = [
        {
            name: 'Protein',
            population: proteinCals,
            color: theme.success,
            legendFontColor: theme.text,
            legendFontSize: 12,
        },
        {
            name: 'Carbs',
            population: carbsCals,
            color: theme.primary,
            legendFontColor: theme.text,
            legendFontSize: 12,
        },
        {
            name: 'Fat',
            population: fatCals,
            color: theme.fat,
            legendFontColor: theme.text,
            legendFontSize: 12,
        },
    ].filter(item => item.population > 0);

    const chartSize = size === 'small' ? 120 : size === 'large' ? 200 : 160;

    const proteinPercent = totalCals > 0 ? ((proteinCals / totalCals) * 100).toFixed(1) : 0;
    const carbsPercent = totalCals > 0 ? ((carbsCals / totalCals) * 100).toFixed(1) : 0;
    const fatPercent = totalCals > 0 ? ((fatCals / totalCals) * 100).toFixed(1) : 0;

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: theme.text }]}>
                Macro Distribution
            </Text>

            <View style={styles.chartContainer}>
                <PieChart
                    data={data}
                    width={chartSize}
                    height={chartSize}
                    chartConfig={{
                        color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    hasLegend={false}
                    absolute={false}
                />
            </View>

            {showLegend && (
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: theme.success }]} />
                        <Text style={[styles.legendText, { color: theme.text }]}>
                            Protein: {protein.toFixed(1)}g
                        </Text>
                        {showValues && (
                            <Text style={[styles.legendPercent, { color: theme.subText }]}>
                                ({proteinPercent}%)
                            </Text>
                        )}
                    </View>

                    <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: theme.primary }]} />
                        <Text style={[styles.legendText, { color: theme.text }]}>
                            Carbs: {carbs.toFixed(1)}g
                        </Text>
                        {showValues && (
                            <Text style={[styles.legendPercent, { color: theme.subText }]}>
                                ({carbsPercent}%)
                            </Text>
                        )}
                    </View>

                    <View style={styles.legendItem}>
                        <View style={[styles.legendColor, { backgroundColor: theme.fat }]} />
                        <Text style={[styles.legendText, { color: theme.text }]}>
                            Fat: {fat.toFixed(1)}g
                        </Text>
                        {showValues && (
                            <Text style={[styles.legendPercent, { color: theme.subText }]}>
                                ({fatPercent}%)
                            </Text>
                        )}
                    </View>
                </View>
            )}

            {showValues && (
                <View style={styles.summary}>
                    <Text style={[styles.summaryText, { color: theme.subText }]}>
                        Total: {totalCals.toFixed(0)} kcal from macros
                    </Text>
                </View>
            )}
        </View>
    );
};

MacroRatioPieChart.propTypes = {
    protein: PropTypes.number,
    carbs: PropTypes.number,
    fat: PropTypes.number,
    showLegend: PropTypes.bool,
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    showValues: PropTypes.bool,
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    chartContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    legend: {
        width: '100%',
        paddingHorizontal: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        paddingHorizontal: 4,
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    legendText: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },
    legendPercent: {
        fontSize: 12,
        fontWeight: '400',
    },
    summary: {
        marginTop: 8,
        alignItems: 'center',
    },
    summaryText: {
        fontSize: 12,
        fontStyle: 'italic',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 120,
    },
    emptyText: {
        fontSize: 14,
        fontStyle: 'italic',
    },
});

export default MacroRatioPieChart;