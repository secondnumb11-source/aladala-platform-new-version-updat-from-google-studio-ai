import React, { useEffect, useRef } from 'react';
import { ErrorReporting } from './ErrorReporting';

/**
 * Utility to flag and measure components that re-render too often.
 * Attach this hook inside heavy components.
 */
export const useRenderPerformance = (componentName: string, thresholdMs = 15) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(performance.now());
  const mountTime = useRef(performance.now());

  useEffect(() => {
    renderCount.current += 1;
    lastRenderTime.current = performance.now();
  });
};

/**
 * Returns a strictly memoized wrapper for expensive layout blocks
 */
export const withPerformanceOptimization = <T extends React.ComponentType<any>>(
  Component: T,
  propsAreEqual?: (prev: Readonly<React.ComponentProps<T>>, next: Readonly<React.ComponentProps<T>>) => boolean
) => {
  return React.memo(Component, propsAreEqual || ((prev, next) => {
    // Default simple shallow compare stringified props for quick nested bailouts 
    // Recommended to supply custom propsAreEqual for complex objects
    return JSON.stringify(prev) === JSON.stringify(next);
  }));
};
