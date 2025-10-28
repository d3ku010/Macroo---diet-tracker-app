import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import PrimaryButton from './ui/PrimaryButton';
import { useTheme } from './ui/ThemeProvider';

export default function HydrationProgress({ currentMl = 0, goalMl = 2000, maxRecommendedMl = 4000, onAddWater }) {
    const { theme } = useTheme();
    const [showWaterModal, setShowWaterModal] = useState(false);
    const [waterAmount, setWaterAmount] = useState('250');

    const pctRaw = (goalMl > 0) ? (currentMl / goalMl) * 100 : 0;
    const pct = Math.round(pctRaw);
    const displayPct = pct > 100 ? pct : Math.min(100, Math.max(0, pct));
    const progressWidth = `${Math.min(100, Math.max(0, displayPct))}%`;

    // thresholds
    const danger = currentMl > maxRecommendedMl;
    const good = pct >= 70 && !danger;
    const warn = !good && !danger && pct >= 40;

    const fillColor = danger ? theme.danger : good ? theme.success : warn ? theme.fat : theme.primary;

    const handleAddWater = async () => {
        if (onAddWater) {
            const amount = parseInt(waterAmount) || 250;
            await onAddWater(amount);
            setShowWaterModal(false);
        }
    };

    return (
        <>
            <View style={styles.container}>
                <View style={styles.left}>
                    <Ionicons name="water" size={22} color={theme.primary} />
                    <View style={{ marginLeft: 8 }}>
                        <Text style={[styles.title, { color: theme.text }]}>Hydration</Text>
                        <Text style={[styles.sub, { color: theme.subText }]}>{currentMl} / {goalMl} ml</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.addWaterButton, { backgroundColor: theme.primary }]}
                        onPress={() => setShowWaterModal(true)}
                    >
                        <Ionicons name="add" size={18} color="white" />
                    </TouchableOpacity>
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

            <Modal visible={showWaterModal} animationType="slide" transparent={true} onRequestClose={() => setShowWaterModal(false)}>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                        <Text style={[styles.modalTitle, { color: theme.text }]}>Add Water</Text>
                        <Text style={[styles.modalSubtitle, { color: theme.subText }]}>Enter the amount of water you drank</Text>

                        <TextInput
                            value={waterAmount}
                            onChangeText={setWaterAmount}
                            placeholder="Amount (ml)"
                            keyboardType="numeric"
                            style={[styles.waterInput, { borderColor: theme.muted, color: theme.text, backgroundColor: theme.background }]}
                            placeholderTextColor={theme.subText}
                        />

                        <View style={styles.quickButtons}>
                            {[250, 500, 750, 1000].map(amount => (
                                <TouchableOpacity
                                    key={amount}
                                    style={[styles.quickButton, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}
                                    onPress={() => setWaterAmount(amount.toString())}
                                >
                                    <Text style={[styles.quickButtonText, { color: theme.primary }]}>{amount}ml</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalButtons}>
                            <PrimaryButton
                                title="Cancel"
                                onPress={() => setShowWaterModal(false)}
                                style={[styles.modalButton, { backgroundColor: theme.muted }]}
                                textStyle={{ color: theme.text }}
                            />
                            <PrimaryButton
                                title="Add Water"
                                onPress={handleAddWater}
                                style={[styles.modalButton, { backgroundColor: theme.primary }]}
                            />
                        </View>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    container: { width: '100%', marginTop: 12, alignItems: 'flex-start' },
    left: { flexDirection: 'row', alignItems: 'center', flex: 1 },
    icon: { fontSize: 22 },
    title: { fontWeight: '700' },
    sub: { fontSize: 12 },
    addWaterButton: {
        marginLeft: 'auto',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    barWrap: { width: '100%', marginTop: 8, alignItems: 'center', flexDirection: 'row' },
    barBg: { flex: 1, height: 10, borderRadius: 8, overflow: 'hidden' },
    barFill: { height: 10 },
    pct: { marginLeft: 10, fontWeight: '700' },
    danger: { fontWeight: '700' },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        borderRadius: 12,
        padding: 20,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    modalSubtitle: {
        fontSize: 14,
        marginBottom: 16,
    },
    waterInput: {
        borderWidth: 1,
        padding: 12,
        borderRadius: 8,
        marginBottom: 16,
        fontSize: 16,
    },
    quickButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    quickButton: {
        flex: 1,
        padding: 8,
        borderRadius: 6,
        borderWidth: 1,
        alignItems: 'center',
        marginHorizontal: 2,
    },
    quickButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalButton: {
        flex: 1,
    },
});