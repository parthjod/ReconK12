import { useState, useEffect } from 'react';

/**
 * A hook that works like useState but persists state to localStorage.
 * Reads existing values on mount and writes updates.
 *
 * @param {string} key LocalStorage key
 * @param {any} initialValue Initial value if nothing is saved
 */
export function usePersistedState(key, initialValue) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(`Error reading localStorage key "${key}":`, e);
    }
    return typeof initialValue === 'function' ? initialValue() : initialValue;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
      console.error(`Error writing localStorage key "${key}":`, e);
    }
  }, [key, state]);

  return [state, setState];
}
