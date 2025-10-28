import {
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    View
} from 'react-native';
import { spacing } from '../../utils/responsive';
import { useTheme } from '../ui/ThemeProvider';

export default function ResponsiveLayout({
    children,
    scrollable = true,
    keyboardAvoiding = true,
    showsVerticalScrollIndicator = true,
    contentContainerStyle,
    style,
    safeAreaEnabled = true,
    padding = true,
}) {
    // Safely get theme, with fallback if context is not available
    let theme;
    try {
        const themeContext = useTheme();
        theme = themeContext?.theme;
    } catch (e) {
        // If theme context is not available, use default values
        theme = null;
    }

    // Default theme fallback
    const safeTheme = theme || {
        background: '#FFFFFF',
        colors: {
            background: '#FFFFFF'
        }
    };

    const styles = createStyles(safeTheme, padding);

    const content = (
        <View style={[styles.container, style]}>
            {scrollable ? (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[
                        styles.contentContainer,
                        contentContainerStyle
                    ]}
                    showsVerticalScrollIndicator={showsVerticalScrollIndicator}
                    keyboardShouldPersistTaps="handled"
                    bounces={true}
                    overScrollMode="auto"
                >
                    {children}
                </ScrollView>
            ) : (
                <View style={[styles.staticContainer, contentContainerStyle]}>
                    {children}
                </View>
            )}
        </View>
    );

    if (keyboardAvoiding && Platform.OS === 'ios') {
        return (
            <SafeAreaView style={[styles.safeArea, !safeAreaEnabled && { paddingTop: 0 }]}>
                <KeyboardAvoidingView
                    style={styles.keyboardAvoidingView}
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
                >
                    {content}
                </KeyboardAvoidingView>
            </SafeAreaView>
        );
    }

    if (safeAreaEnabled) {
        return (
            <SafeAreaView style={styles.safeArea}>
                {content}
            </SafeAreaView>
        );
    }

    return content;
}

const createStyles = (theme, padding) => StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: theme.background || theme.colors?.background || '#FFFFFF',
    },
    keyboardAvoidingView: {
        flex: 1,
    },
    container: {
        flex: 1,
        backgroundColor: theme.background || theme.colors?.background || '#FFFFFF',
    },
    scrollView: {
        flex: 1,
    },
    contentContainer: {
        flexGrow: 1,
        paddingHorizontal: padding ? spacing.md : 0,
        paddingBottom: spacing.lg,
    },
    staticContainer: {
        flex: 1,
        paddingHorizontal: padding ? spacing.md : 0,
    },
});