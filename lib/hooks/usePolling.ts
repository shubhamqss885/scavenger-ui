import { useCallback, useEffect, useRef, useState } from "react";

// Types for interval configuration
type FixedInterval = {
  type: "fixed";
  value: number;
};

type ExponentialInterval = {
  type: "exponential";
  initial: number;
  multiplier: number;
  max: number;
};

type IntervalConfig = FixedInterval | ExponentialInterval;

// Stall detection configuration
interface StallDetection<T> {
  maxStalls: number;
  isStalled: (previous: T | null, current: T | null) => boolean;
}

// Main hook configuration
interface UsePollingOptions<T> {
  // Core options
  fn: () => Promise<T>;
  interval: IntervalConfig;

  // Control options
  autoStart?: boolean;
  immediate?: boolean;
  maxAttempts?: number;

  // Stop condition
  stopWhen?: (data: T | null, error: Error | null) => boolean;

  // Callbacks
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;

  // Advanced features
  stallDetection?: StallDetection<T>;
}

// Hook return type
interface UsePollingReturn<T> {
  data: T | null;
  error: Error | null;
  isPolling: boolean;
  attempts: number;
  start: () => void;
  stop: () => void;
}

export function usePolling<T>({
  fn,
  interval,
  autoStart = true,
  immediate = false,
  maxAttempts = Infinity,
  stopWhen,
  onSuccess,
  onError,
  stallDetection,
}: UsePollingOptions<T>): UsePollingReturn<T> {
  // State
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [attempts, setAttempts] = useState(0);

  // Refs for tracking
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stallCountRef = useRef(0);
  const previousDataRef = useRef<T | null>(null);
  const isComponentMountedRef = useRef(true);

  // Calculate next interval for exponential backoff
  const getNextInterval = useCallback(
    (attemptNumber: number): number => {
      if (interval.type === "fixed") {
        return interval.value;
      }

      if (interval.type === "exponential") {
        const exponentialDelay =
          interval.initial * Math.pow(interval.multiplier, attemptNumber - 1);
        return Math.min(exponentialDelay, interval.max);
      }

      return 5000; // Default fallback
    },
    [interval],
  );

  // Check and handle stall detection
  const checkStallDetection = useCallback(
    (result: T): boolean => {
      if (!stallDetection) return false;

      const isStalled = stallDetection.isStalled(
        previousDataRef.current,
        result,
      );

      if (isStalled) {
        stallCountRef.current += 1;
        if (stallCountRef.current >= stallDetection.maxStalls) {
          setIsPolling(false);
          setError(new Error("Polling stalled - no progress detected"));
          return true;
        }
      } else {
        stallCountRef.current = 0;
      }
      previousDataRef.current = result;
      return false;
    },
    [stallDetection],
  );

  // Execute polling function
  const executePoll = useCallback(async () => {
    if (!isComponentMountedRef.current) return;

    try {
      setError(null);
      const result = await fn();

      if (!isComponentMountedRef.current) return;

      // Check for stall
      if (checkStallDetection(result)) {
        return;
      }

      setData(result);
      setAttempts((prev) => prev + 1);
      onSuccess?.(result);

      // Check stop condition
      if (stopWhen?.(result, null)) {
        setIsPolling(false);
        return;
      }

      // Check max attempts
      if (attempts + 1 >= maxAttempts) {
        setIsPolling(false);
        setError(new Error("Max polling attempts reached"));
        return;
      }

      // Schedule next poll
      const nextInterval = getNextInterval(attempts + 1);
      timeoutRef.current = setTimeout(executePoll, nextInterval);
    } catch (err) {
      if (!isComponentMountedRef.current) return;

      const error = err instanceof Error ? err : new Error("Polling failed");
      setError(error);
      setAttempts((prev) => prev + 1);
      onError?.(error);

      // Check stop condition with error
      if (stopWhen?.(null, error)) {
        setIsPolling(false);
        return;
      }

      // Check max attempts
      if (attempts + 1 >= maxAttempts) {
        setIsPolling(false);
        return;
      }

      // Schedule retry
      const nextInterval = getNextInterval(attempts + 1);
      timeoutRef.current = setTimeout(executePoll, nextInterval);
    }
  }, [
    fn,
    attempts,
    maxAttempts,
    stopWhen,
    onSuccess,
    onError,
    checkStallDetection,
    getNextInterval,
  ]);

  // Start polling
  const start = useCallback(() => {
    if (isPolling) return;

    setIsPolling(true);
    setAttempts(0);
    setError(null);
    stallCountRef.current = 0;
    previousDataRef.current = null;

    if (immediate) {
      executePoll();
    } else {
      const firstInterval = getNextInterval(0);
      timeoutRef.current = setTimeout(executePoll, firstInterval);
    }
  }, [isPolling, immediate, executePoll, getNextInterval]);

  // Stop polling
  const stop = useCallback(() => {
    setIsPolling(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Auto-start effect
  useEffect(() => {
    if (autoStart && !isPolling) {
      start();
    } else if (!autoStart && isPolling) {
      stop();
    }
  }, [autoStart]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount
  useEffect(() => {
    isComponentMountedRef.current = true;

    return () => {
      isComponentMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    data,
    error,
    isPolling,
    attempts,
    start,
    stop,
  };
}
