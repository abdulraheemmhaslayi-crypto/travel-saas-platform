'use client';

import { useState, useCallback } from 'react';
import { AxiosResponse } from 'axios';

interface UseApiOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

export function useApi<T = unknown>() {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async <R = T>(
    apiCall: () => Promise<AxiosResponse<R>>,
    options?: UseApiOptions<R>
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiCall();
      setData(response.data as unknown as T);
      options?.onSuccess?.(response.data);
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, isLoading, error, execute, reset };
}

export function useApiMutation<T = unknown, D = unknown>() {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(async (
    apiCall: (data: D) => Promise<AxiosResponse<T>>,
    variables: D,
    options?: UseApiOptions<T>
  ) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiCall(variables);
      setData(response.data);
      options?.onSuccess?.(response.data);
      return response.data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred');
      setError(error);
      options?.onError?.(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, isLoading, error, mutate, reset };
}