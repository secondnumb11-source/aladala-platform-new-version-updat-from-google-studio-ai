/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Calculates the relative luminance of a color.
 * Based on WCAG 2.1 Formula.
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = rgb.map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculates the contrast ratio between two relative luminances.
 */
export function getContrastRatio(l1: number, l2: number): number {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Helper to convert hex to RGB array.
 */
function hexToRgb(hex: string): number[] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : null;
}

/**
 * Returns the suggested text color (white or slate-950) based on background hex.
 */
export function getOptimalTextColor(bgHex: string): 'white' | '#020617' {
  const luminance = getLuminance(bgHex);
  // White luminance is 1, Slate-950 is ~0.005
  // If BG is dark, return white. If BG is light, return Slate-950.
  return luminance > 0.45 ? '#020617' : 'white';
}

/**
 * Custom Hook to determine contrast requirements for a background color
 */
import { useEffect, useState } from 'react';

export function useAdaptiveContrast(bgHex: string) {
  const [contrastClass, setContrastClass] = useState<'high-contrast-text' | 'normal-contrast-text'>('normal-contrast-text');
  const [textColor, setTextColor] = useState<string>('white');

  useEffect(() => {
    if (!bgHex) return;
    const optimal = getOptimalTextColor(bgHex);
    setTextColor(optimal);
    
    // Check WCAG AAA conformance (7:1)
    const bgLum = getLuminance(bgHex);
    const textLum = optimal === 'white' ? 1 : 0.005;
    const ratio = getContrastRatio(bgLum, textLum);
    
    if (ratio < 4.5) {
      setContrastClass('high-contrast-text');
    } else {
      setContrastClass('normal-contrast-text');
    }
  }, [bgHex]);

  return { contrastClass, textColor };
}
