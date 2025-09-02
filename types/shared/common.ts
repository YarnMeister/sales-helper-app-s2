/**
 * Shared Common Types
 * 
 * Common utility types that are shared across all feature modules.
 * This ensures consistency in common interfaces and behavior.
 */

/**
 * Generic result type for operations that can succeed or fail
 */
export type Result<T, E = Error> = 
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Generic option type for values that may or may not exist
 */
export type Option<T> = T | null | undefined;

/**
 * Generic nullable type
 */
export type Nullable<T> = T | null;

/**
 * Generic optional type
 */
export type Optional<T> = T | undefined;

/**
 * Generic readonly type
 */
export type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

/**
 * Generic partial type
 */
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

/**
 * Generic required type
 */
export type Required<T> = {
  [P in keyof T]-?: T[P];
};

/**
 * Generic pick type
 */
export type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

/**
 * Generic omit type
 */
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

/**
 * Generic record type
 */
export type Record<K extends keyof any, T> = {
  [P in K]: T;
};

/**
 * Generic tuple type
 */
export type Tuple<T, N extends number> = N extends N ? number extends N ? T[] : TupleOf<T, N, []> : never;
type TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : TupleOf<T, N, [...R, T]>;

/**
 * Generic function type
 */
export type Function<TArgs extends any[] = any[], TReturn = any> = (...args: TArgs) => TReturn;

/**
 * Generic async function type
 */
export type AsyncFunction<TArgs extends any[] = any[], TReturn = any> = (...args: TArgs) => Promise<TReturn>;

/**
 * Generic event handler type
 */
export type EventHandler<TEvent = Event> = (event: TEvent) => void | Promise<void>;

/**
 * Generic change handler type
 */
export type ChangeHandler<TValue = any> = (value: TValue) => void | Promise<void>;

/**
 * Generic click handler type
 */
export type ClickHandler<TElement = HTMLElement> = (event: React.MouseEvent<TElement>) => void | Promise<void>;

/**
 * Generic submit handler type
 */
export type SubmitHandler<TData = any> = (data: TData) => void | Promise<void>;

/**
 * Generic callback type
 */
export type Callback<TArgs extends any[] = any[], TReturn = any> = (...args: TArgs) => TReturn;

/**
 * Generic async callback type
 */
export type AsyncCallback<TArgs extends any[] = any[], TReturn = any> = (...args: TArgs) => Promise<TReturn>;

/**
 * Generic predicate type
 */
export type Predicate<T> = (value: T) => boolean;

/**
 * Generic async predicate type
 */
export type AsyncPredicate<T> = (value: T) => Promise<boolean>;

/**
 * Generic mapper type
 */
export type Mapper<TInput, TOutput> = (value: TInput) => TOutput;

/**
 * Generic async mapper type
 */
export type AsyncMapper<TInput, TOutput> = (value: TInput) => Promise<TOutput>;

/**
 * Generic reducer type
 */
export type Reducer<TInput, TOutput> = (accumulator: TOutput, value: TInput) => TOutput;

/**
 * Generic async reducer type
 */
export type AsyncReducer<TInput, TOutput> = (accumulator: TOutput, value: TInput) => Promise<TOutput>;

/**
 * Generic comparator type
 */
export type Comparator<T> = (a: T, b: T) => number;

/**
 * Generic async comparator type
 */
export type AsyncComparator<T> = (a: T, b: T) => Promise<number>;

/**
 * Generic filter type
 */
export type Filter<T> = (value: T) => boolean;

/**
 * Generic async filter type
 */
export type AsyncFilter<T> = (value: T) => Promise<boolean>;

/**
 * Generic sorter type
 */
export type Sorter<T> = (a: T, b: T) => number;

/**
 * Generic async sorter type
 */
export type AsyncSorter<T> = (a: T, b: T) => Promise<number>;

/**
 * Generic validator type
 */
export type Validator<T> = (value: T) => string | undefined;

/**
 * Generic async validator type
 */
export type AsyncValidator<T> = (value: T) => Promise<string | undefined>;

/**
 * Generic transformer type
 */
export type Transformer<TInput, TOutput> = (value: TInput) => TOutput;

