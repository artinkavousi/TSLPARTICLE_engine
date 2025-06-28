# TSL Particle Engine Development Guide - Three.js r177

## 🚀 Project Setup & Architecture

### Prerequisites
- Three.js r177 or later
- WebGPU-compatible browser (Chrome 113+, Edge 113+)
- Node.js 18+ for development
- Understanding of JavaScript ES6+ and GPU concepts

### Installation & Setup

```bash
npm install three@latest
npm install @react-three/fiber @react-three/drei
npm install gsap tweakpane
npm install vite (for development)
```

### Project Structure
```
tsl-particle-engine/
├── src/
│   ├── core/
│   │   ├── ParticleEngine.js
│   │   ├── ParticleData.js
│   │   └── TSLNodes.js
│   ├── physics/
│   │   ├── PBS.js          # Position Based Systems
│   │   ├── SBH.js          # Smoothed Particle Hydrodynamics
│   │   ├── MPM.js          # Material Point Method
│   │   └── Boids.js        # Emergent Behavior
│   ├── fields/
│   │   ├── VectorField.js
│   │   ├── BiologicalField.js
│   │   └── EmergentField.js
│   ├── materials/
│   │   ├── ParticleMaterial.js
│   │   └── EffectMaterial.js
│   ├── interaction/
│   │   ├── SoundReactive.js
│   │   └── UserInteraction.js
│   ├── morphing/
│   │   ├── ShapeShifter.js
│   │   └── MotionEngine.js
│   └── utils/
│       ├── BufferManager.js
│       └── PerformanceMonitor.js
```

## 🧮 TSL (Three Shading Language) Foundation

### Core TSL Imports for r177

```javascript
// Essential TSL imports for particle systems
import {
  // Core TSL functions
  Fn, vec2, vec3, vec4, float, int, bool,
  uniform, attribute, varying, output,
  
  // Math operations
  add, sub, mul, div, mod, pow, sqrt, sin, cos, tan,
  dot, cross, normalize, length, distance, mix, smoothstep,
  
  // Texture operations
  texture, textureSample, textureLoad, textureStore,
  
  // Compute operations
  computeTexture, workgroupBarrier, atomicAdd,
  
  // Storage operations
  storage, storageTexture, buffer,
  
  // Control flow
  If, Loop, Break, Continue,
  
  // Built-in variables
  positionLocal, positionWorld, normalLocal, normalWorld,
  uv, modelViewMatrix, projectionMatrix,
  instanceIndex, vertexIndex,
  
  // WebGPU specific
  invocationId, workgroupId, workgroupSize,
  
} from 'three/tsl';

// WebGPU renderer import
import { WebGPURenderer } from 'three/webgpu';
```

### TSL Node System Architecture

```javascript
// core/TSLNodes.js - Central node management system
export class TSLNodeSystem {
  constructor() {
    this.nodes = new Map();
    this.computeShaders = new Map();
    this.materials = new Map();
  }

  // Create compute node for particle physics
  createComputeNode(name, computeFunction) {
    const node = Fn(() => {
      return computeFunction();
    })();
    
    this.nodes.set(name, node);
    return node;
  }

  // Create material node for rendering
  createMaterialNode(name, materialFunction) {
    const node = Fn(() => {
      return materialFunction();
    })();
    
    this.materials.set(name, node);
    return node;
  }

  // Get node by name
  getNode(name) {
    return this.nodes.get(name);
  }
}
```

## 🌊 Core Particle Engine Implementation

### ParticleEngine.js - Main Engine

