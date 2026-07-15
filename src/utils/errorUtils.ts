import type { AxiosError } from 'axios';

export function getErrorMessage(error: unknown, defaultMessage: string = 'Terjadi kesalahan'): string {
    if (error && typeof error === 'object') {
        const axiosError = error as AxiosError<any>;
        if (axiosError.response?.data) {
            const data = axiosError.response.data;
            if (typeof data.message === 'string') {
                return data.message;
            }
            if (data.error && typeof data.error === 'string') {
                return data.error;
            }
        }
        
        if ('message' in error && typeof (error as Error).message === 'string') {
            const msg = (error as Error).message;
            if (msg.toLowerCase().includes('network error')) {
                return 'Koneksi jaringan bermasalah. Silakan periksa koneksi internet Anda.';
            }
            return msg;
        }
    }
    
    return defaultMessage;
}
