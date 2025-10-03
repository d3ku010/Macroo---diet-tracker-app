import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from './ThemeProvider';

const labelMap = {
    cyber: 'Cyber',
    vapor: 'Vapor',
    solar: 'Solar'
};

// preview swatch colors (light-mode primary used for each palette)
const previewColor = {
    cyber: '#0077ff',
    vapor: '#ff2db4',
    solar: '#ff8f00'
};

export default function PaletteSwitcher({ compact = true }) {
    const { paletteName, setPalette, palettesList, theme } = useTheme();
    return (
        <View style={[styles.container, compact ? styles.compact : null]}>
            {palettesList.map((p) => {
                const active = p === paletteName;
                return (
                    <TouchableOpacity
                        key={p}
                        onPress={() => setPalette(p)}
                        style={[
                            styles.btn,
                            {
                                backgroundColor: active ? theme.primary : 'transparent',
                                borderColor: theme.muted,
                            },
                        ]}
                        accessibilityLabel={`Switch to ${p} palette`}
                    >
                        <View style={styles.row}>
                            <View style={[styles.swatch, { backgroundColor: previewColor[p] || '#999' }]} />
                            <Text style={[styles.label, { color: active ? theme.onPrimary : theme.text }]}>
                                {labelMap[p] || p}
                            </Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: 8,
        alignItems: 'center',
    },
    compact: {
        gap: 6,
    },
    btn: {
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 14,
        borderWidth: 1,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 6,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    swatch: { width: 12, height: 12, borderRadius: 6, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.12)' }
});
