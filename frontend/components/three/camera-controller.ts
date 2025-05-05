import * as THREE from 'three';

export class CameraController {
  camera: THREE.PerspectiveCamera;
  moveSpeed: number = 0.1;
  rotationSpeed: number = 0.002;
  moveForward: boolean = false;
  moveBackward: boolean = false;
  moveLeft: boolean = false;
  moveRight: boolean = false;
  velocity: THREE.Vector3;
  direction: THREE.Vector3;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
  }

  setupControls() {
    document.addEventListener('keydown', this.onKeyDown.bind(this));
    document.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  removeControls() {
    document.removeEventListener('keydown', this.onKeyDown.bind(this));
    document.removeEventListener('keyup', this.onKeyUp.bind(this));
  }

  onKeyDown(event: KeyboardEvent) {
    switch (event.code) {
      case 'KeyW':
        this.moveForward = true;
        break;
      case 'KeyA':
        this.moveLeft = true;
        break;
      case 'KeyS':
        this.moveBackward = true;
        break;
      case 'KeyD':
        this.moveRight = true;
        break;
    }
  }

  onKeyUp(event: KeyboardEvent) {
    switch (event.code) {
      case 'KeyW':
        this.moveForward = false;
        break;
      case 'KeyA':
        this.moveLeft = false;
        break;
      case 'KeyS':
        this.moveBackward = false;
        break;
      case 'KeyD':
        this.moveRight = false;
        break;
    }
  }

  update() {
    // Calculate velocity based on camera direction
    this.velocity.x = 0;
    this.velocity.z = 0;

    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();

    if (this.moveForward || this.moveBackward) {
      this.velocity.z = this.direction.z * this.moveSpeed;
    }
    if (this.moveLeft || this.moveRight) {
      this.velocity.x = this.direction.x * this.moveSpeed;
    }

    // Move the camera
    this.camera.translateZ(this.velocity.z);
    this.camera.translateX(this.velocity.x);
  }
}