/**
 * Generic async transformer type
 */
export type AsyncTransformer<TInput, TOutput> = (value: TInput) => Promise<TOutput>;

/**
 * Generic factory type
 */
export type Factory<T> = () => T;

/**
 * Generic async factory type
 */
export type AsyncFactory<T> = () => Promise<T>;

/**
 * Generic singleton type
 */
export type Singleton<T> = T & { readonly instance: T };

/**
 * Generic lazy type
 */
export type Lazy<T> = () => T;

/**
 * Generic async lazy type
 */
export type AsyncLazy<T> = () => Promise<T>;

/**
 * Generic memoized type
 */
export type Memoized<T> = T & { readonly memoized: boolean };

/**
 * Generic cached type
 */
export type Cached<T> = T & { readonly cached: boolean; readonly timestamp: number };

/**
 * Generic debounced type
 */
export type Debounced<T extends Function> = T & { readonly debounced: boolean; readonly delay: number };

/**
 * Generic throttled type
 */
export type Throttled<T extends Function> = T & { readonly throttled: boolean; readonly interval: number };

/**
 * Generic retry type
 */
export type Retry<T extends Function> = T & { readonly retry: boolean; readonly attempts: number; readonly maxAttempts: number };

/**
 * Generic timeout type
 */
export type Timeout<T extends Function> = T & { readonly timeout: boolean; readonly duration: number };

/**
 * Generic rate limited type
 */
export type RateLimited<T extends Function> = T & { readonly rateLimited: boolean; readonly limit: number; readonly window: number };

/**
 * Generic circuit breaker type
 */
export type CircuitBreaker<T extends Function> = T & { readonly circuitBreaker: boolean; readonly state: 'closed' | 'open' | 'half-open' };

/**
 * Generic fallback type
 */
export type Fallback<T extends Function> = T & { readonly fallback: boolean; readonly fallbackFunction: Function };

/**
 * Generic retry with backoff type
 */
export type RetryWithBackoff<T extends Function> = T & { 
  readonly retryWithBackoff: boolean; 
  readonly attempts: number; 
  readonly maxAttempts: number; 
  readonly backoff: 'fixed' | 'exponential' | 'fibonacci';
};

/**
 * Generic timeout with fallback type
 */
export type TimeoutWithFallback<T extends Function> = T & { 
  readonly timeoutWithFallback: boolean; 
  readonly duration: number; 
  readonly fallbackFunction: Function;
};

/**
 * Generic rate limit with burst type
 */
export type RateLimitWithBurst<T extends Function> = T & { 
  readonly rateLimitWithBurst: boolean; 
  readonly limit: number; 
  readonly window: number; 
  readonly burst: number;
};

/**
 * Generic circuit breaker with fallback type
 */
export type CircuitBreakerWithFallback<T extends Function> = T & { 
  readonly circuitBreakerWithFallback: boolean; 
  readonly state: 'closed' | 'open' | 'half-open'; 
  readonly fallbackFunction: Function;
};

/**
 * Generic retry with jitter type
 */
export type RetryWithJitter<T extends Function> = T & { 
  readonly retryWithJitter: boolean; 
  readonly attempts: number; 
  readonly maxAttempts: number; 
  readonly jitter: number;
};

/**
 * Generic timeout with retry type
 */
export type TimeoutWithRetry<T extends Function> = T & { 
  readonly timeoutWithRetry: boolean; 
  readonly duration: number; 
  readonly retryAttempts: number;
};

/**
 * Generic rate limit with sliding window type
 */
export type RateLimitWithSlidingWindow<T extends Function> = T & { 
  readonly rateLimitWithSlidingWindow: boolean; 
  readonly limit: number; 
  readonly window: number;
};

/**
 * Generic circuit breaker with timeout type
 */
export type CircuitBreakerWithTimeout<T extends Function> = T & { 
  readonly circuitBreakerWithTimeout: boolean; 
  readonly state: 'closed' | 'open' | 'half-open'; 
  readonly timeout: number;
};

/**
 * Generic retry with exponential backoff type
 */
