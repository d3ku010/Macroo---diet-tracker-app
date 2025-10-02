import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from './ui/ThemeProvider';

export default function HydrationProgress({ currentMl = 0, goalMl = 2000, maxRecommendedMl = 4000 }) {
    const { theme } = useTheme();
    const pctRaw = (goalMl > 0) ? (currentMl / goalMl) * 100 : 0;
    const pct = Math.round(pctRaw);
    const displayPct = pct > 100 ? pct : Math.min(100, Math.max(0, pct));
    const progressWidth = `${Math.min(100, Math.max(0, displayPct))}%`;

    // thresholds
    const danger = currentMl > maxRecommendedMl;
    const good = pct >= 70 && !danger;
    const warn = !good && !danger && pct >= 40;

    const fillColor = danger ? theme.danger : good ? theme.success : warn ? theme.fat : theme.primary;

    return (
        <View style={styles.container}>
            <View style={styles.left}>
                <Ionicons name="water" size={22} color={theme.primary} />
                <View style={{ marginLeft: 8 }}>
                    <Text style={[styles.title, { color: theme.text }]}>Hydration</Text>
                    <Text style={[styles.sub, { color: theme.subText }]}>{currentMl} / {goalMl} ml</Text>
                </View>
            </View>

            <View style={styles.barWrap}>
                <View style={[styles.barBg, { backgroundColor: theme.muted }]}>
                    <View style={[styles.barFill, { width: progressWidth, backgroundColor: fillColor }]} />
                </View>
                <Text style={[styles.pct, { color: danger ? theme.danger : theme.text }]}>{pct}%</Text>
            </View>

            {danger ? (
                <Text style={[styles.danger, { color: theme.danger }]}>Caution: you've exceeded the recommended daily maximum ({maxRecommendedMl} ml)</Text>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { width: '100%', marginTop: 12, alignItems: 'flex-start' },
    left: { flexDirection: 'row', alignItems: 'center' },
    icon: { fontSize: 22 },
    title: { fontWeight: '700' },
    sub: { fontSize: 12 },
    barWrap: { width: '100%', marginTop: 8, alignItems: 'center', flexDirection: 'row' },
    barBg: { flex: 1, height: 10, borderRadius: 8, overflow: 'hidden' },
    barFill: { height: 10 },
    pct: { marginLeft: 10, fontWeight: '700' },
    danger: { fontWeight: '700' },
});
