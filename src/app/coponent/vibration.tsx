import { useCallback } from 'react';

const useVibration = () => {
  const triggerVibration = useCallback((pattern = 100) => {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }, []);

  return triggerVibration;
};

export default useVibration;