```javascript
// core/ParticleEngine.js
import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import {
  Fn, vec3, vec4, float, uniform, storage, 
  computeTexture, texture, positionLocal,
  instanceIndex, workgroupBarrier
} from 'three/tsl';

export class ParticleEngine {
  constructor(options = {}) {
    this.maxParticles = options.maxParticles || 100000;
    this.renderer = new WebGPURenderer({ antialias: true });
    this.scene = new THREE.Scene();
    this.camera = options.camera || new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Particle data storage
    this.particleData = {
      position: new Float32Array(this.maxParticles * 3),
      velocity: new Float32Array(this.maxParticles * 3),
      force: new Float32Array(this.maxParticles * 3),
      life: new Float32Array(this.maxParticles),
      mass: new Float32Array(this.maxParticles),
      size: new Float32Array(this.maxParticles),
      color: new Float32Array(this.maxParticles * 4)
    };
    
    this.init();
  }

  init() {
    this.createStorageBuffers();
    this.createComputeShaders();
    this.createRenderMaterial();
    this.createParticleGeometry();
  }

  createStorageBuffers() {
    // Create storage buffers for particle data
    this.buffers = {
      position: storage(new THREE.StorageInstancedBufferAttribute(this.particleData.position, 3), 'vec3'),
      velocity: storage(new THREE.StorageInstancedBufferAttribute(this.particleData.velocity, 3), 'vec3'),
      force: storage(new THREE.StorageInstancedBufferAttribute(this.particleData.force, 3), 'vec3'),
      life: storage(new THREE.StorageInstancedBufferAttribute(this.particleData.life, 1), 'float'),
      mass: storage(new THREE.StorageInstancedBufferAttribute(this.particleData.mass, 1), 'float'),
      size: storage(new THREE.StorageInstancedBufferAttribute(this.particleData.size, 1), 'float'),
      color: storage(new THREE.StorageInstancedBufferAttribute(this.particleData.color, 4), 'vec4')
    };
  }

  createComputeShaders() {
    // Physics update compute shader
    this.physicsCompute = Fn(() => {
      const index = instanceIndex;
      const position = this.buffers.position.element(index);
      const velocity = this.buffers.velocity.element(index);
      const force = this.buffers.force.element(index);
      const mass = this.buffers.mass.element(index);
      const deltaTime = uniform('deltaTime');

      // Verlet integration
      const acceleration = force.div(mass);
      const newVelocity = velocity.add(acceleration.mul(deltaTime));
      const newPosition = position.add(newVelocity.mul(deltaTime));

      // Update buffers
      this.buffers.velocity.element(index).assign(newVelocity);
      this.buffers.position.element(index).assign(newPosition);
      
      // Reset forces
      this.buffers.force.element(index).assign(vec3(0, 0, 0));

    })().compute(this.maxParticles);

    this.computeTexture = computeTexture(this.physicsCompute, this.maxParticles, this.renderer);
  }

  createRenderMaterial() {
    // Particle rendering material using TSL
    this.material = new THREE.MeshBasicMaterial();
    
    // Custom vertex shader
    this.material.vertexNode = Fn(() => {
      const instanceId = instanceIndex;
      const particlePosition = this.buffers.position.element(instanceId);
      const particleSize = this.buffers.size.element(instanceId);
      
      // Transform local vertex position by particle size and position
      const localPos = positionLocal.mul(particleSize);
      const worldPos = localPos.add(particlePosition);
      
      return vec4(worldPos, 1.0);
    })();

    // Custom fragment shader
    this.material.fragmentNode = Fn(() => {
      const instanceId = instanceIndex;
      const particleColor = this.buffers.color.element(instanceId);
      
      return particleColor;
    })();
  }

  createParticleGeometry() {
    // Create instanced geometry for particles
    this.geometry = new THREE.PlaneGeometry(1, 1);
    this.mesh = new THREE.InstancedMesh(this.geometry, this.material, this.maxParticles);
    this.scene.add(this.mesh);
  }

  update(deltaTime) {
    // Update physics compute shader
    this.renderer.compute(this.computeTexture);
    
    // Update uniforms
    this.material.uniforms.deltaTime = { value: deltaTime };
  }

  render() {
    this.renderer.render(this.scene, this.camera);
  }
}
```

## 🧬 Physics Systems Implementation

### Position-Based Systems (PBS.js)

