import { Platform } from 'react-native';
import type { View } from 'react-native';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Measures an element's position in window/screen coordinates.
 * Works on both web and native platforms.
 */
export function measureInWindow(ref: View | null): Promise<Rect | null> {
  return new Promise((resolve) => {
    if (!ref) {
      resolve(null);
      return;
    }

    if (Platform.OS === 'web') {
      // On web, use getBoundingClientRect
      const node = ref as unknown as HTMLElement;
      if (node && typeof node.getBoundingClientRect === 'function') {
        const rect = node.getBoundingClientRect();
        resolve({
          x: rect.left,
          y: rect.top,
          width: rect.width,
          height: rect.height,
        });
      } else {
        resolve(null);
      }
    } else {
      // On native, use measureInWindow
      if (typeof ref.measureInWindow === 'function') {
        ref.measureInWindow((x, y, width, height) => {
          resolve({ x, y, width, height });
        });
      } else {
        resolve(null);
      }
    }
  });
}

/**
 * Measures an element's position relative to a container element.
 * Accounts for scroll position and container offset.
 */
export async function measureRelativeToContainer(
  elementRef: View | null,
  containerRef: View | null
): Promise<Rect | null> {
  const [elementRect, containerRect] = await Promise.all([
    measureInWindow(elementRef),
    measureInWindow(containerRef),
  ]);

  if (!elementRect || !containerRect) {
    return null;
  }

  return {
    x: elementRect.x - containerRect.x,
    y: elementRect.y - containerRect.y,
    width: elementRect.width,
    height: elementRect.height,
  };
}
