/**
 * Rate limiter for Pipedrive API calls
 * Ensures we stay within the 40 requests per 2 seconds limit
 */
export class RateLimiter {
  private requests: number[] = [];
  
  constructor(
    private maxRequests: number,
    private windowMs: number
  ) {}

  async waitForSlot(): Promise<void> {
    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    
    // If we're at the limit, wait
    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = Math.min(...this.requests);
      const waitTime = this.windowMs - (now - oldestRequest) + 100; // +100ms buffer
      
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.waitForSlot(); // Recursive check
      }
    }
    
    // Record this request
    this.requests.push(now);
  }

  getRequestCount(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length;
  }

  reset(): void {
    this.requests = [];
  }
}
