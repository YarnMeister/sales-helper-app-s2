/**
 * Client-side QR-ID Generator using localStorage
 * 
 * This replaces the database-based generation with a simple, reliable
 * client-side counter that works offline and persists across browser sessions.
 * 
 * Environment-aware: Uses different counters for prod vs dev
 * Format: QR-002, QR-003, QR-004, etc.
 * Starts at 2 to avoid conflicts with existing QR-001 entries
 */

// Environment-aware counter keys
const getQRCounterKey = (): string => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  return isDevelopment ? 'qr_counter_dev' : 'qr_counter_prod';
};

const QR_START_VALUE = 2; // Start at 2 to avoid conflicts with existing QR-001

/**
 * Generate next QR-ID using environment-specific localStorage counter
 * Format: QR-002, QR-003, QR-004, etc.
 */
export const generateQRId = (): string => {
  try {
    const counterKey = getQRCounterKey();
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    // Get current counter value from localStorage
    const currentCounter = localStorage.getItem(counterKey);
    const nextCounter = currentCounter 
      ? parseInt(currentCounter, 10) + 1 
      : QR_START_VALUE;
    
    // Store the new counter value
    localStorage.setItem(counterKey, nextCounter.toString());
    
    // Format as QR-XXX with zero padding
    const qrId = `QR-${nextCounter.toString().padStart(3, '0')}`;
    
    console.log(`Generated QR-ID (${isDevelopment ? 'dev' : 'prod'}):`, qrId, 'Counter:', nextCounter);
    return qrId;
    
  } catch (error) {
    console.error('Failed to generate QR-ID from localStorage:', error);
    
    // Fallback: generate a timestamp-based ID if localStorage fails
    const timestamp = Date.now();
    const fallbackId = `QR-${timestamp.toString().slice(-3)}`;
    console.log('Using fallback QR-ID:', fallbackId);
    return fallbackId;
  }
};

/**
 * Get current counter value (for debugging)
 */
export const getCurrentQRCounter = (): number => {
  try {
    const counterKey = getQRCounterKey();
    const counter = localStorage.getItem(counterKey);
    return counter ? parseInt(counter, 10) : QR_START_VALUE - 1;
  } catch (error) {
    console.error('Failed to get current QR counter:', error);
    return QR_START_VALUE - 1;
  }
};

/**
 * Reset counter (for testing or manual reset)
 */
export const resetQRCounter = (value: number = QR_START_VALUE): void => {
  try {
    const counterKey = getQRCounterKey();
    const isDevelopment = process.env.NODE_ENV === 'development';
    localStorage.setItem(counterKey, value.toString());
    console.log(`QR counter reset to ${value} (${isDevelopment ? 'dev' : 'prod'})`);
  } catch (error) {
    console.error('Failed to reset QR counter:', error);
  }
};

/**
 * Initialize counter if it doesn't exist
 * This ensures we start from the correct value
 */
export const initializeQRCounter = (): void => {
  try {
    const counterKey = getQRCounterKey();
    const isDevelopment = process.env.NODE_ENV === 'development';
    const currentCounter = localStorage.getItem(counterKey);
    if (!currentCounter) {
      localStorage.setItem(counterKey, (QR_START_VALUE - 1).toString());
      console.log(`QR counter initialized to ${QR_START_VALUE - 1} (${isDevelopment ? 'dev' : 'prod'})`);
    }
  } catch (error) {
    console.error('Failed to initialize QR counter:', error);
  }
};

/**
 * Sync counter with database to prevent duplicate ID issues
 * Call this when the app starts to ensure counter is in sync
 */
export const syncQRCounterWithDatabase = async (): Promise<void> => {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const counterKey = getQRCounterKey();
    
    // Get the latest request ID from the database
    const response = await fetch('/api/requests?limit=1');
    if (response.ok) {
      const data = await response.json();
      if (data.ok && data.data && data.data.length > 0) {
        const latestRequest = data.data[0];
        const latestId = latestRequest.request_id;
        const latestNumber = parseInt(latestId.replace('QR-', ''));
        
        // Set counter to the latest number
        localStorage.setItem(counterKey, latestNumber.toString());
        console.log(`QR counter synced to ${latestNumber} (${isDevelopment ? 'dev' : 'prod'})`);
      }
    }
  } catch (error) {
    console.error('Failed to sync QR counter with database:', error);
  }
};
