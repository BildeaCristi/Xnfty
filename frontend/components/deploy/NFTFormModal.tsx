"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { X, Plus, MinusCircle, Upload, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

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

  // Add an upload state to provide visual feedback
  const [isUploading, setIsUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'image' | 'model' | null>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setIsUploading(true);
      
      // Determine upload type
      if (file.type.startsWith('image/')) {
        setUploadType('image');
      } else if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
        setUploadType('model');
      }
      
      // Create preview URL for the image
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);

      // Let React render the canvas element
      requestAnimationFrame(() => {
        // Initialize or update 3D preview based on file type
        if (file.type.startsWith('image/')) {
          // For image files
          const textureLoader = new THREE.TextureLoader();
          
          textureLoader.load(previewUrl, (texture) => {
            if (textureRef.current) {
              textureRef.current.dispose();
            }
            textureRef.current = texture;
            
            // Update scene with the new texture (ensure the scene exists first)
            if (sceneRef.current) {
              updateSceneWithTexture();
            } else {
              // If scene doesn't exist yet, initialize it
              initScene();
              
              // Then update with texture after scene is initialized
              setTimeout(() => {
                updateSceneWithTexture();
              }, 50);
            }
            setIsUploading(false);
          }, 
          // Progress callback
          (xhr) => {
            // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
          },
          // Error callback
          (error) => {
            console.error('An error occurred loading the texture', error);
            setIsUploading(false);
          });
        } else if (file.name.endsWith('.glb') || file.name.endsWith('.gltf')) {
          // For 3D model files
          loadGLTFModel(previewUrl);
        }
      });
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

  // Update the loadGLTFModel function to handle loading state
  const loadGLTFModel = (url: string) => {
    if (!sceneRef.current) {
      initScene();
    }
    
    // Clear existing objects from scene except lights
    if (sceneRef.current) {
      sceneRef.current.traverse((object) => {
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
          sceneRef.current?.remove(object);
        }
      });
      
      // Load the GLTF model
      const loader = new GLTFLoader();
      loader.load(url, 
        // Success callback
        (gltf) => {
          const model = gltf.scene;
          
          // Center and scale model
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 1 / maxDim;
          model.scale.set(scale, scale, scale);
          
          // Center model
          const center = box.getCenter(new THREE.Vector3());
          model.position.x = -center.x * scale;
          model.position.y = -center.y * scale;
          model.position.z = -center.z * scale;
          
          // Add model to scene
          sceneRef.current?.add(model);
          
          // Add glow effect around model
          addGlowEffect();
          setIsUploading(false);
        },
        // Progress callback
        (xhr) => {
          // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        // Error callback
        (error) => {
          console.error('An error occurred loading the model', error);
          setIsUploading(false);
        }
      );
    }
  };

  // Update the initScene function
  const initScene = () => {
    if (!canvasRef.current) {
      console.log("Canvas ref not available");
      return;
    }
    
    try {
      console.log("Initializing THREE.js scene");
      
      // Create scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x070715);
      sceneRef.current = scene;
      
      // Get canvas dimensions
      const width = canvasRef.current.clientWidth || canvasRef.current.offsetWidth || 300;
      const height = canvasRef.current.clientHeight || canvasRef.current.offsetHeight || 300;
      
      console.log("Canvas dimensions:", width, height);
      
      // Create camera
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 1.5;
      cameraRef.current = camera;
      
      // Create renderer
      const renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current,
        antialias: true,
        alpha: true
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.2;
      rendererRef.current = renderer;
      
      // Add controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.autoRotate = true;
      controls.autoRotateSpeed = 1;
      controlsRef.current = controls;
      
      // Add ambient light
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
      scene.add(ambientLight);
      
      // Add directional light
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(1, 1, 1);
      scene.add(directionalLight);
      
      // Start animation loop
      const clock = new THREE.Clock();
      const animate = () => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current || !controlsRef.current) {
          return;
        }
        
        const elapsedTime = clock.getElapsedTime();
        
        // Update controls
        controlsRef.current.update();
        
        // Update any shader materials
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh && object.material instanceof THREE.ShaderMaterial) {
            if (object.material.uniforms && object.material.uniforms.uTime) {
              object.material.uniforms.uTime.value = elapsedTime;
            }
          }
        });
        
        // Render
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        animationFrameRef.current = requestAnimationFrame(animate);
      };
      
      // Start animation loop
      animate();
      
      // Force a resize handling to ensure correct dimensions
      setTimeout(() => {
        if (canvasRef.current && rendererRef.current && cameraRef.current) {
          const newWidth = canvasRef.current.clientWidth;
          const newHeight = canvasRef.current.clientHeight;
          
          cameraRef.current.aspect = newWidth / newHeight;
          cameraRef.current.updateProjectionMatrix();
          
          rendererRef.current.setSize(newWidth, newHeight);
        }
      }, 200);
      
      console.log("THREE.js scene initialization complete");
    } catch (error) {
      console.error("Error initializing scene:", error);
    }
  };

  // Add a glow effect to the model
  const addGlowEffect = () => {
    if (!sceneRef.current) return;
    
    // Create a glowing sphere around the model
    const glowGeometry = new THREE.SphereGeometry(1.05, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x00ffff) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;
        
        void main() {
          float intensity = 0.5 - distance(vUv, vec2(0.5, 0.5)) * 1.0;
          intensity = pow(intensity, 1.5);
          
          float pulse = sin(uTime * 2.0) * 0.5 + 0.5;
          vec3 color = uColor * mix(0.5, 1.0, pulse);
          
          gl_FragColor = vec4(color, intensity * 0.5);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    sceneRef.current.add(glow);
    
    // Animate glow
    const clock = new THREE.Clock();
    const animateGlow = () => {
      if (!sceneRef.current) return;
      
      const elapsedTime = clock.getElapsedTime();
      (glowMaterial as THREE.ShaderMaterial).uniforms.uTime.value = elapsedTime;
      
      requestAnimationFrame(animateGlow);
    };
    
    animateGlow();
  };

  // Update the initialization useEffect to ensure resize handling works properly
  useEffect(() => {
    if (!canvasRef.current) return;
    
    // Initialize 3D scene
    initScene();
    
    // Handle window resize
    const handleResize = () => {
      if (!canvasRef.current || !rendererRef.current || !cameraRef.current) return;
      
      const width = canvasRef.current.clientWidth;
      const height = canvasRef.current.clientHeight;
      
      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      
      rendererRef.current.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
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
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      
      if (textureRef.current) {
        textureRef.current.dispose();
      }
      
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Add an effect to handle canvas initialization and texture loading
  useEffect(() => {
    if (imagePreview && canvasRef.current) {
      // Initialize scene if needed
      if (!sceneRef.current) {
        console.log("Initializing scene from useEffect");
        initScene();
      }
      
      // Wait for the scene to be created
      setTimeout(() => {
        if (!textureRef.current) {
          // Load the texture
          const textureLoader = new THREE.TextureLoader();
          textureLoader.load(imagePreview, (texture) => {
            textureRef.current = texture;
            updateSceneWithTexture();
          });
        } else {
          // Update scene with existing texture
          updateSceneWithTexture();
        }
      }, 100);
    }
  }, [imagePreview, canvasRef.current]);

  const updateSceneWithTexture = () => {
    if (!sceneRef.current || !textureRef.current) return;
    
    // Remove existing objects except lights
    sceneRef.current.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        sceneRef.current?.remove(object);
      }
    });
    
    // Create a plane with the image
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
      map: textureRef.current,
      side: THREE.DoubleSide,
    });
    
    const plane = new THREE.Mesh(geometry, material);
    
    // Adjust aspect ratio
    if (textureRef.current.image) {
      const aspectRatio = textureRef.current.image.width / textureRef.current.image.height;
      if (aspectRatio > 1) {
        plane.scale.set(aspectRatio, 1, 1);
      } else {
        plane.scale.set(1, 1 / aspectRatio, 1);
      }
    }
    
    sceneRef.current.add(plane);
    
    // Add glow effect
    const glowGeometry = new THREE.PlaneGeometry(1.05, 1.05);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(0x00ffff) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColor;
        varying vec2 vUv;
        
        void main() {
          float edgeX = min(vUv.x, 1.0 - vUv.x);
          float edgeY = min(vUv.y, 1.0 - vUv.y);
          float edge = min(edgeX, edgeY);
          
          float pulse = sin(uTime * 2.0) * 0.5 + 0.5;
          vec3 color = uColor * mix(0.5, 1.0, pulse);
          
          float alpha = smoothstep(0.0, 0.1, edge);
          alpha = 1.0 - alpha;
          alpha *= 0.7 * pulse;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide
    });
    
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.z = -0.01;
    
    // Adjust glow aspect ratio
    if (textureRef.current.image) {
      const aspectRatio = textureRef.current.image.width / textureRef.current.image.height;
      if (aspectRatio > 1) {
        glow.scale.set(aspectRatio, 1, 1);
      } else {
        glow.scale.set(1, 1 / aspectRatio, 1);
      }
    }
    
    sceneRef.current.add(glow);
    
    // Animate glow
    const clock = new THREE.Clock();
    const animateGlow = () => {
      if (!sceneRef.current) return;
      
      const elapsedTime = clock.getElapsedTime();
      (glowMaterial as THREE.ShaderMaterial).uniforms.uTime.value = elapsedTime;
      
      requestAnimationFrame(animateGlow);
    };
    
    animateGlow();
  };

  // Add useEffect hook to disable body scrolling when modal is open
  useEffect(() => {
    // Disable scrolling on the body when modal is open
    document.body.style.overflow = 'hidden';
    
    // Re-enable scrolling when component unmounts
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[60] p-2 sm:p-4 overflow-hidden">
      <div className="bg-gradient-to-br from-gray-900/90 to-purple-900/50 backdrop-blur-xl border border-cyan-500/20 rounded-xl w-full max-w-4xl max-h-[95vh] overflow-hidden shadow-lg shadow-cyan-500/20 flex flex-col">
        <div className="p-4 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-cyan-500/20 scrollbar-track-transparent">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-300">Add NFT</h2>
            <button 
              onClick={onCancel}
              className="p-1 text-cyan-300 hover:text-cyan-100 transition-colors focus:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Left Column: Image Preview & Upload */}
              <div className="space-y-3 sm:space-y-4">
                <div className="rounded-xl overflow-hidden aspect-square bg-black/30 relative">
                  {imagePreview ? (
                    <div className="relative w-full h-full">
                      <canvas 
                        ref={canvasRef}
                        className="w-full h-full object-cover bg-gradient-to-br from-purple-900/20 to-cyan-900/20 border border-cyan-500/20 rounded-xl"
                        style={{
                          display: 'block',
                          width: '100%',
                          height: '100%'
                        }}
                      />
                      {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
                          <div className="p-3 bg-black/80 rounded-lg flex flex-col items-center">
                            <Loader2 className="w-8 h-8 text-cyan-300 animate-spin mb-2" />
                            <span className="text-cyan-200 text-sm">
                              Loading {uploadType === 'model' ? '3D Model' : 'Image'}...
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview('');
                            setImage(null);
                            setUploadType(null);
                          }}
                          className="p-1.5 rounded-full bg-red-500/30 text-white hover:bg-red-500/50 transition-colors"
                          title="Remove Image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <div className="px-2 py-1 bg-black/60 backdrop-blur-sm text-xs text-cyan-200 rounded-full border border-cyan-500/20">
                          {uploadType === 'model' ? '3D Model' : 'Preview'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full p-4 sm:p-6 text-center border-2 border-dashed border-cyan-500/30 rounded-xl group-hover:border-cyan-500/50 transition-all">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 flex items-center justify-center mb-3">
                        <Upload className="w-6 h-6 sm:w-8 sm:h-8 text-cyan-300" />
                      </div>
                      <p className="text-cyan-200 mb-2 text-sm sm:text-base">Drop image or 3D model</p>
                      <p className="text-cyan-200/60 text-xs mb-3">Supports JPG, PNG, GIF, GLB, GLTF</p>
                      <label className="cursor-pointer py-1.5 px-3 sm:py-2 sm:px-4 rounded-md bg-gradient-to-r from-cyan-500/50 to-purple-600/50 text-white text-xs sm:text-sm border border-cyan-500/30 hover:from-cyan-400/50 hover:to-purple-500/50 transition-all">
                        Browse Files
                        <input 
                          type="file" 
                          accept="image/*,.glb,.gltf" 
                          onChange={handleImageChange} 
                          className="hidden" 
                        />
                      </label>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right Column: NFT Details */}
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-1">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-black/30 border border-cyan-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/60"
                    placeholder="NFT Name"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-cyan-200 mb-1">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 bg-black/30 border border-cyan-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/60"
                    placeholder="Describe your NFT"
                  />
                </div>
                
                <div>
                  <label className="flex items-center mb-3">
                    <input
                      type="checkbox"
                      checked={isFractional}
                      onChange={(e) => setIsFractional(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="relative w-9 h-5 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-cyan-500/50 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-600"></div>
                    <span className="ms-2 text-sm text-cyan-200">Fractional NFT</span>
                  </label>
                  
                  {isFractional ? (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-cyan-200 mb-1">Total Shares</label>
                        <input
                          type="number"
                          min="1"
                          value={totalShares}
                          onChange={(e) => setTotalShares(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-black/30 border border-cyan-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/60"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-cyan-200 mb-1">Price Per Share (ETH)</label>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={pricePerShare}
                          onChange={(e) => setPricePerShare(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-black/30 border border-cyan-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/60"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-cyan-200 mb-1">Price (ETH)</label>
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-black/30 border border-cyan-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/60"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Traits Section */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center text-cyan-300 hover:text-cyan-100 transition-colors mb-2 text-sm"
              >
                {showAdvanced ? (
                  <ChevronUp className="w-4 h-4 mr-1" />
                ) : (
                  <ChevronDown className="w-4 h-4 mr-1" />
                )}
                {showAdvanced ? 'Hide Advanced' : 'Show Advanced'}
              </button>
              
              {showAdvanced && (
                <div className="space-y-3 py-2 px-3 rounded-lg border border-cyan-500/20 bg-black/30">
                  <div className="flex justify-between items-center">
                    <h3 className="text-base font-medium text-cyan-200">Traits</h3>
                    <button
                      type="button"
                      onClick={handleAddTrait}
                      className="text-cyan-300 hover:text-cyan-100 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {traits.map((trait, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={trait.trait_type}
                        onChange={(e) => handleTraitChange(index, 'trait_type', e.target.value)}
                        placeholder="Type"
                        className="px-2 py-1.5 bg-black/30 border border-purple-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/60 flex-1"
                      />
                      <input
                        type="text"
                        value={trait.value}
                        onChange={(e) => handleTraitChange(index, 'value', e.target.value)}
                        placeholder="Value"
                        className="px-2 py-1.5 bg-black/30 border border-cyan-500/30 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500/60 flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveTrait(index)}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <MinusCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  
                  {traits.length === 0 && (
                    <p className="text-cyan-200/60 text-xs py-2">Add traits to your NFT (color, size, rarity, etc.)</p>
                  )}
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                onClick={onCancel}
                className="px-3 py-1.5 rounded-lg bg-gray-800 text-gray-200 hover:bg-gray-700 transition-colors text-sm"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500/80 to-purple-600/80 hover:from-cyan-400/80 hover:to-purple-500/80 
                text-white text-sm font-medium transition-all duration-300 backdrop-blur-sm border border-cyan-400/30 
                shadow-[0_0_10px_rgba(0,255,255,0.3)] hover:shadow-[0_0_15px_rgba(0,255,255,0.5)]"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Add NFT'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NFTFormModal; 