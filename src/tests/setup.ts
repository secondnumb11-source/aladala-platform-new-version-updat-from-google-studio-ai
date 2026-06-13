import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock ResizeObserver
(global as any).ResizeObserver = class ResizeObserver {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
};

// Mock IntersectionObserver
(global as any).IntersectionObserver = class IntersectionObserver {
    constructor(callback: any) {
        this.callback = callback;
    }
    callback: any;
    root = null;
    rootMargin = "";
    thresholds = [];
    takeRecords = vi.fn();
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
};

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = vi.fn();
