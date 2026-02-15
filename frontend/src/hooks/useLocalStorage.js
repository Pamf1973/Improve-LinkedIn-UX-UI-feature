import { useState, useCallback } from 'react';

export function useLocalStorage(key, initialValue) {
  const prefixedKey = 'mp_' + key;

  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = localStorage.getItem(prefixedKey);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    setStoredValue((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      localStorage.setItem(prefixedKey, JSON.stringify(next));
      return next;
    });
  }, [prefixedKey]);

  return [storedValue, setValue];
}
