import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import { Appearance, Text } from 'react-native';

const ThemeContext = createContext();

const light = {
    name: 'light',
    // soft, retro-90s pastel base for light mode
    background: '#fff9fb', // pale, warm lavender-cream
    card: '#ffffff',
    // deep indigo text for readability on the pale background
    text: '#0b0622',
    subText: '#6a5aa8',
    // softened purple accent for better legibility
    primary: '#6b57e6',
    // text color to use on top of primary backgrounds
    onPrimary: '#ffffff',
    // complementary accents
    success: '#17c89f',
    danger: '#e96f9c',
    muted: '#f6f3fb',
    pillBg: '#efe7ff',
    fat: '#e08db6',
};

const dark = {
    name: 'dark',
    // deep near-black with a tiny purple cast for that neon-on-black feeling
    background: '#07020f',
    card: '#0f0718',
    // slightly warmer icy-blue text to sit on top of the deep background
    text: '#e9f1ff',
    subText: '#a3b0ff',
    // softened neon purple with a bit more warmth
    primary: '#7e6bf0',
    // text color used on top of primary backgrounds (keep high contrast)
    onPrimary: '#ffffff',
    // neon success & danger to fit retro palette
    success: '#34d6a8',
    danger: '#e97aa8',
    // subtle muted/card accents
    muted: '#141024',
    pillBg: '#120a2a',
    fat: '#9be6d9',
};

export function ThemeProvider({ children }) {
    const colorScheme = Appearance.getColorScheme?.() || 'light';
    const [theme, setThemeState] = useState(colorScheme === 'dark' ? dark : light);

    // keep a reference to previous Text.defaultProps.style so we can restore it
    useEffect(() => {
        const prev = Text.defaultProps?.style;
        // ensure defaultProps exists
        if (!Text.defaultProps) Text.defaultProps = {};
        // Apply theme text color as a global default for Text when not explicitly set.
        // This helps prevent dark/black text from showing on dark backgrounds.
        Text.defaultProps.style = [prev, { color: theme.text }];
        return () => {
            // restore previous value when theme provider unmounts or before next effect
            Text.defaultProps.style = prev;
        };
    }, [theme]);

    useEffect(() => {
        (async () => {
            try {
                const saved = await AsyncStorage.getItem('ui_theme');
                if (saved) {
                    setThemeState(saved === 'dark' ? dark : light);
                    return;
                }
            } catch (e) {
                // ignore
            }
            const sub = Appearance.addChangeListener?.(({ colorScheme: cs }) => {
                setThemeState(cs === 'dark' ? dark : light);
            });
            return () => sub?.remove?.();
        })();
    }, []);

    const setTheme = async (name) => {
        try {
            await AsyncStorage.setItem('ui_theme', name);
        } catch (e) {
            // ignore
        }
        setThemeState(name === 'dark' ? dark : light);
    };

    const toggle = () => {
        setThemeState((t) => {
            const next = t.name === 'dark' ? light : dark;
            AsyncStorage.setItem('ui_theme', next.name).catch(() => { });
            return next;
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

export default ThemeProvider;
