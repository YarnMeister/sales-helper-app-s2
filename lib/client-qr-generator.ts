/**
 * Client-side QR-ID Generator using localStorage
 * 
 * This replaces the database-based generation with a simple, reliable
 * client-side counter that works offline and persists across browser sessions.
 * 
 * Format: QR-002, QR-003, QR-004, etc.
 * Starts at 2 to avoid conflicts with existing QR-001 entries
 */

const QR_COUNTER_KEY = 'qr_counter';
const QR_START_VALUE = 2; // Start at 2 to avoid conflicts with existing QR-001

/**
 * Generate next QR-ID using localStorage counter
 * Format: QR-002, QR-003, QR-004, etc.
 */
export const generateQRId = (): string => {
  try {
    // Get current counter value from localStorage
    const currentCounter = localStorage.getItem(QR_COUNTER_KEY);
    const nextCounter = currentCounter 
      ? parseInt(currentCounter, 10) + 1 
      : QR_START_VALUE;
    
    // Store the new counter value
    localStorage.setItem(QR_COUNTER_KEY, nextCounter.toString());
    
    // Format as QR-XXX with zero padding
    const qrId = `QR-${nextCounter.toString().padStart(3, '0')}`;
    
    console.log('Generated QR-ID:', qrId, 'Counter:', nextCounter);
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
    const counter = localStorage.getItem(QR_COUNTER_KEY);
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
    localStorage.setItem(QR_COUNTER_KEY, value.toString());
    console.log('QR counter reset to:', value);
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
    const currentCounter = localStorage.getItem(QR_COUNTER_KEY);
    if (!currentCounter) {
      localStorage.setItem(QR_COUNTER_KEY, (QR_START_VALUE - 1).toString());
      console.log('QR counter initialized to:', QR_START_VALUE - 1);
    }
  } catch (error) {
    console.error('Failed to initialize QR counter:', error);
  }
};
