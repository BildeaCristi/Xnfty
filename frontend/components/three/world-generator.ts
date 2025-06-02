import * as THREE from 'three';

export class WorldGenerator {
  scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  generateBasicWorld() {
    // Create floor
    const floorGeometry = new THREE.PlaneGeometry(100, 100);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x444444,
      roughness: 0.8
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Create some objects
    this.addRandomCubes(30);
    this.addRandomSpheres(20);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 1);
    this.scene.add(ambientLight);

    // Add directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    this.scene.add(directionalLight);
  }

  addRandomCubes(count: number) {
    for (let i = 0; i < count; i++) {
      const size = 1 + Math.random() * 2;
      const geometry = new THREE.BoxGeometry(size, size, size);
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(Math.random(), Math.random(), Math.random())
      });
      const cube = new THREE.Mesh(geometry, material);

      cube.position.x = (Math.random() - 0.5) * 50;
      cube.position.y = size / 2;
      cube.position.z = (Math.random() - 0.5) * 50;

      cube.castShadow = true;
      cube.receiveShadow = true;

      this.scene.add(cube);
    }
  }

  addRandomSpheres(count: number) {
    for (let i = 0; i < count; i++) {
      const radius = 0.5 + Math.random();
      const geometry = new THREE.SphereGeometry(radius, 32, 32);
      const material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(Math.random(), Math.random(), Math.random())
      });
      const sphere = new THREE.Mesh(geometry, material);

      sphere.position.x = (Math.random() - 0.5) * 50;
      sphere.position.y = radius;
      sphere.position.z = (Math.random() - 0.5) * 50;

      sphere.castShadow = true;

      this.scene.add(sphere);
    }
  }
}