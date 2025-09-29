import { StyleSheet, Text, View } from 'react-native';

export default function HydrationProgress({ currentMl = 0, goalMl = 2000, maxRecommendedMl = 4000 }) {
    const pctRaw = (currentMl / goalMl) * 100;
    const pct = Math.min(100, Math.round(pctRaw));
    const progressWidth = `${Math.min(100, Math.max(0, pct))}%`;

    // thresholds
    const danger = currentMl > maxRecommendedMl;
    const good = pct >= 70 && !danger;
    const warn = !good && !danger && pct >= 40;

    const fillColor = danger ? '#ef4444' : good ? '#10b981' : warn ? '#f59e0b' : '#3b82f6';

    return (
        <View style={styles.container}>
            <View style={styles.left}>
                <Text style={styles.icon}>💧</Text>
                <View style={{ marginLeft: 8 }}>
                    <Text style={styles.title}>Hydration</Text>
                    <Text style={styles.sub}>{currentMl} / {goalMl} ml</Text>
                </View>
            </View>

            <View style={styles.barWrap}>
                <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: progressWidth, backgroundColor: fillColor }]} />
                </View>
                <Text style={[styles.pct, { color: danger ? '#ef4444' : '#111' }]}>{pct}%</Text>
            </View>

            {danger ? (
                <Text style={styles.danger}>Caution: you've exceeded the recommended daily maximum ({maxRecommendedMl} ml)</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { width: '100%', marginTop: 12, alignItems: 'flex-start' },
    left: { flexDirection: 'row', alignItems: 'center' },
    icon: { fontSize: 22 },
    title: { fontWeight: '700' },
    sub: { color: '#666', fontSize: 12 },
    barWrap: { width: '100%', marginTop: 8, alignItems: 'center', flexDirection: 'row' },
    barBg: { flex: 1, height: 10, backgroundColor: '#eef6ff', borderRadius: 8, overflow: 'hidden' },
    barFill: { height: 10, backgroundColor: '#3b82f6' },
    pct: { marginLeft: 10, fontWeight: '700' },
    danger: { color: '#ef4444', fontWeight: '700' },
});
