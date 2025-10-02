import { Dimensions, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useTheme } from './ui/ThemeProvider';

const screenWidth = Dimensions.get('window').width;

const DailyCalorieChart = ({ data }) => {
    const { theme } = useTheme();
    const labels = data.map(d => d.meal);
    const values = data.map(d => d.calories);

    return (
        <View>
            <Text style={{ fontSize: 18, marginBottom: 10, color: theme.text }}>Calories Per Meal</Text>
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
                    color: (opacity = 1) => theme.success,
                    labelColor: () => theme.subText,
                }}
                style={{
                    borderRadius: 12,
                }}
            />
        </View>
    );
};

export default DailyCalorieChart;
