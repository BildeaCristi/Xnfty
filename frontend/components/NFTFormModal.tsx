"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { X } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

interface Trait {
  trait_type: string;
  value: string;
}

interface NFTFormModalProps {
  onSave: (data: {
    name: string;
    description: string;
    image: File | null;
    traits: Trait[];
    isFractional: boolean;
    totalShares?: number;
    pricePerShare?: number;
    price?: number;
    metadataUri?: string;
  }) => void;
  onCancel: () => void;
}

const NFTFormModal: React.FC<NFTFormModalProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [traits, setTraits] = useState<Trait[]>([]);
  const [isFractional, setIsFractional] = useState(true); // Default to fractional as per requirements
  const [totalShares, setTotalShares] = useState<number>(10); // Default to 10 shares as per requirements
  const [pricePerShare, setPricePerShare] = useState<number>(0);
  const [price, setPrice] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const textureRef = useRef<THREE.Texture | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      
      // Create preview URL for the image
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      
      // Load texture for 3D preview
      if (textureRef.current) {
        textureRef.current.dispose();
      }
      
      const textureLoader = new THREE.TextureLoader();
      textureRef.current = textureLoader.load(previewUrl);
      
      if (sceneRef.current) {
        updateSceneWithTexture();
      }
    }
  };

  const handleAddTrait = () => {
    setTraits([...traits, { trait_type: '', value: '' }]);
  };

  const handleTraitChange = (index: number, field: keyof Trait, value: string) => {
    const newTraits = [...traits];
    newTraits[index] = { ...newTraits[index], [field]: value };
    setTraits(newTraits);
  };

  const handleRemoveTrait = (index: number) => {
    setTraits(traits.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !image) {
      alert('Please provide a name and image for the NFT');
      return;
    }

    onSave({
      name,
      description,
      image,
      traits,
      isFractional,
      totalShares: isFractional ? totalShares : undefined,
      pricePerShare: isFractional ? pricePerShare : undefined,
      price: isFractional ? undefined : price,
    });
  };

  // Initialize 3D scene
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111827); // Dark background
    sceneRef.current = scene;
    
    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 1.5;
    cameraRef.current = camera;
    
    // Create renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
    });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    rendererRef.current = renderer;
    
    // Add controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;
    
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    // Create default plane with grid
    const planeGeometry = new THREE.PlaneGeometry(1, 1);
    const planeMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x444444,
      wireframe: true
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    scene.add(plane);
    
    // Animation loop
    const animate = () => {
      if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !controlsRef.current) {
        return;
      }
      
      controlsRef.current.update();
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Handle resize
    const handleResize = () => {
      if (!canvasRef.current || !rendererRef.current || !cameraRef.current) return;
      
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry) {
            object.geometry.dispose();
          }
          
          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach((material) => material.dispose());
            } else {
              object.material.dispose();
            }
          }
        }
      });
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      
      if (textureRef.current) {
        textureRef.current.dispose();
      }
      
      window.removeEventListener('resize', handleResize);
      
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, []);
  
  // Update scene with texture when image changes
  const updateSceneWithTexture = () => {
    if (!sceneRef.current || !textureRef.current) return;
    
    // Remove existing meshes
    sceneRef.current.children.forEach((child) => {
      if (child instanceof THREE.Mesh && !(child instanceof THREE.GridHelper)) {
        sceneRef.current?.remove(child);
      }
    });
    
    // Create plane with the texture
    const planeGeometry = new THREE.PlaneGeometry(1, 1);
    const planeMaterial = new THREE.MeshStandardMaterial({
      map: textureRef.current,
      side: THREE.DoubleSide,
    });
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    sceneRef.current.add(plane);
    
    // Adjust aspect ratio to match image
    if (textureRef.current.image) {
      const imgAspect = textureRef.current.image.width / textureRef.current.image.height;
      plane.scale.set(imgAspect, 1, 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Add NFT to Collection</h2>
          <button
            onClick={onCancel}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">NFT Name *</label>
              <input
                type="text"
                className="w-full p-2 border rounded dark:bg-gray-700"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                className="w-full p-2 border rounded dark:bg-gray-700"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Image *</label>
              <input
                type="file"
                accept="image/*"
                className="w-full p-2 border rounded dark:bg-gray-700"
                onChange={handleImageChange}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload a high-quality image for your NFT (PNG, JPG, or GIF)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                <span>Tokenomics</span>
              </label>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded">
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    id="fractional"
                    checked={isFractional}
                    onChange={(e) => setIsFractional(e.target.checked)}
                    className="rounded"
                  />
                  <label htmlFor="fractional">Fractional Ownership</label>
                </div>
                
                {isFractional ? (
                  <>
                    <div className="mb-2">
                      <label className="block text-sm font-medium mb-1">Total Shares</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="w-full p-2 border rounded dark:bg-gray-600"
                        value={totalShares}
                        onChange={(e) => setTotalShares(Number(e.target.value))}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Each NFT will be divided into this many shares (default: 10)
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Price per Share (ETH)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.0001"
                        className="w-full p-2 border rounded dark:bg-gray-600"
                        value={pricePerShare}
                        onChange={(e) => setPricePerShare(Number(e.target.value))}
                        required
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-sm font-medium mb-1">Price (ETH)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.0001"
                      className="w-full p-2 border rounded dark:bg-gray-600"
                      value={price}
                      onChange={(e) => setPrice(Number(e.target.value))}
                      required
                    />
                  </div>
                )}
              </div>
            </div>

            <div>
              <button
                type="button"
                className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
                onClick={() => setShowAdvanced(!showAdvanced)}
              >
                {showAdvanced ? '- Hide Advanced Options' : '+ Show Advanced Options'}
              </button>
              
              {showAdvanced && (
                <div className="mt-2">
                  <label className="block text-sm font-medium mb-1">Traits</label>
                  {traits.map((trait, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Trait Type"
                        className="flex-1 p-2 border rounded dark:bg-gray-700"
                        value={trait.trait_type}
                        onChange={(e) => handleTraitChange(index, 'trait_type', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        className="flex-1 p-2 border rounded dark:bg-gray-700"
                        value={trait.value}
                        onChange={(e) => handleTraitChange(index, 'value', e.target.value)}
                      />
                      <button
                        type="button"
                        className="px-2 text-red-500"
                        onClick={() => handleRemoveTrait(index)}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="mt-2 px-3 py-1 bg-gray-200 dark:bg-gray-700 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    onClick={handleAddTrait}
                  >
                    Add Trait
                  </button>
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
              <div className="p-2 bg-gray-900 text-white text-xs font-mono">
                3D Preview
              </div>
              <div className="relative" style={{ height: '300px' }}>
                <canvas
                  ref={canvasRef}
                  className="w-full h-full"
                />
                {!imagePreview && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                    <p>Upload an image to see 3D preview</p>
                  </div>
                )}
              </div>
            </div>
            
            {imagePreview && (
              <div className="mt-4">
                <h3 className="text-sm font-medium mb-2">Image Preview</h3>
                <div className="border rounded overflow-hidden">
                  <img 
                    src={imagePreview} 
                    alt="NFT Preview" 
                    className="w-full object-contain max-h-[200px]" 
                  />
                </div>
              </div>
            )}
            
            <div className="mt-4 space-y-2">
              <h3 className="text-sm font-medium">NFT Details Summary</h3>
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-sm">
                <p><strong>Name:</strong> {name || '-'}</p>
                <p><strong>Type:</strong> {isFractional ? 'Fractional NFT' : 'Standard NFT'}</p>
                {isFractional ? (
                  <p><strong>Pricing:</strong> {totalShares} shares at {pricePerShare} ETH each</p>
                ) : (
                  <p><strong>Price:</strong> {price} ETH</p>
                )}
                <p><strong>Traits:</strong> {traits.length > 0 ? traits.length : 'None'}</p>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2 flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              disabled={isLoading || !name || !image}
            >
              Add NFT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NFTFormModal; 