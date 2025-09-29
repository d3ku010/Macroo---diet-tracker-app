import { Dimensions, Text, View } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

const DailyCalorieChart = ({ data }) => {
    const labels = data.map(d => d.meal);
    const values = data.map(d => d.calories);

    return (
        <View>
            <Text style={{ fontSize: 18, marginBottom: 10 }}>Calories Per Meal</Text>
            <BarChart
                data={{
                    labels,
                    datasets: [{ data: values }],
                }}
                width={screenWidth - 32}
                height={220}
                fromZero
                chartConfig={{
                    backgroundGradientFrom: '#fff',
                    backgroundGradientTo: '#fff',
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
                    labelColor: () => '#333',
                }}
                style={{
                    borderRadius: 12,
                }}
            />
        </View>
    );
};

export default DailyCalorieChart;