export type RetryWithExponentialBackoff<T extends Function> = T & { 
  readonly retryWithExponentialBackoff: boolean; 
  readonly attempts: number; 
  readonly maxAttempts: number; 
  readonly baseDelay: number; 
  readonly maxDelay: number;
};

/**
 * Generic timeout with exponential backoff type
 */
export type TimeoutWithExponentialBackoff<T extends Function> = T & { 
  readonly timeoutWithExponentialBackoff: boolean; 
  readonly duration: number; 
  readonly maxDuration: number;
};

/**
 * Generic rate limit with token bucket type
 */
export type RateLimitWithTokenBucket<T extends Function> = T & { 
  readonly rateLimitWithTokenBucket: boolean; 
  readonly capacity: number; 
  readonly refillRate: number;
};

/**
 * Generic circuit breaker with health check type
 */
export type CircuitBreakerWithHealthCheck<T extends Function> = T & { 
  readonly circuitBreakerWithHealthCheck: boolean; 
  readonly state: 'closed' | 'open' | 'half-open'; 
  readonly healthCheckFunction: Function;
};

/**
 * Generic retry with fibonacci backoff type
 */
export type RetryWithFibonacciBackoff<T extends Function> = T & { 
  readonly retryWithFibonacciBackoff: boolean; 
  readonly attempts: number; 
  readonly maxAttempts: number; 
  readonly maxDelay: number;
};

/**
 * Generic timeout with fibonacci backoff type
 */
export type TimeoutWithFibonacciBackoff<T extends Function> = T & { 
  readonly timeoutWithFibonacciBackoff: boolean; 
  readonly duration: number; 
  readonly maxDuration: number;
};

/**
 * Generic rate limit with leaky bucket type
 */
export type RateLimitWithLeakyBucket<T extends Function> = T & { 
  readonly rateLimitWithLeakyBucket: boolean; 
  readonly capacity: number; 
  readonly leakRate: number;
};

/**
 * Generic circuit breaker with bulkhead type
 */
export type CircuitBreakerWithBulkhead<T extends Function> = T & { 
  readonly circuitBreakerWithBulkhead: boolean; 
  readonly state: 'closed' | 'open' | 'half-open'; 
  readonly maxConcurrent: number;
};

/**
 * Generic retry with custom backoff type
 */
export type RetryWithCustomBackoff<T extends Function> = T & { 
  readonly retryWithCustomBackoff: boolean; 
  readonly attempts: number; 
  readonly maxAttempts: number; 
  readonly backoffFunction: (attempt: number) => number;
};

/**
 * Generic timeout with custom backoff type
 */
export type TimeoutWithCustomBackoff<T extends Function> = T & { 
  readonly timeoutWithCustomBackoff: boolean; 
  readonly duration: number; 
  readonly backoffFunction: (attempt: number) => number;
};

/**
 * Generic rate limit with custom algorithm type
 */
export type RateLimitWithCustomAlgorithm<T extends Function> = T & { 
  readonly rateLimitWithCustomAlgorithm: boolean; 
  readonly algorithm: 'token-bucket' | 'leaky-bucket' | 'sliding-window' | 'fixed-window';
};

/**
 * Generic circuit breaker with custom state machine type
 */
export type CircuitBreakerWithCustomStateMachine<T extends Function> = T & { 
  readonly circuitBreakerWithCustomStateMachine: boolean; 
  readonly state: 'closed' | 'open' | 'half-open'; 
  readonly stateMachine: Record<string, Record<string, string>>;
};

/**
 * Generic retry with custom strategy type
 */
export type RetryWithCustomStrategy<T extends Function> = T & { 
  readonly retryWithCustomStrategy: boolean; 
  readonly attempts: number; 
  readonly maxAttempts: number; 
  readonly strategy: 'fixed' | 'exponential' | 'fibonacci' | 'custom';
};

/**
 * Generic timeout with custom strategy type
 */
export type TimeoutWithCustomStrategy<T extends Function> = T & { 
  readonly timeoutWithCustomStrategy: boolean; 
  readonly duration: number; 
  readonly strategy: 'fixed' | 'exponential' | 'fibonacci' | 'custom';
};

