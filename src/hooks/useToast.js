import { useCallback, useState } from 'react';
import { uid } from '../utils/date';

export function useToast() {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, tone = 'success') => {
    const id = uid();
    setToasts((items) => [...items, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((items) => items.filter((toast) => toast.id !== id));
    }, 3200);
  }, []);

  return { toasts, showToast };
}
