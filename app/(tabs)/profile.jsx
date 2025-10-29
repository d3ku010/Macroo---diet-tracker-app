import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import ExportBackupManager from '../../components/forms/ExportBackupManager';
import ResponsiveCard from '../../components/layout/ResponsiveCard';
import ResponsiveLayout from '../../components/layout/ResponsiveLayout';
import HamburgerMenu, { MenuItem, MenuSection } from '../../components/navigation/HamburgerMenu';
import ThemeDialog from '../../components/ui/ThemeDialog';
import { useTheme } from '../../components/ui/ThemeProvider';
import { getProfile, saveProfile } from '../../utils/storage';

const ProfileScreen = () => {
    const { theme, toggle, paletteName, setPalette, palettesList } = useTheme();
    const router = useRouter();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showExportModal, setShowExportModal] = useState(false);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [themeDialogOpen, setThemeDialogOpen] = useState(false);

    useEffect(() => {
        loadUserProfile();
    }, []);

    const loadUserProfile = async () => {
        try {
            const userData = await getProfile();
            if (userData) {
                setProfile(userData);
            } else {
                // Set default profile
                const defaultProfile = {
                    name: 'User',
                    age: 25,
                    gender: 'other',
                    height: 170,
                    weight: 70,
                    activityLevel: 'moderate',
                    goal: 'maintain',
                    dailyCaloriesTarget: 2000,
                    dailyWaterTarget: 8,
                };
                setProfile(defaultProfile);
                await saveProfile(defaultProfile);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const showEditProfile = () => {
        Alert.alert(
            'Edit Profile',
            'Profile editing feature coming soon!',
            [{ text: 'OK' }]
        );
    };

    const handleNotificationToggle = (value) => {
        setNotificationsEnabled(value);
        // Save to storage
        AsyncStorage.setItem('notificationsEnabled', JSON.stringify(value));
    };

    const handleDataImported = () => {
        loadUserProfile();
        setShowExportModal(false);
        Alert.alert('Success', 'Data imported successfully! Please restart the app to see all changes.');
    };

    const ProfileItem = ({ icon, label, value, onPress, rightElement }) => (
        <TouchableOpacity
            style={[styles.profileItem, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={onPress}
        >
            <View style={styles.profileItemLeft}>
                <Ionicons name={icon} size={20} color={theme.primary} />
                <Text style={[styles.profileItemLabel, { color: theme.text }]}>
                    {label}
                </Text>
            </View>
            <View style={styles.profileItemRight}>
                {rightElement || (
                    <>
                        {value && (
                            <Text style={[styles.profileItemValue, { color: theme.subText }]}>
                                {value}
                            </Text>
                        )}
                        <Ionicons name="chevron-forward" size={16} color={theme.subText} />
                    </>
                )}
            </View>
        </TouchableOpacity>
    );

    if (!profile) {
        return (
            <View style={[styles.container, styles.loading, { backgroundColor: theme.background }]}>
                <Text style={[styles.loadingText, { color: theme.text }]}>Loading profile...</Text>
            </View>
        );
    }

    return (
        <ResponsiveLayout>
            <HamburgerMenu
                visible={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
            >
                <MenuSection title="Settings">
                    <MenuItem
                        icon="color-palette-outline"
                        title="Theme & Colors"
                        subtitle={`${paletteName.charAt(0).toUpperCase() + paletteName.slice(1)} - ${theme.name === 'dark' ? 'Dark' : 'Light'} mode`}
                        onPress={() => {
                            setThemeDialogOpen(true);
                            setIsMenuOpen(false);
                        }}
                    />
                </MenuSection>                <MenuSection title="Data">
                    <MenuItem
                        icon="download-outline"
                        title="Export Data"
                        subtitle="Backup your information"
                        onPress={() => {
                            setShowExportModal(true);
                            setIsMenuOpen(false);
                        }}
                    />
                </MenuSection>
                <MenuSection title="Support">
                    <MenuItem
                        icon="help-circle-outline"
                        title="Help & Support"
                        subtitle="Get assistance"
                        onPress={() => {
                            Alert.alert('Help', 'Contact support at help@diettracker.com');
                            setIsMenuOpen(false);
                        }}
                    />
                </MenuSection>
            </HamburgerMenu>            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => setIsMenuOpen(true)}
                    style={styles.menuButton}
                >
                    <Ionicons name="menu" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Profile Summary */}
            <ResponsiveCard size="large" style={{ marginBottom: 16 }}>
                <View style={styles.profileSummaryContent}>
                    <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                        <Text style={styles.avatarText}>
                            {profile.name.charAt(0).toUpperCase()}
                        </Text>
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, { color: theme.text }]}>
                            {profile.name}
                        </Text>
                        <Text style={[styles.profileSubtitle, { color: theme.subText }]}>
                            Goal: {profile.goal === 'lose' ? 'Lose Weight' :
                                profile.goal === 'gain' ? 'Gain Weight' : 'Maintain Weight'}
                        </Text>
                        <Text style={[styles.profileStats, { color: theme.subText }]}>
                            {profile.height}cm • {profile.weight}kg • {profile.age} years
                        </Text>
                    </View>
                    <TouchableOpacity onPress={showEditProfile}>
                        <Ionicons name="create-outline" size={24} color={theme.primary} />
                    </TouchableOpacity>
                </View>
            </ResponsiveCard>

            {/* Daily Targets */}
            <ResponsiveCard size="medium" style={{ marginBottom: 16 }}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Daily Targets</Text>

                <ProfileItem
                    icon="flame-outline"
                    label="Calorie Goal"
                    value={`${profile.dailyCaloriesTarget} kcal`}
                    onPress={showEditProfile}
                />

                <ProfileItem
                    icon="water-outline"
                    label="Water Goal"
                    value={`${profile.dailyWaterTarget} glasses`}
                    onPress={showEditProfile}
                />
            </ResponsiveCard>                {/* Health Info */}
            <ResponsiveCard size="medium" style={{ marginBottom: 16 }}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Health Information</Text>

                <ProfileItem
                    icon="body-outline"
                    label="Activity Level"
                    value={profile.activityLevel.charAt(0).toUpperCase() + profile.activityLevel.slice(1)}
                    onPress={showEditProfile}
                />

                <ProfileItem
                    icon="person-outline"
                    label="Gender"
                    value={profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1)}
                    onPress={showEditProfile}
                />
            </ResponsiveCard>

            {/* Settings */}
            <ResponsiveCard size="medium" style={{ marginBottom: 16 }}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Settings</Text>

                <ProfileItem
                    icon="notifications-outline"
                    label="Notifications"
                    rightElement={
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={handleNotificationToggle}
                            trackColor={{ false: theme.border, true: theme.primary }}
                            thumbColor={notificationsEnabled ? '#ffffff' : '#f4f3f4'}
                        />
                    }
                />
            </ResponsiveCard>

            {/* Data Management */}
            <ResponsiveCard size="medium" style={{ marginBottom: 16 }}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Data Management</Text>

                <ProfileItem
                    icon="download-outline"
                    label="Export & Backup"
                    onPress={() => setShowExportModal(true)}
                />

                <ProfileItem
                    icon="analytics-outline"
                    label="Usage Statistics"
                    onPress={() => Alert.alert('Coming Soon', 'Usage statistics feature coming soon!')}
                />
            </ResponsiveCard>

            {/* About */}
            <ResponsiveCard size="medium" style={{ marginBottom: 16 }}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>About</Text>

                <ProfileItem
                    icon="help-circle-outline"
                    label="Help & Support"
                    onPress={() => Alert.alert('Help', 'Contact support at help@diettracker.com')}
                />

                <ProfileItem
                    icon="information-circle-outline"
                    label="App Version"
                    value="1.0.0"
                />
            </ResponsiveCard>

            <View style={styles.bottomSpacing} />

            {/* Export/Backup Modal */}
            <Modal
                visible={showExportModal}
                animationType="slide"
                presentationStyle="formSheet"
            >
                <ExportBackupManager
                    onClose={() => setShowExportModal(false)}
                    onDataImported={handleDataImported}
                />
            </Modal>

            {/* Theme Dialog */}
            <ThemeDialog
                visible={themeDialogOpen}
                onClose={() => setThemeDialogOpen(false)}
            />
        </ResponsiveLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loading: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
    },
    content: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        marginBottom: 8,
    },
    menuButton: {
        padding: 8,
        borderRadius: 8,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        flex: 1,
        textAlign: 'center',
    },
    profileSummaryContent: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
    },
    profileInfo: {
        flex: 1,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 4,
    },
    profileSubtitle: {
        fontSize: 14,
        marginBottom: 4,
    },
    profileStats: {
        fontSize: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
    },
    profileItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 8,
    },
    profileItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    profileItemLabel: {
        fontSize: 16,
        marginLeft: 12,
        flex: 1,
    },
    profileItemRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    profileItemValue: {
        fontSize: 14,
        marginRight: 8,
    },
    bottomSpacing: {
        height: 40,
    },
});

export default ProfileScreen;
