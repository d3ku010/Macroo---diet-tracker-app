import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import ResponsiveCard, { StatsCard } from '../../components/layout/ResponsiveCard';
import ResponsiveLayout from '../../components/layout/ResponsiveLayout';
import SegmentedControl from '../../components/ui/SegmentedControl';
import { useTheme } from '../../components/ui/ThemeProvider';
import { getMeals } from '../../utils/supabaseStorage';
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
    const [dateModalVisible, setDateModalVisible] = useState(false);
    const [dateInput, setDateInput] = useState('');
    const chartAnim = useRef(new Animated.Value(0)).current;

    const load = async () => {
        const all = await getMeals();
        const entries = all || [];
        setMeals(entries);

        // DAILY totals for selectedDate
        const dayStr = selectedDate.toISOString().slice(0, 10);
        const dayMeals = entries.filter(m => m.date === dayStr);
        const sumCal = Math.round(dayMeals.reduce((s, m) => s + (m.calories || 0), 0));
        const sumP = Math.round(dayMeals.reduce((s, m) => s + (m.protein || 0), 0));
        const sumC = Math.round(dayMeals.reduce((s, m) => s + (m.carbs || 0), 0));
        const sumF = Math.round(dayMeals.reduce((s, m) => s + (m.fat || 0), 0));
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
            const dayMeals = entries.filter(m => m.date === dayKey);
            dataCalories.push(Math.round(dayMeals.reduce((s, m) => s + (m.calories || 0), 0)));
            dataProtein.push(Math.round(dayMeals.reduce((s, m) => s + (m.protein || 0), 0)));
            dataCarbs.push(Math.round(dayMeals.reduce((s, m) => s + (m.carbs || 0), 0)));
            dataFat.push(Math.round(dayMeals.reduce((s, m) => s + (m.fat || 0), 0)));
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

    const mealsForSelected = meals.filter(m => m.date === selectedDate.toISOString().slice(0, 10));

    return (
        <ResponsiveLayout>
            <Text style={[styles.heading, { color: theme.text }]}>📊 Nutrition History</Text>

            {/* Date Selection Card */}
            <ResponsiveCard size="large" style={{ marginBottom: 16 }}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>📅 Selected Date</Text>
                </View>

                <TouchableOpacity
                    onPress={() => setDateModalVisible(true)}
                    style={[styles.dateSelector, { backgroundColor: theme.background, borderColor: theme.primary, cursor: Platform.OS === 'web' ? 'pointer' : 'default' }]}
                >
                    <Text style={[styles.selectedDateText, { color: theme.text }]}>
                        {selectedDate.toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        })}
                    </Text>
                    <Text style={[styles.tapHint, { color: theme.subText }]}>Tap to change date</Text>
                </TouchableOpacity>

                <View style={styles.dateNavigation}>
                    <TouchableOpacity onPress={prevDay} style={[styles.navButton, { backgroundColor: theme.background, borderColor: theme.primary }]}>
                        <Text style={[styles.navButtonText, { color: theme.primary }]}>← Previous</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={nextDay} style={[styles.navButton, { backgroundColor: theme.background, borderColor: theme.primary }]}>
                        <Text style={[styles.navButtonText, { color: theme.primary }]}>Next →</Text>
                    </TouchableOpacity>
                </View>
            </ResponsiveCard>

            {/* Daily Stats Card */}
            <ResponsiveCard size="large" style={{ marginBottom: 16 }}>
                <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>📈 Daily Summary</Text>
                </View>

                <View style={styles.statsGrid}>
                    <StatsCard
                        label="🔥 Calories"
                        value={`${dailyTotals.calories} kcal`}
                        color={theme.danger}
                    />
                    <StatsCard
                        label="💪 Protein"
                        value={`${dailyTotals.protein} g`}
                        color={theme.success}
                    />
                    <StatsCard
                        label="🍞 Carbs"
                        value={`${dailyTotals.carbs} g`}
                        color={theme.primary}
                    />
                    <StatsCard
                        label="🥑 Fat"
                        value={`${dailyTotals.fat} g`}
                        color={theme.fat}
                    />
                </View>

                {/* Daily Meals Section */}
                <View style={styles.dailyMealsSection}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>🍽️ Daily Meals</Text>
                    {mealsForSelected.length === 0 ? <Text style={{ marginTop: 8, color: theme.subText }}>No meals for this day.</Text> : (
                        mealsForSelected.map((m, i) => (
                            <View key={i} style={{ marginTop: 8 }}>
                                <Text style={{ fontWeight: '700', color: theme.text }}>{m.mealType} • {m.foodName}</Text>
                                <Text style={{ color: theme.text }}>{(m.calories || 0).toFixed(1)} kcal</Text>
                            </View>
                        ))
                    )}
                </View>
            </ResponsiveCard>

            <ResponsiveCard size="large" style={{ marginBottom: 16 }}>
                <Text style={[styles.heading, { marginTop: 0, marginBottom: 16, color: theme.text }]}>Monthly Chart</Text>

                {/* Filters placed directly under the Monthly Chart heading as requested */}
                <View style={{ marginBottom: 16 }}>
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
                                        <TouchableOpacity onPress={() => setDateModalVisible(false)} style={{ padding: 8, cursor: Platform.OS === 'web' ? 'pointer' : 'default' }}><Text style={{ color: theme.subText }}>Cancel</Text></TouchableOpacity>
                                        <TouchableOpacity onPress={() => {
                                            const d = new Date(dateInput);
                                            if (!isNaN(d)) {
                                                setSelectedDate(d);
                                                setDateModalVisible(false);
                                                load();
                                            } else {
                                                setDateInput(selectedDate.toISOString().slice(0, 10));
                                            }
                                        }} style={{ padding: 8, cursor: Platform.OS === 'web' ? 'pointer' : 'default' }}><Text style={{ color: theme.primary }}>Go</Text></TouchableOpacity>
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
            </ResponsiveCard>

        </ResponsiveLayout>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    heading: {
        fontSize: screenWidth < 380 ? 20 : 22,
        fontWeight: '800',
        marginBottom: 16,
        marginTop: 8,
        textAlign: 'center'
    },
    card: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3
    },
    cardHeader: {
        marginBottom: 12,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    dateSelector: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 12,
        alignItems: 'center',
    },
    selectedDateText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    tapHint: {
        fontSize: 12,
    },
    dateNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    navButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    navButtonText: {
        fontWeight: '600',
    },
    statsGrid: {
        flexDirection: screenWidth < 380 ? 'column' : 'row',
        justifyContent: 'space-between',
        gap: screenWidth < 380 ? 8 : 8,
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        fontWeight: '800',
        fontSize: 20,
    },
    statUnit: {
        fontSize: 10,
        marginTop: 2,
    },
    dailyMealsSection: {
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    chartCard: { padding: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 },
    pill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 999,
        minWidth: 64,
        alignItems: 'center',
        cursor: Platform.OS === 'web' ? 'pointer' : 'default',
    },
    pillActive: {},
    pillText: {
        fontWeight: '700',
        userSelect: Platform.OS === 'web' ? 'none' : 'auto',
    },
    pillTextActive: {
        fontWeight: '700',
        userSelect: Platform.OS === 'web' ? 'none' : 'auto',
    },
    navBtn: {
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        cursor: Platform.OS === 'web' ? 'pointer' : 'default',
    }
});