```javascript
// physics/PBS.js - Cloth and soft body simulation
import { Fn, vec3, float, distance, normalize, max } from 'three/tsl';

export class PositionBasedSystem {
  constructor(particleEngine) {
    this.engine = particleEngine;
    this.constraints = [];
    this.iterations = 3;
  }

  createClothConstraints(width, height) {
    // Create distance constraints for cloth simulation
    this.clothConstraint = Fn(() => {
      const index = instanceIndex;
      const position = this.engine.buffers.position.element(index);
      
      // Get neighboring particles
      const rightIndex = index.add(1);
      const bottomIndex = index.add(width);
      
      // Distance constraints
      If(rightIndex.lessThan(this.engine.maxParticles), () => {
        const rightPos = this.engine.buffers.position.element(rightIndex);
        const constraint = this.solveDistanceConstraint(position, rightPos, float(1.0));
        this.engine.buffers.position.element(index).assign(constraint.posA);
        this.engine.buffers.position.element(rightIndex).assign(constraint.posB);
      });

      If(bottomIndex.lessThan(this.engine.maxParticles), () => {
        const bottomPos = this.engine.buffers.position.element(bottomIndex);
        const constraint = this.solveDistanceConstraint(position, bottomPos, float(1.0));
        this.engine.buffers.position.element(index).assign(constraint.posA);
        this.engine.buffers.position.element(bottomIndex).assign(constraint.posB);
      });

    })().compute(this.engine.maxParticles);
  }

  solveDistanceConstraint(posA, posB, restLength) {
    return Fn(() => {
      const diff = posB.sub(posA);
      const dist = length(diff);
      const correction = diff.mul(float(1.0).sub(restLength.div(max(dist, float(0.001)))));
      
      return {
        posA: posA.add(correction.mul(0.5)),
        posB: posB.sub(correction.mul(0.5))
      };
    })();
  }
}
```

### Smoothed Particle Hydrodynamics (SBH.js)

```javascript
// physics/SBH.js - Fluid simulation
import { Fn, vec3, float, distance, smoothstep, dot } from 'three/tsl';

export class SmoothParticleHydrodynamics {
  constructor(particleEngine) {
    this.engine = particleEngine;
    this.kernelRadius = 2.0;
    this.restDensity = 1000.0;
    this.gasConstant = 2000.0;
    this.viscosity = 250.0;
  }

  createFluidCompute() {
    this.fluidCompute = Fn(() => {
      const index = instanceIndex;
      const position = this.engine.buffers.position.element(index);
      const velocity = this.engine.buffers.velocity.element(index);
      
      let density = float(0);
      let pressure = float(0);
      let pressureForce = vec3(0);
      let viscosityForce = vec3(0);

      // Density calculation and force computation
      Loop({ start: 0, end: this.engine.maxParticles }, ({ i }) => {
        If(i.notEqual(index), () => {
          const neighborPos = this.engine.buffers.position.element(i);
          const neighborVel = this.engine.buffers.velocity.element(i);
          const diff = position.sub(neighborPos);
          const dist = length(diff);

          If(dist.lessThan(this.kernelRadius), () => {
            // Poly6 kernel for density
            const poly6 = this.poly6Kernel(dist, this.kernelRadius);
            density = density.add(poly6);

            // Spiky kernel for pressure
            const spiky = this.spikyKernel(dist, this.kernelRadius);
            const pressureGradient = diff.normalize().mul(spiky);
            pressureForce = pressureForce.sub(pressureGradient);

            // Viscosity kernel
            const viscosity = this.viscosityKernel(dist, this.kernelRadius);
            const velocityDiff = neighborVel.sub(velocity);
            viscosityForce = viscosityForce.add(velocityDiff.mul(viscosity));
          });
        });
      });

      // Calculate pressure from density
      pressure = this.gasConstant.mul(density.sub(this.restDensity));

      // Apply forces
      const totalForce = pressureForce.mul(pressure).add(viscosityForce.mul(this.viscosity));
      this.engine.buffers.force.element(index).assign(
        this.engine.buffers.force.element(index).add(totalForce)
      );

    })().compute(this.engine.maxParticles);
  }

  poly6Kernel(distance, h) {
    return Fn(() => {
      const ratio = distance.div(h);
      const poly6Coeff = float(315.0 / (64.0 * Math.PI * Math.pow(h, 9)));
      return poly6Coeff.mul(pow(float(1).sub(ratio.mul(ratio)), 3));
    })();
  }

  spikyKernel(distance, h) {
    return Fn(() => {
      const ratio = distance.div(h);
      const spikyCoeff = float(-45.0 / (Math.PI * Math.pow(h, 6)));
      return spikyCoeff.mul(pow(float(1).sub(ratio), 2));
    })();
  }

  viscosityKernel(distance, h) {
    return Fn(() => {
      const ratio = distance.div(h);
      const viscosityCoeff = float(45.0 / (Math.PI * Math.pow(h, 6)));
      return viscosityCoeff.mul(float(1).sub(ratio));
    })();
  }
}
```

