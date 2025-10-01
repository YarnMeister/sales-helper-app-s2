/**
 * Progress tracker for sync operations
 * Provides logging and status updates during batch processing
 */
export class ProgressTracker {
  private startTime: number = 0;
  private lastLogTime: number = 0;
  private logInterval: number = 10000; // Log every 10 seconds

  start(): void {
    this.startTime = Date.now();
    this.lastLogTime = this.startTime;
    console.log('🚀 Sync operation started');
  }

  async logProgress(
    currentBatch: number, 
    totalBatches: number, 
    processedDeals: number,
    totalDeals?: number
  ): Promise<void> {
    const now = Date.now();
    
    // Only log if enough time has passed or it's the last batch
    if (now - this.lastLogTime >= this.logInterval || currentBatch === totalBatches) {
      const elapsed = now - this.startTime;
      const progress = (currentBatch / totalBatches) * 100;
      const eta = totalBatches > 0 ? (elapsed / currentBatch) * (totalBatches - currentBatch) : 0;
      
      console.log(`📊 Progress: ${currentBatch}/${totalBatches} batches (${progress.toFixed(1)}%)`);
      console.log(`   Processed: ${processedDeals}${totalDeals ? `/${totalDeals}` : ''} deals`);
      console.log(`   Elapsed: ${this.formatDuration(elapsed)}`);
      if (eta > 0) {
        console.log(`   ETA: ${this.formatDuration(eta)}`);
      }
      
      this.lastLogTime = now;
    }
  }

  logCompletion(
    totalDeals: number,
    successfulDeals: number,
    failedDeals: number,
    duration: number
  ): void {
    const successRate = totalDeals > 0 ? (successfulDeals / totalDeals) * 100 : 0;
    
    console.log('✅ Sync operation completed');
    console.log(`   Total deals: ${totalDeals}`);
    console.log(`   Successful: ${successfulDeals} (${successRate.toFixed(1)}%)`);
    console.log(`   Failed: ${failedDeals}`);
    console.log(`   Duration: ${this.formatDuration(duration)}`);
  }

  logError(error: string, context?: any): void {
    console.error('❌ Sync error:', error);
    if (context) {
      console.error('   Context:', context);
    }
  }

  private formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }
}
