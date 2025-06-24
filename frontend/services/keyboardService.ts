import { KEYBOARD_CONTROLS, CONTROL_MODES } from '@/utils/constants/museumConstants';

export type KeyboardCallbacks = {
  onToggleControlMode: () => void;
  onToggleSettings: () => void;
  onInteractionKeyDown: () => void;
  onInteractionKeyUp: () => void;
};

export type KeyboardState = {
  isInteractionKeyPressed: boolean;
  activeKeys: Set<string>;
};

export class KeyboardService {
  private static callbacks: KeyboardCallbacks | null = null;
  private static state: KeyboardState = {
    isInteractionKeyPressed: false,
    activeKeys: new Set(),
  };
  private static isListening = false;

  static initialize(callbacks: KeyboardCallbacks): void {
    this.callbacks = callbacks;
    this.startListening();
  }

  static getState(): KeyboardState {
    return {
      isInteractionKeyPressed: this.state.isInteractionKeyPressed,
      activeKeys: new Set(this.state.activeKeys),
    };
  }

  static isInteractionKeyPressed(): boolean {
    return this.state.isInteractionKeyPressed;
  }

  static isKeyPressed(key: string): boolean {
    return this.state.activeKeys.has(key.toLowerCase());
  }

  private static startListening(): void {
    if (this.isListening) return;

    document.addEventListener('keydown', this.handleKeyDown);
    document.addEventListener('keyup', this.handleKeyUp);
    this.isListening = true;
  }

  private static stopListening(): void {
    if (!this.isListening) return;

    document.removeEventListener('keydown', this.handleKeyDown);
    document.removeEventListener('keyup', this.handleKeyUp);
    this.isListening = false;
  }

  private static handleKeyDown = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    this.state.activeKeys.add(key);

    // Handle specific shortcuts
    if (this.isToggleControlKey(event.key)) {
      event.preventDefault();
      this.callbacks?.onToggleControlMode();
    }

    if (this.isToggleSettingsKey(event.key)) {
      event.preventDefault();
      this.callbacks?.onToggleSettings();
    }

    if (this.isInteractionKey(event.key)) {
      if (!this.state.isInteractionKeyPressed) {
        this.state.isInteractionKeyPressed = true;
        this.callbacks?.onInteractionKeyDown();
      }
    }
  };

  private static handleKeyUp = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    this.state.activeKeys.delete(key);

    if (this.isInteractionKey(event.key)) {
      this.state.isInteractionKeyPressed = false;
      this.callbacks?.onInteractionKeyUp();
    }
  };

  private static isToggleControlKey(key: string): boolean {
    return KEYBOARD_CONTROLS.TOGGLE_CONTROL.includes(key);
  }

  private static isToggleSettingsKey(key: string): boolean {
    return key === KEYBOARD_CONTROLS.TOGGLE_SETTINGS;
  }

  private static isInteractionKey(key: string): boolean {
    return KEYBOARD_CONTROLS.INTERACTION.includes(key);
  }

  static getMovementVector(): { x: number; z: number } {
    let x = 0;
    let z = 0;

    if (this.isKeyPressed('w') || this.isKeyPressed('arrowup')) z -= 1;
    if (this.isKeyPressed('s') || this.isKeyPressed('arrowdown')) z += 1;
    if (this.isKeyPressed('a') || this.isKeyPressed('arrowleft')) x -= 1;
    if (this.isKeyPressed('d') || this.isKeyPressed('arrowright')) x += 1;

    // Normalize diagonal movement
    if (x !== 0 && z !== 0) {
      const length = Math.sqrt(x * x + z * z);
      x /= length;
      z /= length;
    }

    return { x, z };
  }

  static isJumpPressed(): boolean {
    return this.isKeyPressed(' ') || this.isKeyPressed('space');
  }

  static getKeyboardShortcuts(): Array<{ key: string; description: string; active?: boolean }> {
    return [
      {
        key: KEYBOARD_CONTROLS.TOGGLE_CONTROL.join(', '),
        description: 'Toggle camera mode',
      },
      {
        key: KEYBOARD_CONTROLS.TOGGLE_SETTINGS,
        description: 'Open settings',
      },
      {
        key: KEYBOARD_CONTROLS.INTERACTION.join(', '),
        description: 'Interaction mode',
        active: this.state.isInteractionKeyPressed,
      },
      {
        key: 'WASD',
        description: 'Move (First person)',
      },
      {
        key: 'Space',
        description: 'Jump (First person)',
      },
    ];
  }

  static cleanup(): void {
    this.stopListening();
    this.state = {
      isInteractionKeyPressed: false,
      activeKeys: new Set(),
    };
    this.callbacks = null;
  }
} 