### Emergent Behavior - Boids System (Boids.js)

```javascript
// physics/Boids.js - Flocking behavior
import { Fn, vec3, float, distance, normalize, dot } from 'three/tsl';

export class BoidsSystem {
  constructor(particleEngine) {
    this.engine = particleEngine;
    this.separationRadius = 1.5;
    this.alignmentRadius = 2.5;
    this.cohesionRadius = 3.0;
    this.maxSpeed = 2.0;
    this.maxForce = 0.3;
  }

  createBoidsCompute() {
    this.boidsCompute = Fn(() => {
      const index = instanceIndex;
      const position = this.engine.buffers.position.element(index);
      const velocity = this.engine.buffers.velocity.element(index);

      let separation = vec3(0);
      let alignment = vec3(0);
      let cohesion = vec3(0);
      let separationCount = float(0);
      let alignmentCount = float(0);
      let cohesionCount = float(0);

      // Check neighbors for flocking behavior
      Loop({ start: 0, end: this.engine.maxParticles }, ({ i }) => {
        If(i.notEqual(index), () => {
          const neighborPos = this.engine.buffers.position.element(i);
          const neighborVel = this.engine.buffers.velocity.element(i);
          const diff = position.sub(neighborPos);
          const dist = length(diff);

          // Separation
          If(dist.lessThan(this.separationRadius), () => {
            const separationForce = diff.normalize().div(dist);
            separation = separation.add(separationForce);
            separationCount = separationCount.add(1);
          });

          // Alignment
          If(dist.lessThan(this.alignmentRadius), () => {
            alignment = alignment.add(neighborVel);
            alignmentCount = alignmentCount.add(1);
          });

          // Cohesion
          If(dist.lessThan(this.cohesionRadius), () => {
            cohesion = cohesion.add(neighborPos);
            cohesionCount = cohesionCount.add(1);
          });
        });
      });

      // Calculate steering forces
      let steeringForce = vec3(0);

      // Apply separation
      If(separationCount.greaterThan(0), () => {
        separation = separation.div(separationCount).normalize().mul(this.maxSpeed);
        const separationSteer = this.limitForce(separation.sub(velocity));
        steeringForce = steeringForce.add(separationSteer.mul(1.5));
      });

      // Apply alignment
      If(alignmentCount.greaterThan(0), () => {
        alignment = alignment.div(alignmentCount).normalize().mul(this.maxSpeed);
        const alignmentSteer = this.limitForce(alignment.sub(velocity));
        steeringForce = steeringForce.add(alignmentSteer.mul(1.0));
      });

      // Apply cohesion
      If(cohesionCount.greaterThan(0), () => {
        cohesion = cohesion.div(cohesionCount);
        const cohesionTarget = cohesion.sub(position).normalize().mul(this.maxSpeed);
        const cohesionSteer = this.limitForce(cohesionTarget.sub(velocity));
        steeringForce = steeringForce.add(cohesionSteer.mul(1.0));
      });

      // Apply steering force
      this.engine.buffers.force.element(index).assign(
        this.engine.buffers.force.element(index).add(steeringForce)
      );

    })().compute(this.engine.maxParticles);
  }

  limitForce(force) {
    return Fn(() => {
      const magnitude = length(force);
      If(magnitude.greaterThan(this.maxForce), () => {
        return force.normalize().mul(this.maxForce);
      }).Else(() => {
        return force;
      });
    })();
  }
}
```

## 🌊 Field Systems Implementation

### Vector Field System

