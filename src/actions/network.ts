/**
 * Checks internet connectivity by attempting to fetch from a reliable endpoint
 * @returns Promise<boolean> - true if connected, false otherwise
 */
export async function checkInternetConnection(): Promise<boolean> {
    console.log('Checking internet connectivity...');
    try {
        // Use a reliable endpoint that should always be available
        const response = await fetch('https://www.google.com/favicon.ico', {
            method: 'HEAD',
            mode: 'no-cors',
            cache: 'no-cache',
            signal: AbortSignal.timeout(5000) // 5 second timeout
        });
        return true;
    } catch (error) {
        console.warn('Internet connectivity check failed:', error);
        return false;
    }
}