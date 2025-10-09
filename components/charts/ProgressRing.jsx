import PropTypes from 'prop-types';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { useTheme } from '../ui/ThemeProvider';

const ProgressRing = ({
    current = 0,
    target = 1,
    size = 120,
    strokeWidth = 8,
    label = '',
    unit = '',
    color,
    showPercentage = true,
    animated = true
}) => {
    const { theme } = useTheme();
    const progress = target > 0 ? Math.min(current / target, 1) : 0;
    const percentage = Math.round(progress * 100);

    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference * (1 - progress);

    const ringColor = color || (
        progress >= 1 ? theme.success :
            progress >= 0.7 ? theme.primary :
                progress >= 0.4 ? theme.fat :
                    theme.danger
    );

    return (
        <View style={[styles.container, { width: size, height: size }]}>
            <Svg
                width={size}
                height={size}
                style={styles.svg}
            >
                {/* Background circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={theme.muted}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />

                {/* Progress circle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke={ringColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={animated ? strokeDashoffset : circumference * (1 - progress)}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                    style={{
                        transition: animated ? 'stroke-dashoffset 0.5s ease-in-out' : 'none'
                    }}
                />
            </Svg>

            <View style={styles.content}>
                <Text style={[styles.value, { color: theme.text }]}>
                    {current.toFixed(current < 10 ? 1 : 0)}
                </Text>
                {unit && (
                    <Text style={[styles.unit, { color: theme.subText }]}>
                        {unit}
                    </Text>
                )}
                {showPercentage && (
                    <Text style={[styles.percentage, { color: ringColor }]}>
                        {percentage}%
                    </Text>
                )}
                {label && (
                    <Text style={[styles.label, { color: theme.subText }]}>
                        {label}
                    </Text>
                )}
                <Text style={[styles.target, { color: theme.subText }]}>
                    / {target.toFixed(0)}
                </Text>
            </View>
        </View>
    );
};

ProgressRing.propTypes = {
    current: PropTypes.number,
    target: PropTypes.number,
    size: PropTypes.number,
    strokeWidth: PropTypes.number,
    label: PropTypes.string,
    unit: PropTypes.string,
    color: PropTypes.string,
    showPercentage: PropTypes.bool,
    animated: PropTypes.bool,
};

// Multi-ring component for showing multiple metrics
const MultiProgressRing = ({ metrics = [], size = 140 }) => {
    const { theme } = useTheme();

    if (metrics.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: theme.subText }]}>
                    No data available
                </Text>
            </View>
        );
    }

    const strokeWidth = 6;
    const ringSpacing = 8;

    return (
        <View style={[styles.multiContainer, { width: size, height: size }]}>
            <Svg width={size} height={size} style={styles.svg}>
                {metrics.map((metric, index) => {
                    const radius = (size - strokeWidth) / 2 - (index * ringSpacing);
                    const circumference = 2 * Math.PI * radius;
                    const progress = metric.target > 0 ? Math.min(metric.current / metric.target, 1) : 0;
                    const strokeDashoffset = circumference * (1 - progress);

                    const ringColor = metric.color || (
                        progress >= 1 ? theme.success :
                            progress >= 0.7 ? theme.primary :
                                progress >= 0.4 ? theme.fat :
                                    theme.danger
                    );

                    return (
                        <G key={metric.label}>
                            {/* Background circle */}
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke={theme.muted}
                                strokeWidth={strokeWidth}
                                fill="transparent"
                                opacity={0.3}
                            />
                            {/* Progress circle */}
                            <Circle
                                cx={size / 2}
                                cy={size / 2}
                                r={radius}
                                stroke={ringColor}
                                strokeWidth={strokeWidth}
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                            />
                        </G>
                    );
                })}
            </Svg>

            <View style={styles.multiContent}>
                <Text style={[styles.multiTitle, { color: theme.text }]}>
                    Daily Goals
                </Text>
                {metrics.map((metric, index) => (
                    <View key={metric.label} style={styles.metricRow}>
                        <View style={[
                            styles.metricDot,
                            { backgroundColor: metric.color || theme.primary }
                        ]} />
                        <Text style={[styles.metricLabel, { color: theme.subText }]}>
                            {metric.label}
                        </Text>
                        <Text style={[styles.metricValue, { color: theme.text }]}>
                            {Math.round((metric.current / metric.target) * 100)}%
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

MultiProgressRing.propTypes = {
    metrics: PropTypes.arrayOf(PropTypes.shape({
        label: PropTypes.string.isRequired,
        current: PropTypes.number.isRequired,
        target: PropTypes.number.isRequired,
        color: PropTypes.string,
    })),
    size: PropTypes.number,
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    multiContainer: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
    },
    svg: {
        position: 'absolute',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    multiContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    value: {
        fontSize: 24,
        fontWeight: '700',
    },
    unit: {
        fontSize: 12,
        marginTop: -2,
    },
    percentage: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 2,
    },
    label: {
        fontSize: 10,
        textAlign: 'center',
        marginTop: 2,
    },
    target: {
        fontSize: 10,
        marginTop: 1,
    },
    multiTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    metricRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
        width: '100%',
    },
    metricDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginRight: 8,
    },
    metricLabel: {
        flex: 1,
        fontSize: 10,
    },
    metricValue: {
        fontSize: 10,
        fontWeight: '600',
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

export { MultiProgressRing, ProgressRing };
export default ProgressRing;