```javascript
// fields/VectorField.js - Force field implementation
import { Fn, vec3, float, sin, cos, noise } from 'three/tsl';

export class VectorField {
  constructor(particleEngine) {
    this.engine = particleEngine;
    this.fieldStrength = 1.0;
    this.noiseScale = 0.01;
  }

  createNoiseField() {
    this.noiseFieldCompute = Fn(() => {
      const index = instanceIndex;
      const position = this.engine.buffers.position.element(index);
      const time = uniform('time');

      // 3D noise-based vector field
      const noisePos = position.mul(this.noiseScale);
      const noiseX = noise(noisePos.add(vec3(0, 0, time)));
      const noiseY = noise(noisePos.add(vec3(100, 0, time)));
      const noiseZ = noise(noisePos.add(vec3(0, 100, time)));

      const fieldForce = vec3(noiseX, noiseY, noiseZ).mul(this.fieldStrength);

      this.engine.buffers.force.element(index).assign(
        this.engine.buffers.force.element(index).add(fieldForce)
      );

    })().compute(this.engine.maxParticles);
  }

  createVortexField(center, strength) {
    this.vortexCompute = Fn(() => {
      const index = instanceIndex;
      const position = this.engine.buffers.position.element(index);
      
      const diff = position.sub(center);
      const distance = length(diff);
      const vortexForce = vec3(
        diff.z.negate().mul(strength).div(distance.add(1)),
        float(0),
        diff.x.mul(strength).div(distance.add(1))
      );

      this.engine.buffers.force.element(index).assign(
        this.engine.buffers.force.element(index).add(vortexForce)
      );

    })().compute(this.engine.maxParticles);
  }
}
```

### Biological Field System

```javascript
// fields/BiologicalField.js - Biological simulation patterns
import { Fn, vec3, float, texture, textureStore } from 'three/tsl';

export class BiologicalField {
  constructor(particleEngine) {
    this.engine = particleEngine;
    this.trailTexture = new THREE.DataTexture(
      new Float32Array(512 * 512 * 4),
      512, 512,
      THREE.RGBAFormat,
      THREE.FloatType
    );
  }

  createPhysarumField() {
    // Physarum slime mold simulation
    this.physarumCompute = Fn(() => {
      const index = instanceIndex;
      const position = this.engine.buffers.position.element(index);
      const velocity = this.engine.buffers.velocity.element(index);

      // Sample trail texture for chemotaxis
      const uvPos = position.xy.div(512).add(0.5);
      const currentTrail = texture(this.trailTexture, uvPos).r;

      // Sensor angles (left, forward, right)
      const sensorAngle = float(Math.PI / 4);
      const sensorDistance = float(9.0);
      
      const angle = atan2(velocity.y, velocity.x);
      
      // Sample sensors
      const leftAngle = angle.sub(sensorAngle);
      const rightAngle = angle.add(sensorAngle);
      
      const leftSensor = position.add(vec3(
        cos(leftAngle).mul(sensorDistance),
        sin(leftAngle).mul(sensorDistance),
        0
      ));
      const forwardSensor = position.add(velocity.normalize().mul(sensorDistance));
      const rightSensor = position.add(vec3(
        cos(rightAngle).mul(sensorDistance),
        sin(rightAngle).mul(sensorDistance),
        0
      ));

      const leftUV = leftSensor.xy.div(512).add(0.5);
      const forwardUV = forwardSensor.xy.div(512).add(0.5);
      const rightUV = rightSensor.xy.div(512).add(0.5);

      const leftTrail = texture(this.trailTexture, leftUV).r;
      const forwardTrail = texture(this.trailTexture, forwardUV).r;
      const rightTrail = texture(this.trailTexture, rightUV).r;

      // Determine turning direction
      let newAngle = angle;
      If(forwardTrail.greaterThan(leftTrail).and(forwardTrail.greaterThan(rightTrail)), () => {
        // Continue forward
      }).ElseIf(leftTrail.greaterThan(rightTrail), () => {
        newAngle = angle.sub(float(0.1));
      }).Else(() => {
        newAngle = angle.add(float(0.1));
      });

      // Update velocity based on new angle
      const speed = length(velocity);
      const newVelocity = vec3(cos(newAngle), sin(newAngle), 0).mul(speed);
      
      this.engine.buffers.velocity.element(index).assign(newVelocity);

      // Deposit trail
      const depositUV = position.xy.div(512).add(0.5);
      const deposit = float(0.1);
      textureStore(this.trailTexture, ivec2(depositUV.mul(512)), vec4(deposit, 0, 0, 1));

    })().compute(this.engine.maxParticles);
  }
}
```

