import { showToast } from '../components/ui/Toast';

export const toast = (message, type = 'info', duration = 2500) => {
    try {
        showToast(message, type, duration);
    } catch (e) {
        // fallback
        console.log('Toast:', message);
    }
};

export default toast;
