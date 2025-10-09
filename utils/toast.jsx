import { showToast } from '../components/ui/Toast';

// messageOrObj can be a string or an object { message, type, duration, action }
export const toast = (messageOrObj, type = 'info', duration = 2500) => {
    try {
        if (typeof messageOrObj === 'string') showToast(messageOrObj, type, duration);
        else showToast(messageOrObj);
    } catch (e) {
        console.log('Toast:', messageOrObj);
    }
};

export default toast;