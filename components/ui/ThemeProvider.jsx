import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Appearance, Text } from 'react-native';

const ThemeContext = createContext();

// Distinct palettes: cyber (neon cyan), vapor (magenta/cyan), solar (warm amber)
const palettes = {
    cyber: {
        light: {
            name: 'light',
            background: '#f6fbff',
            card: '#ffffff',
            text: '#041228',
            subText: '#3a6b89',
            primary: '#0077ff',
            onPrimary: '#ffffff',
            success: '#00c99a',
            danger: '#ff4e89',
            muted: '#eef6fb',
            pillBg: '#e6f6ff',
            fat: '#ff7a6a',
        },
        dark: {
            name: 'dark',
            background: '#030014',
            card: '#0b0020',
            text: '#e8f6ff',
            subText: '#9fdfff',
            primary: '#00f6ff',
            onPrimary: '#00121a',
            success: '#17e6b8',
            danger: '#ff6ba3',
            muted: '#06102a',
            pillBg: '#03102a',
            fat: '#ffd06b',
        }
    },
    vapor: {
        light: {
            name: 'light',
            background: '#fff7ff',
            card: '#fff1ff',
            text: '#201033',
            subText: '#8f5c8f',
            primary: '#ff2db4',
            onPrimary: '#ffffff',
            success: '#00cfa3',
            danger: '#d94b7a',
            muted: '#fbf0fb',
            pillBg: '#ffe8ff',
            fat: '#ffd36e',
        },
        dark: {
            name: 'dark',
            background: '#090016',
            card: '#160021',
            text: '#ffe8ff',
            subText: '#ffb6ff',
            primary: '#ff4bd9',
            onPrimary: '#2a001b',
            success: '#6ff3d0',
            danger: '#ff7aa6',
            muted: '#14041a',
            pillBg: '#180022',
            fat: '#ffd36e',
        }
    },
    solar: {
        light: {
            name: 'light',
            background: '#fffaf4',
            card: '#fff7ef',
            text: '#2b1f0e',
            subText: '#7a5b3a',
            primary: '#ff8f00',
            onPrimary: '#ffffff',
            success: '#17b68a',
            danger: '#d44b4b',
            muted: '#f7efe6',
            pillBg: '#fff3e0',
            fat: '#e07a5f',
        },
        dark: {
            name: 'dark',
            background: '#0b0700',
            card: '#1a0f00',
            text: '#fff7e6',
            subText: '#ffd89a',
            primary: '#ffb703',
            onPrimary: '#1a1200',
            success: '#7ef0a3',
            danger: '#ff6b6b',
            muted: '#171107',
            pillBg: '#2a1400',
            fat: '#ff8f6b',
        }
    },
    modern: {
        light: {
            name: 'light',
            background: '#F8FAFC',
            card: '#FFFFFF',
            text: '#1E293B',
            subText: '#64748B',
            primary: '#6C5CE7',
            onPrimary: '#FFFFFF',
            success: '#00B894',
            danger: '#E17055',
            muted: '#E2E8F0',
            pillBg: '#F1F5F9',
            fat: '#FDCB6E',
        },
        dark: {
            name: 'dark',
            background: '#0F172A',
            card: '#1E293B',
            text: '#F8FAFC',
            subText: '#94A3B8',
            primary: '#A29BFE',
            onPrimary: '#1E293B',
            success: '#00CEC9',
            danger: '#FD79A8',
            muted: '#334155',
            pillBg: '#475569',
            fat: '#FDCB6E',
        }
    }
};

export function ThemeProvider({ children }) {
    const colorScheme = Appearance.getColorScheme?.() || 'light';
    // paletteName persisted separately; default to 'cyber'
    const [paletteName, setPaletteName] = useState('cyber');

    // build active theme tokens by combining selected palette + color scheme
    const activeTokens = useMemo(() => {
        const mode = colorScheme === 'dark' ? 'dark' : 'light';
        const pal = palettes[paletteName] || palettes.retro;
        return pal[mode];
    }, [paletteName, colorScheme]);

    const [theme, setThemeState] = useState(activeTokens);

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
                const savedTheme = await AsyncStorage.getItem('ui_theme');
                const savedPalette = await AsyncStorage.getItem('ui_palette');
                if (savedPalette && palettes[savedPalette]) setPaletteName(savedPalette);
                if (savedTheme) {
                    // savedTheme holds 'dark' | 'light' previously
                    setThemeState(savedTheme === 'dark' ? palettes[paletteName].dark : palettes[paletteName].light);
                    return;
                }
            } catch (e) {
                // ignore
            }
            const sub = Appearance.addChangeListener?.(({ colorScheme: cs }) => {
                setThemeState(cs === 'dark' ? palettes[paletteName].dark : palettes[paletteName].light);
            });
            return () => sub?.remove?.();
        })();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const setTheme = async (name) => {
        try {
            await AsyncStorage.setItem('ui_theme', name);
        } catch (e) {
            // ignore
        }
        setThemeState(name === 'dark' ? palettes[paletteName].dark : palettes[paletteName].light);
    };

    const toggle = () => {
        setThemeState((t) => {
            const nextName = t.name === 'dark' ? 'light' : 'dark';
            AsyncStorage.setItem('ui_theme', nextName).catch(() => { });
            const next = nextName === 'dark' ? palettes[paletteName].dark : palettes[paletteName].light;
            return next;
        });
    };

    // change palette and persist
    const setPalette = async (pName) => {
        if (!palettes[pName]) return;
        try {
            await AsyncStorage.setItem('ui_palette', pName);
        } catch (e) {
            // ignore
        }
        setPaletteName(pName);
        // update theme tokens to match current color scheme
        const mode = colorScheme === 'dark' ? 'dark' : 'light';
        setThemeState(palettes[pName][mode]);
    };

    return (
        <ThemeContext.Provider value={{ theme, setTheme, toggle, paletteName, setPalette, palettesList: Object.keys(palettes) }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    return useContext(ThemeContext);
}

export default ThemeProvider;
