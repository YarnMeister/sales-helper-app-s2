import { describe, it, expect, beforeEach, vi } from 'vitest';
import { generateQRId, getCurrentQRCounter, resetQRCounter, initializeQRCounter } from '../../lib/client-qr-generator';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Client QR-ID Generator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  describe('generateQRId', () => {
    it('should generate QR-002 on first call when no counter exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = generateQRId();
      
      expect(result).toBe('QR-002');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('qr_counter_prod', '2');
    });

    it('should increment counter correctly', () => {
      localStorageMock.getItem
        .mockReturnValueOnce('2')  // First call
        .mockReturnValueOnce('3'); // Second call
      
      const result1 = generateQRId();
      const result2 = generateQRId();
      
      expect(result1).toBe('QR-003');
      expect(result2).toBe('QR-004');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('qr_counter_prod', '3');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('qr_counter_prod', '4');
    });

    it('should handle localStorage errors gracefully with fallback', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      const result = generateQRId();
      
      // Should generate a timestamp-based fallback
      expect(result).toMatch(/^QR-\d{3}$/);
      expect(result).not.toBe('QR-002'); // Should be different from normal flow
    });

    it('should pad numbers with zeros correctly', () => {
      localStorageMock.getItem.mockReturnValue('9');
      
      const result = generateQRId();
      
      expect(result).toBe('QR-010');
    });
  });

  describe('getCurrentQRCounter', () => {
    it('should return current counter value', () => {
      localStorageMock.getItem.mockReturnValue('5');
      
      const result = getCurrentQRCounter();
      
      expect(result).toBe(5);
    });

    it('should return 1 when no counter exists', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      const result = getCurrentQRCounter();
      
      expect(result).toBe(1);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      const result = getCurrentQRCounter();
      
      expect(result).toBe(1);
    });
  });

  describe('resetQRCounter', () => {
    it('should reset counter to default value', () => {
      resetQRCounter();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('qr_counter_prod', '2');
    });

    it('should reset counter to specified value', () => {
      resetQRCounter(10);
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('qr_counter_prod', '10');
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      // Should not throw
      expect(() => resetQRCounter()).not.toThrow();
    });
  });

  describe('initializeQRCounter', () => {
    it('should initialize counter when it does not exist', () => {
      localStorageMock.getItem.mockReturnValue(null);
      
      initializeQRCounter();
      
      expect(localStorageMock.setItem).toHaveBeenCalledWith('qr_counter_prod', '1');
    });

    it('should not initialize counter when it already exists', () => {
      localStorageMock.getItem.mockReturnValue('5');
      
      initializeQRCounter();
      
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage not available');
      });
      
      // Should not throw
      expect(() => initializeQRCounter()).not.toThrow();
    });
  });
});
