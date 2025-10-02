import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import SegmentedControl from '../../components/ui/SegmentedControl';
import { useTheme } from '../../components/ui/ThemeProvider';
import { getMeals } from '../../utils/storage';
let DateTimePicker = null;
try {
    // optional dependency - use if available
    DateTimePicker = require('@react-native-community/datetimepicker').default;
} catch (e) {
    DateTimePicker = null;
}

const screenWidth = Dimensions.get('window').width;

export default function MonthlyScreen() {
    const { theme } = useTheme();
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [meals, setMeals] = useState([]);
    const [chartData, setChartData] = useState(null);
    const [nutrient, setNutrient] = useState('all');
    const [viewMode, setViewMode] = useState('month'); // 'month' or 'day' or 'all'
    const [dailyTotals, setDailyTotals] = useState({ calories: 0, protein: 0, carbs: 0, fat: 0 });
    const chartAnim = useRef(new Animated.Value(0)).current;

    const load = async () => {
        const all = await getMeals();
        const entries = all || [];
        setMeals(entries);

        // DAILY totals for selectedDate
        const dayStr = selectedDate.toISOString().slice(0, 10);
        const dayMeals = entries.filter(m => m.timestamp?.startsWith(dayStr));
        const sumCal = Math.round(dayMeals.reduce((s, m) => s + (m.nutrients?.calories || 0), 0));
        const sumP = Math.round(dayMeals.reduce((s, m) => s + (m.nutrients?.protein || 0), 0));
        const sumC = Math.round(dayMeals.reduce((s, m) => s + (m.nutrients?.carbs || 0), 0));
        const sumF = Math.round(dayMeals.reduce((s, m) => s + (m.nutrients?.fat || 0), 0));
        setDailyTotals({ calories: sumCal, protein: sumP, carbs: sumC, fat: sumF });

        // MONTHLY (last 30 days) chart build
        const labels = [];
        const dataCalories = [];
        const dataProtein = [];
        const dataCarbs = [];
        const dataFat = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayKey = d.toISOString().slice(0, 10);
            const dayMeals = entries.filter(m => m.timestamp?.startsWith(dayKey));
            dataCalories.push(Math.round(dayMeals.reduce((s, m) => s + (m.nutrients?.calories || 0), 0)));
            dataProtein.push(Math.round(dayMeals.reduce((s, m) => s + (m.nutrients?.protein || 0), 0)));
            dataCarbs.push(Math.round(dayMeals.reduce((s, m) => s + (m.nutrients?.carbs || 0), 0)));
            dataFat.push(Math.round(dayMeals.reduce((s, m) => s + (m.nutrients?.fat || 0), 0)));
            const dd = String(d.getDate()).padStart(2, '0');
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            labels.push(i % 5 === 0 ? `${dd}/${mm}` : '');
        }

        // Only show macro nutrients (protein/carbs/fat) on the chart
        const datasets = [];
        if (nutrient === 'all' || nutrient === 'protein') datasets.push({ data: dataProtein, color: () => theme.success, strokeWidth: 2 });
        if (nutrient === 'all' || nutrient === 'carbs') datasets.push({ data: dataCarbs, color: () => theme.primary, strokeWidth: 2 });
        if (nutrient === 'all' || nutrient === 'fat') datasets.push({ data: dataFat, color: () => theme.fat, strokeWidth: 2 });

        const flat = datasets.length ? [].concat(...datasets.map(s => s.data)) : [0];
        const rawMax = Math.max(...flat, 0);
        const paddedMax = Math.ceil(rawMax * 1.05);
        const step = chooseStep(paddedMax);
        const suggestedMax = Math.ceil(paddedMax / step) * step || step;

        const datasetsWithMax = datasets.slice();
        if (suggestedMax > 0) datasetsWithMax.push({ data: labels.map(() => suggestedMax), color: () => 'rgba(0,0,0,0)', strokeWidth: 0 });
        setChartData({ labels, datasets: datasetsWithMax, legend: [], meta: { yStep: step, yMax: suggestedMax } });
        Animated.timing(chartAnim, { toValue: 1, duration: 360, useNativeDriver: true }).start();
    };

    const chooseStep = (maxVal) => {
        // Prefer steps that are multiples of 5 or 10 to keep the y-axis tidy.
        if (maxVal <= 50) return 5;
        if (maxVal <= 200) return 10;
        if (maxVal <= 1000) return 50;
        return 100;
    };

    useFocusEffect(
        useCallback(() => {
            load();
        }, [])
    );

    // Recompute whenever these change (date, nutrient selection)
    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate, nutrient]);

    const prevDay = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - 1);
        setSelectedDate(d);
    };
    const nextDay = () => {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 1);
        setSelectedDate(d);
    };

    const prevMonth = () => {
        const d = new Date(selectedDate);
        d.setMonth(d.getMonth() - 1);
        setSelectedDate(d);
    };
    const nextMonth = () => {
        const d = new Date(selectedDate);
        d.setMonth(d.getMonth() + 1);
        setSelectedDate(d);
    };

    const mealsForSelected = meals.filter(m => m.timestamp?.startsWith(selectedDate.toISOString().slice(0, 10)));
    const [dateModalVisible, setDateModalVisible] = useState(false);
    const [dateInput, setDateInput] = useState(selectedDate.toISOString().slice(0, 10));

    return (
        <ScrollView style={[styles.container, { backgroundColor: theme.background }]} contentContainerStyle={{ paddingBottom: 140 }}>
            <Text style={[styles.heading, { color: theme.text }]}>Monthly & Daily</Text>

            {/* Daily section */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={{ fontWeight: '700', marginBottom: 8, color: theme.text }}>Daily</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <View>
                        <TouchableOpacity onPress={() => setDateModalVisible(true)} style={{ padding: 6 }}>
                            <Text style={{ fontWeight: '700', color: theme.text }}>{selectedDate.toDateString()}</Text>
                        </TouchableOpacity>
                        <Text style={{ color: theme.subText, fontSize: 12 }}>Tap to select a date</Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity onPress={prevDay} style={[styles.navBtn, { borderColor: theme.muted }]}><Text style={{ color: theme.primary }}>Prev</Text></TouchableOpacity>
                        <TouchableOpacity onPress={nextDay} style={[styles.navBtn, { borderColor: theme.muted }]}><Text style={{ color: theme.primary }}>Next</Text></TouchableOpacity>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                    <View style={{ flex: 1, padding: 8, borderRadius: 10, backgroundColor: theme.background }}>
                        <Text style={{ fontSize: 12, color: theme.subText }}>Calories</Text>
                        <Text style={{ fontWeight: '800', fontSize: 18, color: theme.danger }}>{dailyTotals.calories} kcal</Text>
                    </View>
                    <View style={{ flex: 1, padding: 8, borderRadius: 10, backgroundColor: theme.background }}>
                        <Text style={{ fontSize: 12, color: theme.subText }}>Protein</Text>
                        <Text style={{ fontWeight: '800', fontSize: 18, color: theme.success }}>{dailyTotals.protein} g</Text>
                    </View>
                    <View style={{ flex: 1, padding: 8, borderRadius: 10, backgroundColor: theme.background }}>
                        <Text style={{ fontSize: 12, color: theme.subText }}>Carbs</Text>
                        <Text style={{ fontWeight: '800', fontSize: 18, color: theme.primary }}>{dailyTotals.carbs} g</Text>
                    </View>
                    <View style={{ flex: 1, padding: 8, borderRadius: 10, backgroundColor: theme.background }}>
                        <Text style={{ fontSize: 12, color: theme.subText }}>Fat</Text>
                        <Text style={{ fontWeight: '800', fontSize: 18, color: theme.fat }}>{dailyTotals.fat} g</Text>
                    </View>
                </View>

                <View style={{ marginTop: 12 }}>
                    <Text style={{ color: theme.subText }}>Entries for this day</Text>
                    {mealsForSelected.length === 0 ? <Text style={{ marginTop: 8, color: theme.subText }}>No meals for this day.</Text> : (
                        mealsForSelected.map((m, i) => (
                            <View key={i} style={{ marginTop: 8 }}>
                                <Text style={{ fontWeight: '700', color: theme.text }}>{m.type} • {m.food}</Text>
                                <Text style={{ color: theme.text }}>{(m.nutrients?.calories || 0).toFixed(1)} kcal</Text>
                            </View>
                        ))
                    )}
                </View>
            </View>

            <Text style={[styles.heading, { marginTop: 6, color: theme.text }]}>Monthly Chart</Text>

            {/* Filters placed directly under the Monthly Chart heading as requested */}
            <View style={{ marginTop: 8, marginBottom: 12 }}>
                {/* View mode controls: larger, prominent */}
                <View style={{ marginBottom: 8 }}>
                    <SegmentedControl
                        options={[{ key: 'day', label: 'Day' }, { key: 'month', label: '30 Days' }, { key: 'all', label: 'Full' }]}
                        value={viewMode}
                        onChange={(k) => setViewMode(k)}
                        style={{ marginBottom: 8 }}
                    />
                    <SegmentedControl
                        options={[{ key: 'all', label: 'All' }, { key: 'protein', label: 'Protein' }, { key: 'carbs', label: 'Carbs' }, { key: 'fat', label: 'Fat' }]}
                        value={nutrient}
                        onChange={(k) => setNutrient(k)}
                    />
                    {/* integrated 'All' option is now part of the macro segmented control above */}
                </View>

                {/* single segmented control above replaces duplicated macro buttons */}
            </View>
            {/* date picker modal */}
            <Modal visible={dateModalVisible} transparent animationType="fade" onRequestClose={() => setDateModalVisible(false)}>
                <View style={{ flex: 1, backgroundColor: theme.name === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.3)', justifyContent: 'center', padding: 24 }}>
                    <View style={{ backgroundColor: theme.card, borderRadius: 12, padding: 16 }}>
                        <Text style={{ fontWeight: '700', fontSize: 16, marginBottom: 8, color: theme.text }}>Jump to date</Text>
                        {DateTimePicker ? (
                            <DateTimePicker
                                value={selectedDate}
                                mode="date"
                                display={Platform.OS === 'ios' ? 'spinner' : 'calendar'}
                                onChange={(e, d) => {
                                    if (d) {
                                        setSelectedDate(d);
                                        setDateModalVisible(false);
                                        load();
                                    }
                                }}
                                style={{ width: '100%' }}
                            />
                        ) : (
                            <View>
                                <TextInput value={dateInput} onChangeText={setDateInput} placeholder="YYYY-MM-DD" placeholderTextColor={theme.subText} style={{ borderWidth: 1, borderColor: theme.muted, padding: 10, borderRadius: 8, marginBottom: 8, color: theme.text, backgroundColor: theme.card }} />
                                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
                                    <TouchableOpacity onPress={() => setDateModalVisible(false)} style={{ padding: 8 }}><Text style={{ color: theme.subText }}>Cancel</Text></TouchableOpacity>
                                    <TouchableOpacity onPress={() => {
                                        const d = new Date(dateInput);
                                        if (!isNaN(d)) {
                                            setSelectedDate(d);
                                            setDateModalVisible(false);
                                            load();
                                        } else {
                                            setDateInput(selectedDate.toISOString().slice(0, 10));
                                        }
                                    }} style={{ padding: 8 }}><Text style={{ color: theme.primary }}>Go</Text></TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </View>
                </View>
            </Modal>

            {chartData ? (
                <Animated.View style={[styles.chartCard, { opacity: chartAnim }]}>
                    <LineChart
                        data={chartData}
                        width={Math.max(320, screenWidth - 48)}
                        height={280}
                        chartConfig={{
                            backgroundGradientFrom: theme.card,
                            backgroundGradientTo: theme.card,
                            decimalPlaces: 0,
                            color: (opacity = 1) => theme.primary,
                            labelColor: (opacity = 1) => theme.subText,
                            propsForBackgroundLines: { stroke: theme.pillBg },
                            strokeWidth: 2,
                        }}
                        bezier
                        style={{ borderRadius: 12 }}
                        withDots={false}
                        fromZero
                        yLabelsOffset={6}
                        yAxisInterval={chartData?.meta?.yStep || 1}
                        yAxisSuffix=""
                    />
                </Animated.View>
            ) : <Text style={{ color: theme.subText }}>Loading...</Text>}

            <View style={{ height: 24 }} />

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 16 },
    heading: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
    card: { padding: 14, borderRadius: 12 },
    chartCard: { padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    pill: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, minWidth: 64, alignItems: 'center' },
    pillActive: {},
    pillText: { fontWeight: '700' },
    pillTextActive: { fontWeight: '700' },
    navBtn: { borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 }
});
