// Lightweight notifications helper. Optional: if you want scheduled reminders install expo-notifications and follow setup.

let Notifications;
try {
    Notifications = require('expo-notifications');
} catch (e) {
    Notifications = null;
}

export async function requestPermissions() {
    if (!Notifications) return { granted: false, reason: 'expo-notifications not installed' };
    const settings = await Notifications.getPermissionsAsync();
    if (!settings.granted) {
        const res = await Notifications.requestPermissionsAsync();
        return res;
    }
    return settings;
}

export async function scheduleDailyReminder(hour = 20, minute = 0, body = 'Time to hydrate!') {
    if (!Notifications) throw new Error('expo-notifications not installed');
    // cancel previous app badge / schedules if needed
    const trigger = {
        hour,
        minute,
        repeats: true,
    };
    const id = await Notifications.scheduleNotificationAsync({ content: { title: 'Hydration Reminder', body }, trigger });
    return id;
}

export default { requestPermissions, scheduleDailyReminder };
