import { useGameState } from '@/hooks/useGameState';

export class InputController {
  private escapeHandler: (event: KeyboardEvent) => void;
  private mouseHandler: (event: MouseEvent) => void;

  constructor() {
    this.escapeHandler = this.handleEscapeKey.bind(this);
    this.mouseHandler = this.handleMouseMovement.bind(this);
  }

  setupListeners() {
    document.addEventListener('keydown', this.escapeHandler);
    document.addEventListener('mousemove', this.mouseHandler);
    document.addEventListener('click', this.lockPointer.bind(this));
  }

  removeListeners() {
    document.removeEventListener('keydown', this.escapeHandler);
    document.removeEventListener('mousemove', this.mouseHandler);
    document.removeEventListener('click', this.lockPointer);
  }

  handleEscapeKey(event: KeyboardEvent) {
    if (event.code === 'Escape') {
      const { togglePlaying } = useGameState.getState();
      togglePlaying();

      if (document.pointerLockElement) {
        document.exitPointerLock();
      }
    }
  }

  handleMouseMovement(event: MouseEvent) {
    const { isPlaying } = useGameState.getState();
    if (!isPlaying || !document.pointerLockElement) return;

    const customEvent = new CustomEvent('camera-rotate', {
      detail: { movementX: event.movementX, movementY: event.movementY }
    });
    document.dispatchEvent(customEvent);
  }

  lockPointer() {
    const { isPlaying } = useGameState.getState();
    if (isPlaying) {
      document.body.requestPointerLock();
    }
  }
}