# Three.js WebGPU & TSL Comprehensive Reference

This unified reference document compiles best practices, patterns, and implementation details from working projects that use Three.js WebGPU renderer and Three.js Shading Language (TSL).

## Table of Contents

1. [Introduction](#introduction)
2. [Project Setup](#project-setup)
3. [Import Patterns](#import-patterns)
4. [WebGPU Initialization](#webgpu-initialization)
5. [TSL Node Material System](#tsl-node-material-system)
6. [Compute Shaders](#compute-shaders)
7. [Structured GPU Data](#structured-gpu-data)
8. [Geometry and Mesh Creation](#geometry-and-mesh-creation)
9. [Post-Processing](#post-processing)
10. [Animation and Rendering](#animation-and-rendering)
11. [Environment Mapping](#environment-mapping)
12. [Advanced Techniques](#advanced-techniques)
13. [Development Setup](#development-setup)
14. [Key APIs and Techniques](#key-apis-and-techniques)
15. [Common Patterns and Best Practices](#common-patterns-and-best-practices)
16. [Project-Specific Components](#project-specific-components)

## Introduction

WebGPU is a modern graphics API that provides low-level control of GPU acceleration with a clean, consistent interface. Three.js v0.164+ introduces a WebGPU renderer and the Three.js Shading Language (TSL), which allows writing shaders in JavaScript/TypeScript.

This documentation is based on several working projects:
- Raymarching TSL
- Flow (MLS-MPM simulation)
- Vortex Glass Sphere
- Matrix Sentinels
- TSL GPGPU Particles
- Portfolio WebGPU examples

## Project Setup

Typical project configuration:

- **Version**: Three.js r176-r177
- **Renderer**: WebGPU renderer
- **Shader System**: TSL (Three.js Shader Language)
- **Additional Libraries**: 
  - drei components
  - leva for UI controls

## Import Patterns

WebGPU components in Three.js follow specific import patterns:

```javascript
// Core Three.js with WebGPU
import * as THREE from "three/webgpu";

// TSL components
import { 
  float, vec2, vec3, vec4, mat3, mat4,
  Fn, uniform, attribute, varying, 
  If, Loop, Break, Return,
  instanceIndex, 
  texture, storage, 
  mrt, output, pass,
  timerLocal, time
} from "three/tsl";

// WebGPU-specific classes
import {
  ComputeNode,
  MeshStandardNodeMaterial,
  MeshBasicNodeMaterial,
  SpriteNodeMaterial,
  PointsNodeMaterial,
  StorageBufferNode,
  StorageInstancedBufferAttribute,
  StructuredArray,
  WebGPURenderer
} from "three/webgpu";

// Examples and loaders
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

// TSL display features
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
```

**React Three Fiber Integration**:

```jsx
import { Canvas } from '@react-three/fiber'
import { WebGPURenderer } from 'three/webgpu'
import WebGPUCapabilities from 'three/examples/jsm/capabilities/WebGPU.js'
```

## WebGPU Initialization

WebGPU requires asynchronous initialization. Here are the main patterns:

### Vanilla JS Initialization

```javascript
// Check WebGPU availability
if (!navigator.gpu) {
  console.error("WebGPU not supported");
  // Fallback or error handling
  return;
}

// Create renderer
const renderer = new THREE.WebGPURenderer({
  // Options
  // forceWebGL: false,  // Fall back to WebGL when WebGPU is unavailable
  antialias: true,
  // alpha: true,
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

// Critical: await initialization
await renderer.init();

// Optional: Check if WebGPU was successful
if (!renderer.backend.isWebGPUBackend) {
  console.error("Couldn't initialize WebGPU");
  // Handle fallback or error
}

// Enable color management
THREE.ColorManagement.enabled = true;
```

### Project-Specific Implementation

```js
const createRenderer = () => {
    const renderer = new THREE.WebGPURenderer({
        // Optional settings
        // forceWebGL: true,
        // antialias: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    return renderer;
}

// Initialize WebGPU
const renderer = createRenderer();
await renderer.init();

// Color management is enabled
THREE.ColorManagement.enabled = true;
```

### React Three Fiber Integration

```jsx
const WebGPUCanvas = ({ children, ...props }) => {
  const [canvasFrameloop, setCanvasFrameloop] = useState('never');
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    if (initializing) return;
    setCanvasFrameloop('always');
  }, [initializing]);

  const webGPUAvailable = WebGPUCapabilities.isAvailable();

  return (
    <Canvas
      {...props}
      frameloop={canvasFrameloop}
      gl={(canvas) => {
        const renderer = new WebGPURenderer({
          canvas,
          antialias: true,
          forceWebGL: !webGPUAvailable,
        });
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        
        // Initialize asynchronously
        renderer.init().then(() => {
          setInitializing(false);
        });

        return renderer;
      }}
    >
      {children}
    </Canvas>
  );
};
```

## TSL Node Material System

TSL enables writing shaders using JavaScript-like syntax with a node-based approach.

### Creating Node Materials

```javascript
// Basic material
const material = new THREE.MeshBasicNodeMaterial();
material.colorNode = vec3(1, 0, 0); // Red color

// Standard material with lighting
const material = new THREE.MeshStandardNodeMaterial({
  metalness: 0.9,
  roughness: 0.5,
});

// Sprite material for particles
const material = new THREE.SpriteNodeMaterial({
  transparent: true,
  depthWrite: false,
  sizeAttenuation: true,
  blending: THREE.AdditiveBlending,
});

// Points material
const material = new THREE.PointsNodeMaterial({
  sizeAttenuation: true,
  transparent: true,
  alphaTest: 0.1,
});
```

### Node Properties

Materials in TSL have special node properties that accept shader expressions:

```javascript
// Setting common properties
material.colorNode = vec3(1, 0, 0);
material.opacityNode = float(0.5);
material.alphaTestNode = float(0.1);
material.normalNode = normalLocal;
material.emissiveNode = vec3(0.5, 0, 0);
material.roughnessNode = float(0.5);
material.metalnessNode = float(0.8);
material.aoNode = float(1.0);

// Custom position for vertex displacement
material.positionNode = Fn(() => {
  const offset = vec3(sin(time), 0, 0);
  return position().add(offset);
})();

// Fragment shader overrides
material.fragmentNode = Fn(() => {
  return vec4(1, 0, 0, 1);
})();
```

### Project-Specific Implementation

```js
// Create material
this.material = new THREE.MeshStandardNodeMaterial({
    metalness: 0.900,
    roughness: 0.50,
});

// Define varying variables for shader communication
const vAo = varying(float(0), "vAo");
const vNormal = varying(vec3(0), "v_normalView");

// Custom vertex positioning
this.material.positionNode = Fn(() => {
    const particlePosition = particle.get("position");
    const particleDensity = particle.get("density");
    const particleDirection = particle.get("direction");
    
    const mat = calcLookAtMatrix(particleDirection.xyz);
    vNormal.assign(transformNormalToView(mat.mul(normalLocal)));
    vAo.assign(particlePosition.z.div(64));
    vAo.assign(vAo.mul(vAo).oneMinus());
    
    return mat.mul(attribute("position").xyz.mul(this.uniforms.size))
        .mul(particleDensity.mul(0.4).add(0.5).clamp(0,1))
        .add(particlePosition.mul(vec3(1,1,0.4)));
})();

// Direct property assignment
this.material.colorNode = particle.get("color");
this.material.aoNode = vAo;
```

### Creating Functions

TSL allows creating reusable shader functions:

```javascript
// Signed Distance Function for a sphere
const sdSphere = Fn(([p, r]) => {
  return p.length().sub(r);
});

// Smoothed minimum function
const smin = Fn(([a, b, k]) => {
  const h = max(k.sub(abs(a.sub(b))), 0).div(k);
  return min(a, b).sub(h.mul(h).mul(k).mul(0.25));
});

// Using the functions
const result = sdSphere(position, 0.5);
const smoothResult = smin(sphere1, sphere2, 0.3);
```

### Project-Specific Function Example

```js
// Look-at matrix calculation
export const calcLookAtMatrix = /*#__PURE__*/ Fn(([target_immutable]) => {
    const target = vec3(target_immutable).toVar();
    const rr = vec3(0,0,1.0).toVar();
    const ww = vec3(normalize(target)).toVar();
    const uu = vec3(normalize(cross(ww, rr)).negate()).toVar();
    const vv = vec3(normalize(cross(uu, ww)).negate()).toVar();

    return mat3(uu, vv, ww);
}).setLayout({
    name: 'calcLookAtMatrix',
    type: 'mat3',
    inputs: [
        { name: 'direction', type: 'vec3' },
    ]
});
```

### Temporary Variables with toVar()

Use `toVar()` to create temporary variables that can be modified:

```javascript
const direction = normalize(velocity).toVar();
direction.assign(direction.add(acceleration.mul(deltaTime)));

// Naming variables for debugging
const flowField = curlNoise4d(vec4(position, time)).toVar('flowField');
```

### Control Flow

TSL provides control flow structures:

```javascript
// If statement
If(distance.lessThan(0.001), () => {
  color.assign(vec3(1, 0, 0));
});

// If-else
If(distance.lessThan(0.001), 
  () => {
    // True branch
    color.assign(vec3(1, 0, 0));
  }, 
  () => {
    // False branch
    color.assign(vec3(0, 0, 1));
  }
);

// Loops
Loop({ start: 0, end: 100 }, (i) => {
  // Loop body
  position.addAssign(velocity.mul(0.01));
});

// Early return or break
If(condition, () => {
  Break();
  // or
  Return();
});
```

### Using Uniforms, Varyings, and Attributes

```javascript
// Uniforms
const sizeUniform = uniform(1.0);
const colorUniform = uniform(new THREE.Color("#FF0000"));
const timeUniform = uniform(0);

// Updating uniforms
sizeUniform.value = 2.0;
colorUniform.value.set("#00FF00");
timeUniform.value = clock.getElapsedTime();

// Varyings for passing data between vertex and fragment
const vNormal = varying(vec3(0), "v_normal");
const vColor = varying(vec3(1, 0, 0), "v_color");

// In vertex shader
vNormal.assign(normalWorld);
vColor.assign(color);

// In fragment shader
const normal = normalize(vNormal);

// Accessing geometry attributes
const position = attribute("position");
const normal = attribute("normal");
const uv = attribute("uv");
```

### Textures

```javascript
// Load texture
const textureLoader = new THREE.TextureLoader();
const baseTexture = textureLoader.load('texture.jpg');

// Use in material
const textureNode = texture(baseTexture);
material.colorNode = textureNode;

// UV transformations
material.colorNode = texture(baseTexture, uv().mul(2));

// Texture with transformations
material.colorNode = Fn(() => {
  const tex = texture(baseTexture);
  return tex.mul(vec3(1.2, 1.0, 0.8)); // Tint
})();
```

### Multi-Render Target (MRT) Setup

```js
// Configure material for bloom
this.material.mrtNode = bloom ? mrt({
    bloomIntensity: float(1)
}) : null;

// In post-processing setup
const scenePass = pass(this.scene, this.camera);
scenePass.setMRT(mrt({
    output,
    bloomIntensity: float(0) // default bloom intensity
}));
const outputPass = scenePass.getTextureNode();
const bloomIntensityPass = scenePass.getTextureNode('bloomIntensity');
const bloomPass = bloom(outputPass.mul(bloomIntensityPass));
```

## Compute Shaders

TSL enables GPU compute operations for simulations and data processing.

### Creating Compute Kernels

```javascript
// Simple compute kernel
const updatePositions = Fn(() => {
  // Early return for out-of-bounds
  If(instanceIndex.greaterThanEqual(uint(particleCount)), () => {
    Return();
  });
  
  // Get current particle
  const position = positionBuffer.element(instanceIndex);
  const velocity = velocityBuffer.element(instanceIndex);
  
  // Update position
  position.addAssign(velocity.mul(deltaTime));
})().compute(particleCount);

// Using the compute kernel
await renderer.computeAsync(updatePositions);
```

### Project-Specific Compute Example

```js
// Grid clearing compute kernel
this.kernels.clearGrid = Fn(() => {
    // Configure atomic operations
    this.cellBuffer.setAtomic("x", false);
    this.cellBuffer.setAtomic("y", false);
    this.cellBuffer.setAtomic("z", false);
    this.cellBuffer.setAtomic("mass", false);

    // Early return for out-of-bounds indices
    If(instanceIndex.greaterThanEqual(uint(cellCount)), () => {
        Return();
    });

    // Clear cell data
    this.cellBuffer.element(instanceIndex).get('x').assign(0);
    this.cellBuffer.element(instanceIndex).get('y').assign(0);
    this.cellBuffer.element(instanceIndex).get('z').assign(0);
    this.cellBuffer.element(instanceIndex).get('mass').assign(0);
    this.cellBufferF.element(instanceIndex).assign(0);
})().compute(cellCount);

// Execute compute shader
await this.renderer.computeAsync(this.kernels.clearGrid);
```

### Simulation Example

This example from the Flow project shows a more complex simulation kernel:

```javascript
const p2gCompute = Fn(() => {
  If(instanceIndex.greaterThanEqual(uint(particleCount)), () => {
    Return();
  });
  
  // Get particle data
  const particle = particleBuffer.element(instanceIndex);
  const pos = particle.get("position");
  const vel = particle.get("velocity");
  const mass = particle.get("mass");
  
  // Convert to grid cell
  const cellIdx = pos.div(cellSize).floor();
  
  // For each neighboring cell
  Loop({ start: 0, end: 27 }, (i) => {
    // Calculate weight
    const weight = calculateWeight(pos, cellIdx, i);
    
    // Transfer mass and momentum to grid
    const cellId = getCellId(cellIdx, i);
    cellBuffer.element(cellId).get("mass").atomicAdd(mass.mul(weight));
    cellBuffer.element(cellId).get("velocity").atomicAdd(vel.mul(mass).mul(weight));
  });
})().compute(particleCount);
```

### Material Point Method (MPM) Implementation

```js
// Particle update function
this.kernels.p2g = Fn(() => {
    // Skip out-of-bounds particles
    If(instanceIndex.greaterThanEqual(uint(this.numParticles)), () => {
        Return();
    });
    
    // Get particle data
    const particle = this.particleBuffer.element(instanceIndex);
    const position = particle.get("position").toVar();
    const velocity = particle.get("velocity").toVar();
    const mass = particle.get("mass");
    
    // Calculate grid cell
    const cell = floor(position.div(cellSize)).toVar();
    
    // Transfer particle data to grid cells (P2G)
    // ... MPM algorithm implementation ...
    
    // Update particle properties
    particle.get("velocity").assign(newVelocity);
    particle.get("position").assign(newPosition);
})().compute(this.numParticles);
```

### Particle System Initialization

```javascript
// Initialize particles
const initCompute = Fn(() => {
  If(instanceIndex.greaterThanEqual(uint(particleCount)), () => {
    Return();
  });
  
  // Random positions
  const randX = hash(instanceIndex).sub(0.5).mul(2);
  const randY = hash(instanceIndex.add(1234)).sub(0.5).mul(2);
  const randZ = hash(instanceIndex.add(5678)).sub(0.5).mul(2);
  
  particleBuffer.element(instanceIndex).get("position").assign(vec3(randX, randY, randZ));
  particleBuffer.element(instanceIndex).get("velocity").assign(vec3(0));
})().compute(particleCount);

// Initialize on startup
await renderer.computeAsync(initCompute);
```

## Structured GPU Data

TSL provides a structured way to manage GPU data using `StructuredArray`.

### Creating a Structured Array

```javascript
// Define a structure for particles
const particleStruct = {
  position: { type: 'vec3' },
  velocity: { type: 'vec3' },
  mass: { type: 'float' },
  color: { type: 'vec3' },
  age: { type: 'float' },
};

// Create a structured array with this layout
const particleBuffer = new StructuredArray(particleStruct, particleCount, "particleData");

// For atomic operations (used in grid-based simulations)
const cellStruct = {
  mass: { type: 'float', atomic: true },
  velocity: { type: 'vec3', atomic: true },
};
const cellBuffer = new StructuredArray(cellStruct, cellCount, "cellData");
```

### Project-Specific Structured Arrays

```js
// Particle data structure
const particleStruct = {
    position: { type: 'vec3' },
    density: { type: 'float' },
    velocity: { type: 'vec3' },
    mass: { type: 'float' },
    C: { type: 'mat3' },
    direction: { type: 'vec3' },
    color: { type: 'vec3' },
};
this.particleBuffer = new StructuredArray(particleStruct, maxParticles, "particleData");

// Grid cell structure with atomic operations
const cellStruct = {
    x: { type: 'int', atomic: true },
    y: { type: 'int', atomic: true },
    z: { type: 'int', atomic: true },
    mass: { type: 'int', atomic: true },
};
this.cellBuffer = new StructuredArray(cellStruct, cellCount, "cellData");
```

### Using Structured Arrays

```javascript
// Access an element
const particle = particleBuffer.element(instanceIndex);

// Get a specific property
const position = particle.get("position");
const velocity = particle.get("velocity");

// Modify properties
particle.get("position").addAssign(velocity.mul(deltaTime));
particle.get("age").addAssign(deltaTime);

// Atomic operations (for grid-based simulations)
cellBuffer.element(cellIndex).get("mass").atomicAdd(mass);
```

### Setting PBO for Rendering

For rendering with the data, enable PBO (Pixel Buffer Object):

```javascript
// Create a buffer that can be used for both compute and rendering
const positionBuffer = storage(
  new StorageInstancedBufferAttribute(particleCount, 3),
  'vec3',
  particleCount
).setPBO(true);

// Use in material
material.positionNode = positionBuffer.element(instanceIndex);
```

## Geometry and Mesh Creation

### Creating Particles with InstancedMesh

```javascript
// Create an instanced mesh for particles
const geometry = new THREE.PlaneGeometry();
const material = new THREE.SpriteNodeMaterial({
  transparent: true,
  depthWrite: false,
  sizeAttenuation: true,
  blending: THREE.AdditiveBlending,
});

const particleMesh = new THREE.InstancedMesh(geometry, material, particleCount);
particleMesh.frustumCulled = false;

// Connect buffer to material
material.positionNode = positionBuffer.element(instanceIndex);
material.scaleNode = sizeBuffer.element(instanceIndex);
material.colorNode = colorBuffer.element(instanceIndex);
```

### Dynamic Geometry

```javascript
// Create a geometry
const geometry = new THREE.BoxGeometry(1, 1, 1);

// Modify geometry dynamically
geometry.attributes.position.array[0] += Math.sin(time);
geometry.attributes.position.needsUpdate = true;
```

## Post-Processing

TSL enables efficient post-processing with node-based effects.

### Basic Post-Processing Setup

```javascript
// Create a scene pass
const scenePass = pass(scene, camera);

// Get the texture node from the pass
const outputPass = scenePass.getTextureNode();

// Create a post-processing object
const postProcessing = new THREE.PostProcessing(renderer);

// Set the output node
postProcessing.outputNode = outputPass.renderOutput();

// Render with post-processing
await postProcessing.renderAsync();
```

### Multi-Render Target (MRT) for Effects

```javascript
// Set up MRT in the material
material.mrtNode = mrt({
  bloomIntensity: float(1.0)
});

// In the scene pass
scenePass.setMRT(mrt({
  output,
  bloomIntensity: float(0)
}));

// Get texture nodes
const outputPass = scenePass.getTextureNode();
const bloomIntensityPass = scenePass.getTextureNode('bloomIntensity');

// Create bloom effect
const bloomPass = bloom(outputPass.mul(bloomIntensityPass));
bloomPass.threshold.value = 0.001;
bloomPass.strength.value = 0.94;
bloomPass.radius.value = 0.8;

// Combine effects
postProcessing.outputNode = Fn(() => {
  const baseColor = outputPass.rgb.clamp(0, 1).toVar();
  const bloomColor = bloomPass.rgb.clamp(0, 1).toVar();
  
  // Custom blend formula
  return vec4(
    baseColor.add(bloomColor.mul(0.5)).clamp(0, 1),
    1.0
  );
})().renderOutput();
```

### Project-Specific Post-Processing

```js
// Create post-processing object
const postProcessing = new THREE.PostProcessing(this.renderer);
postProcessing.outputColorTransform = false;

// Custom output node for bloom blending
postProcessing.outputNode = Fn(() => {
    const a = outputPass.rgb.clamp(0,1).toVar();
    const b = bloomPass.rgb.clamp(0,1).mul(bloomIntensityPass.r.sign().oneMinus()).toVar();
    return vec4(vec3(1).sub(b).sub(b).mul(a).mul(a).add(b.mul(a).mul(2)).clamp(0,1),1.0);
})().renderOutput();

// Render with post-processing in render loop
if (conf.bloom) {
    await this.postProcessing.renderAsync();
} else {
    await this.renderer.renderAsync(this.scene, this.camera);
}
```

### Full Raymarching Post-Processing Example

```javascript
// Define a raymarching material
const raymarchMaterial = new MeshBasicNodeMaterial();

// SDF functions
const sdSphere = Fn(([p, r]) => {
  return p.length().sub(r);
});

// Raymarching function
const raymarch = Fn(() => {
  // Normalized screen coordinates
  const _uv = uv().mul(viewportResolution.xy).mul(2).sub(viewportResolution.xy).div(viewportResolution.y);
  
  // Ray setup
  const rayOrigin = vec3(0, 0, -3);
  const rayDirection = vec3(_uv, 1).normalize();
  const t = float(0).toVar();
  const ray = rayOrigin.add(rayDirection.mul(t)).toVar();
  
  // Ray marching loop
  Loop({ start: 1, end: 80 }, () => {
    const d = sdf(ray);
    t.addAssign(d);
    ray.assign(rayOrigin.add(rayDirection.mul(t)));
    
    // Early exit conditions
    If(d.lessThan(0.001), () => { Break(); });
    If(t.greaterThan(100), () => { Break(); });
  });
  
  // Lighting calculation
  return lighting(rayOrigin, ray);
})();

raymarchMaterial.colorNode = raymarch;

// Apply to a full-screen quad
const { width, height } = useThree((state) => state.viewport);
return (
  <mesh scale={[width, height, 1]}>
    <planeGeometry args={[1, 1]} />
    <primitive object={raymarchMaterial} attach='material' />
  </mesh>
);
```

## Animation and Rendering

### Async Rendering Loop

WebGPU operations should use async patterns:

```javascript
const animate = async () => {
  const delta = clock.getDelta();
  const elapsed = clock.getElapsedTime();
  
  // Update simulation
  await renderer.computeAsync(updateCompute);
  
  // Update uniforms
  timeUniform.value = elapsed;
  
  // Render scene
  await renderer.renderAsync(scene, camera);
  
  // Request next frame
  requestAnimationFrame(animate);
};

// Start animation loop
requestAnimationFrame(animate);
```

### Project-Specific Animation Loop

```js
const animate = async () => {
    const delta = clock.getDelta();
    const elapsed = clock.getElapsedTime();
    
    // Update simulation
    await app.update(delta, elapsed);
    
    // Request next frame
    requestAnimationFrame(animate);
};
requestAnimationFrame(animate);
```

### Handling Resize

```javascript
const resize = () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
};

window.addEventListener("resize", resize);
```

## Environment Mapping

```javascript
// Load HDR environment
const hdriTexture = await new Promise(resolve => {
  new RGBELoader().load('environment.hdr', result => {
    result.mapping = THREE.EquirectangularReflectionMapping;
    resolve(result);
  });
});

// Apply to scene
scene.background = hdriTexture;
scene.backgroundRotation = new THREE.Euler(0, 2.15, 0);
scene.environment = hdriTexture;
scene.environmentRotation = new THREE.Euler(0, -2.15, 0);
scene.environmentIntensity = 0.5;
```

### Project-Specific Environment Mapping

```js
// Load and apply HDRI environment
const hdriTexture = await loadHdr(hdri);
this.scene.background = hdriTexture;
this.scene.backgroundRotation = new THREE.Euler(0,2.15,0);
this.scene.environment = hdriTexture;
this.scene.environmentRotation = new THREE.Euler(0,-2.15,0);
this.scene.environmentIntensity = 0.5;
```

## Advanced Techniques

### Instanced Drawing with Attribute Buffers

```javascript
// Create attributes
const positionAttribute = new StorageInstancedBufferAttribute(new Float32Array(positions.flat()), 3);
const colorAttribute = new StorageInstancedBufferAttribute(new Float32Array(colors.flat().map(c => [c.r, c.g, c.b]).flat()), 3);

// Create storage nodes
const positionBuffer = storage(positionAttribute, 'vec3', count).setPBO(true);
const colorBuffer = storage(colorAttribute, 'vec3', count).setPBO(true);

// Use in material
material.positionNode = positionBuffer.element(instanceIndex);
material.colorNode = colorBuffer.element(instanceIndex);
```

### Custom Interaction

```javascript
// Mouse interaction for simulations
const raycaster = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.2);

renderer.domElement.addEventListener("pointermove", (event) => {
  const pointer = new THREE.Vector2();
  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
  
  raycaster.setFromCamera(pointer, camera);
  const intersect = new THREE.Vector3();
  raycaster.ray.intersectPlane(plane, intersect);
  
  // Pass to simulation
  simulator.setMousePosition(intersect);
});
```

### Loading Progress Tracking

```javascript
const updateLoadingProgressBar = async (frac, delay = 0) => {
  return new Promise(resolve => {
    const progress = document.getElementById("progress");
    progress.style.width = `${frac * 200}px`;
    
    if (delay === 0) {
      resolve();
    } else {
      setTimeout(resolve, delay);
    }
  });
};

// Use in loading sequence
await updateLoadingProgressBar(0.1);
// Load resource 1
await updateLoadingProgressBar(0.5);
// Load resource 2
await updateLoadingProgressBar(1.0, 100);
```

## Development Setup

The project uses Vite with special TSL plugins:

```js
// vite.config.js
export default defineConfig({
    base: './',
    assetsInclude: ['**/*.hdr'],
    server: {
        port: 1234,
    },
    plugins: [
        tslOperatorPlugin({logs:false}),
        plainText(
            [/\.obj$/],
            { namedExport: false },
        ),
    ]
});
```

## Key APIs and Techniques

### WebGPU Renderer
- `WebGPURenderer`: Main renderer class
- `init()`: Async initialization
- `renderAsync()`: Async rendering
- `computeAsync()`: Async compute execution

### NodeMaterial Properties
- `positionNode`: Custom vertex positioning
- `colorNode`: Fragment color
- `aoNode`: Ambient occlusion
- `normalNode`: Normal mapping
- `mrtNode`: Multi-render target settings

### TSL Functions
- `Fn()`: Create shader functions
- `varying()`: Create varying variables
- `uniform()`: Create uniform values
- `attribute()`: Access mesh attributes
- `If()`, `Loop()`: Control flow
- `toVar()`: Create temporary variables
- `atomicAdd()`: Atomic operations

### Post-Processing
- `PostProcessing`: Main post-processing class
- `pass()`: Create render passes
- `mrt()`: Configure multi-render targets
- `bloom()`: Apply bloom effect

## Common Patterns and Best Practices

### WebGPU Best Practices

1. **Async Initialization**: Always use `await renderer.init()` for WebGPU setup.
2. **Compute Shader Usage**: Use `await renderer.computeAsync()` for compute operations.
3. **Rendering**: Use `await renderer.renderAsync()` for scene rendering.
4. **Error Handling**: Check for WebGPU support and handle fallbacks gracefully.
5. **Buffer Management**: Use structured arrays for complex data.
6. **Atomics**: Enable atomic operations when needed for grid-based simulations.

### TSL Best Practices

1. **Temporary Variables**: Use `.toVar()` for variables that need to be modified.
2. **Variable Naming**: Use `.toVar('name')` for debugging complex shaders.
3. **Function Creation**: Use `Fn()` for reusable shader functions.
4. **Control Flow**: Use `If()`, `Loop()`, `Break()` and `Return()` for control flow.
5. **Attribute Access**: Use `.element(instanceIndex)` for accessing buffer elements.
6. **Math Operations**: Use `.add()`, `.mul()`, etc. instead of operators.
7. **Type Constructors**: Use `vec3()`, `float()`, etc. for type construction.
8. **Assignment**: Use `.assign()` and `.addAssign()` for variable assignment.
9. **Label Debugging**: Use `.label()` to annotate values for debugging.

### Performance Optimization

1. **Instancing**: Use instanced rendering for particle systems.
2. **Structured Data**: Organize related data in structured arrays.
3. **Compute Kernels**: Keep compute kernels focused on specific tasks.
4. **Early Returns**: Use early returns in compute shaders to skip unnecessary work.
5. **PBO Sharing**: Use `.setPBO(true)` to share data between compute and rendering.
6. **Atomic Operations**: Use atomic operations for shared memory updates.
7. **Resolution Scaling**: Adapt rendering resolution based on device capabilities.

### Common Pitfalls

1. **Missing Await**: Forgetting to await async WebGPU operations.
2. **Missing Initialization**: Not initializing WebGPU correctly.
3. **Operator Usage**: Using JavaScript operators instead of TSL methods.
4. **Buffer Size Mismatch**: Not matching buffer sizes with actual instance counts.
5. **Missing .compute()**: Forgetting to call `.compute(count)` on compute kernels.
6. **Not Using toVar()**: Trying to modify immutable shader values.

## Project-Specific Components

The project includes specialized components:

### GPGPUParticles.jsx
- Core particle system implementation
- Uses WebGPU compute shaders for physics
- Implements model morphing between 3D shapes
- Supports interactive mouse forces

### ParticleTrails.jsx
- Creates visual trails for selected particles
- Dynamically updates trail geometries
- Implements color gradients along trails
- Uses custom line material

### MouseInteraction.jsx
- Tracks mouse position in 3D space
- Projects 2D mouse coordinates into 3D scene
- Provides attraction/repulsion forces
- Configurable influence radius and strength

### PostProcessing.jsx
- Implements bloom post-processing effects
- Uses @react-three/postprocessing library
- Configurable strength, radius, and threshold

### UI Controls Integration

The project uses Leva for UI controls:

```jsx
const { 
  enableTrails,
  trailsCount,
  trailLength,
  trailStartColor,
  trailEndColor
} = useControls("Particle Trails", {
  enableTrails: {
    value: true,
    label: "Enable Trails"
  },
  trailsCount: {
    value: 500,
    min: 50,
    max: 2000,
    step: 50,
    label: "Trails Count"
  },
  // Additional controls...
});
``` 