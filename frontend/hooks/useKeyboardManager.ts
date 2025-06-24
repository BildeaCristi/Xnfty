import { useState, useEffect, useCallback } from 'react';
import { KeyboardService, KeyboardCallbacks } from '@/services/keyboardService';

export function useKeyboardManager() {
  const [isInteractionKeyPressed, setIsInteractionKeyPressed] = useState(false);
  const [keyboardCallbacks, setKeyboardCallbacks] = useState<KeyboardCallbacks | null>(null);

  // Setup keyboard callbacks
  const setupKeyboardCallbacks = useCallback((callbacks: Partial<KeyboardCallbacks>) => {
    const fullCallbacks: KeyboardCallbacks = {
      onToggleControlMode: callbacks.onToggleControlMode || (() => {}),
      onToggleSettings: callbacks.onToggleSettings || (() => {}),
      onInteractionKeyDown: () => {
        setIsInteractionKeyPressed(true);
        callbacks.onInteractionKeyDown?.();
      },
      onInteractionKeyUp: () => {
        setIsInteractionKeyPressed(false);
        callbacks.onInteractionKeyUp?.();
      },
    };

    setKeyboardCallbacks(fullCallbacks);
    return fullCallbacks;
  }, []);

  // Initialize keyboard service
  useEffect(() => {
    if (keyboardCallbacks) {
      KeyboardService.initialize(keyboardCallbacks);

      return () => {
        KeyboardService.cleanup();
      };
    }
  }, [keyboardCallbacks]);

  const isKeyPressed = useCallback((key: string) => {
    return KeyboardService.isKeyPressed(key);
  }, []);

  const getMovementVector = useCallback(() => {
    return KeyboardService.getMovementVector();
  }, []);

  const isJumpPressed = useCallback(() => {
    return KeyboardService.isJumpPressed();
  }, []);

  const getKeyboardShortcuts = useCallback(() => {
    return KeyboardService.getKeyboardShortcuts();
  }, []);

  return {
    // State
    isInteractionKeyPressed,
    keyboardState: KeyboardService.getState(),
    
    // Setup
    setupKeyboardCallbacks,
    
    // Actions
    isKeyPressed,
    getMovementVector,
    isJumpPressed,
    getKeyboardShortcuts,
  };
} 