/**
 * Generic rate limit with custom strategy type
 */
export type RateLimitWithCustomStrategy<T extends Function> = T & { 
  readonly rateLimitWithCustomStrategy: boolean; 
  readonly strategy: 'token-bucket' | 'leaky-bucket' | 'sliding-window' | 'fixed-window' | 'custom';
};

/**
 * Generic circuit breaker with custom strategy type
 */
export type CircuitBreakerWithCustomStrategy<T extends Function> = T & { 
  readonly circuitBreakerWithCustomStrategy: boolean; 
  readonly state: 'closed' | 'open' | 'half-open'; 
  readonly strategy: 'count-based' | 'time-based' | 'custom';
};

/**
 * Generic retry with custom backoff and jitter type
 */
export type RetryWithCustomBackoffAndJitter<T extends Function> = T & { 
  readonly retryWithCustomBackoffAndJitter: boolean; 
  readonly attempts: number; 
  readonly maxAttempts: number; 
  readonly backoffFunction: (attempt: number) => number; 
  readonly jitterFunction: (delay: number) => number;
};

/**
 * Generic timeout with custom backoff and jitter type
 */
export type TimeoutWithCustomBackoffAndJitter<T extends Function> = T & { 
  readonly timeoutWithCustomBackoffAndJitter: boolean; 
  readonly duration: number; 
  readonly backoffFunction: (attempt: number) => number; 
  readonly jitterFunction: (delay: number) => number;
};

/**
 * Generic rate limit with custom algorithm and burst type
 */
export type RateLimitWithCustomAlgorithmAndBurst<T extends Function> = T & { 
  readonly rateLimitWithCustomAlgorithmAndBurst: boolean; 
  readonly algorithm: 'token-bucket' | 'leaky-bucket' | 'sliding-window' | 'fixed-window' | 'custom'; 
  readonly burst: number;
};

/**
 * Generic circuit breaker with custom state machine and health check type
 */
export type CircuitBreakerWithCustomStateMachineAndHealthCheck<T extends Function> = T & { 
  readonly circuitBreakerWithCustomStateMachineAndHealthCheck: boolean; 
  readonly state: 'closed' | 'open' | 'half-open'; 
  readonly stateMachine: Record<string, Record<string, string>>; 
  readonly healthCheckFunction: Function;
};

/**
 * Generic retry with custom strategy and backoff type
 */
export type RetryWithCustomStrategyAndBackoff<T extends Function> = T & { 
  readonly retryWithCustomStrategyAndBackoff: boolean; 
  readonly attempts: number; 
  readonly maxAttempts: number; 
  readonly strategy: 'fixed' | 'exponential' | 'fibonacci' | 'custom'; 
  readonly backoffFunction: (attempt: number) => number;
};

/**
 * Generic timeout with custom strategy and backoff type
 */
export type TimeoutWithCustomStrategyAndBackoff<T extends Function> = T & { 
  readonly timeoutWithCustomStrategyAndBackoff: boolean; 
  readonly duration: number; 
  readonly strategy: 'fixed' | 'exponential' | 'fibonacci' | 'custom'; 
  readonly backoffFunction: (attempt: number) => number;
};

/**
 * Generic rate limit with custom strategy and algorithm type
 */
export type RateLimitWithCustomStrategyAndAlgorithm<T extends Function> = T & { 
  readonly rateLimitWithCustomStrategyAndAlgorithm: boolean; 
  readonly strategy: 'token-bucket' | 'leaky-bucket' | 'sliding-window' | 'fixed-window' | 'custom'; 
  readonly algorithm: 'token-bucket' | 'leaky-bucket' | 'sliding-window' | 'fixed-window' | 'custom';
};

/**
 * Generic circuit breaker with custom strategy and state machine type
 */
export type CircuitBreakerWithCustomStrategyAndStateMachine<T extends Function> = T & { 
  readonly circuitBreakerWithCustomStrategyAndStateMachine: boolean; 
  readonly state: 'closed' | 'open' | 'half-open'; 
  readonly strategy: 'count-based' | 'time-based' | 'custom'; 
  readonly stateMachine: Record<string, Record<string, string>>;
};
