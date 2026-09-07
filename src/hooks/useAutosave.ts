import { useState, useEffect, useRef, useCallback } from 'react';

export type AutosaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutosaveProps<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  intervalMs?: number;
  enabled?: boolean;
}

export function useAutosave<T>({
  data,
  onSave,
  intervalMs = 30000,
  enabled = true,
}: UseAutosaveProps<T>) {
  const [status, setStatus] = useState<AutosaveStatus>('idle');
  
  // Track the last saved version to avoid redundant saves
  const lastSavedData = useRef<T>(data);
  // Track current data in a ref so the interval closure always sees the latest
  const currentData = useRef<T>(data);
  
  // Keep the latest data ref up to date
  useEffect(() => {
    currentData.current = data;
    // If data changed since last save, transition to idle
    if (JSON.stringify(data) !== JSON.stringify(lastSavedData.current)) {
      if (status === 'saved') setStatus('idle');
    }
  }, [data, status]);

  const triggerSave = useCallback(async (isManual: boolean = false) => {
    const dataToSave = currentData.current;
    
    // Don't save if nothing changed, unless forced manually
    if (!isManual && JSON.stringify(dataToSave) === JSON.stringify(lastSavedData.current)) {
      return;
    }

    setStatus('saving');
    try {
      await onSave(dataToSave);
      lastSavedData.current = dataToSave;
      setStatus('saved');
      
      // Reset "saved" status back to "idle" after a few seconds
      setTimeout(() => {
        setStatus(prev => prev === 'saved' ? 'idle' : prev);
      }, 3000);
      
    } catch (err) {
      console.error('Autosave failed:', err);
      setStatus('error');
    }
  }, [onSave]);

  useEffect(() => {
    if (!enabled) return;

    const intervalId = setInterval(() => {
      triggerSave(false);
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [enabled, intervalMs, triggerSave]);

  return { status, triggerSave, setStatus };
}