## 🎨 Material & Visual Systems

### Advanced Particle Material

```javascript
// materials/ParticleMaterial.js - Advanced rendering
import { Fn, vec3, vec4, float, smoothstep, mix } from 'three/tsl';

export class ParticleMaterial extends THREE.MeshBasicMaterial {
  constructor(particleEngine) {
    super();
    this.engine = particleEngine;
    this.createShaders();
  }

  createShaders() {
    // Advanced vertex shader with morphing
    this.vertexNode = Fn(() => {
      const instanceId = instanceIndex;
      const particlePosition = this.engine.buffers.position.element(instanceId);
      const particleSize = this.engine.buffers.size.element(instanceId);
      const particleLife = this.engine.buffers.life.element(instanceId);

      // Size animation based on life
      const animatedSize = particleSize.mul(smoothstep(0, 0.1, particleLife));
      
      // Billboard facing camera
      const modelView = modelViewMatrix;
      const billboard = mat3(
        modelView.element(0).xyz.normalize(),
        modelView.element(1).xyz.normalize(),
        modelView.element(2).xyz.normalize()
      );

      const localPos = billboard.mul(positionLocal.mul(animatedSize));
      const worldPos = localPos.add(particlePosition);

      return vec4(worldPos, 1.0);
    })();

    // Advanced fragment shader with effects
    this.fragmentNode = Fn(() => {
      const instanceId = instanceIndex;
      const particleColor = this.engine.buffers.color.element(instanceId);
      const particleLife = this.engine.buffers.life.element(instanceId);
      
      // Distance from center for circular particles
      const center = vec2(0.5);
      const dist = distance(uv, center);
      
      // Soft edges
      const alpha = smoothstep(0.5, 0.3, dist);
      
      // Life-based alpha fadeout
      const lifeAlpha = smoothstep(0, 0.2, particleLife);
      
      // Energy glow effect
      const glow = pow(float(1).sub(dist.mul(2)), 2);
      const glowColor = vec3(0.5, 0.8, 1.0).mul(glow).mul(0.3);
      
      const finalColor = particleColor.rgb.add(glowColor);
      const finalAlpha = alpha.mul(lifeAlpha).mul(particleColor.a);

      return vec4(finalColor, finalAlpha);
    })();

    this.transparent = true;
    this.depthWrite = false;
    this.blending = THREE.AdditiveBlending;
  }
}
```

## 🎵 Audio-Reactive System

```javascript
// interaction/SoundReactive.js - Audio integration
import { Fn, vec3, float, sin, cos } from 'three/tsl';

export class SoundReactive {
  constructor(particleEngine) {
    this.engine = particleEngine;
    this.analyser = null;
    this.frequencyData = new Uint8Array(256);
    this.setupAudio();
  }

  setupAudio() {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        this.analyser = audioContext.createAnalyser();
        this.analyser.fftSize = 512;
        source.connect(this.analyser);
      });
  }

  createAudioReactiveForces() {
    this.audioCompute = Fn(() => {
      const index = instanceIndex;
      const position = this.engine.buffers.position.element(index);
      
      // Get frequency data as uniforms
      const bassLevel = uniform('bassLevel');      // 0-63 Hz
      const midLevel = uniform('midLevel');        // 64-127 Hz  
      const trebleLevel = uniform('trebleLevel');  // 128-255 Hz
      const beat = uniform('beat');                // Beat detection

      // Bass creates expansion force
      const bassForce = position.normalize().mul(bassLevel).mul(0.01);
      
      // Mid frequencies create rotation
      const angle = atan2(position.z, position.x).add(midLevel.mul(0.001));
      const rotationForce = vec3(
        cos(angle).sub(position.x).mul(0.005),
        float(0),
        sin(angle).sub(position.z).mul(0.005)
      );

      // Treble creates vertical movement
      const trebleForce = vec3(0, trebleLevel.mul(0.01), 0);

      // Beat creates impulse
      const beatForce = position.normalize().mul(beat).mul(0.1);

      const totalAudioForce = bassForce.add(