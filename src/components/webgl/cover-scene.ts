import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from "three";
import type { CoverPreset } from "./presets";

/**
 * The invitation's opening WebGL stage.
 *
 * Three layers, all shader-driven and all additive so they sit over the
 * template's own background without fighting it:
 *
 *   1. aurora  — slow light bands, the atmosphere of the room
 *   2. bloom   — a soft radial glow behind the names
 *   3. motes   — the particle field: gold dust, petals, sand or stars
 *
 * On open, `burst()` drives a single uniform that pushes every mote outward and
 * flares the bloom, so the WebGL layer resolves in time with the cover's exit
 * rather than simply disappearing.
 *
 * Deliberately framework-free: it owns its renderer, its loop and its disposal,
 * and knows nothing about React.
 */

const MOTE_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPixelRatio;
uniform float uBurst;
uniform float uDirection;
uniform float uSpread;
uniform float uSway;
uniform float uReveal;

attribute float aScale;
attribute float aSeed;
attribute float aSpeed;

varying float vAlpha;
varying float vSeed;

void main() {
  vSeed = aSeed;

  // Continuous loop: each mote walks 0..1 and wraps, so the field never empties.
  float progress = fract(uTime * aSpeed * 0.06 + aSeed);
  float travel = uDirection > 0.0 ? progress : 1.0 - progress;
  float y = mix(-uSpread, uSpread, travel);

  vec3 transformed = vec3(
    position.x + sin(uTime * 0.35 * aSpeed + aSeed * 18.0) * uSway,
    y + position.y * 0.12,
    position.z
  );

  // Opening surge: motes accelerate away from the centre and fade out.
  if (uBurst > 0.0) {
    vec3 outward = normalize(vec3(transformed.xy, 0.35));
    transformed += outward * uBurst * uBurst * 5.5;
  }

  vec4 viewPosition = modelViewMatrix * vec4(transformed, 1.0);
  gl_Position = projectionMatrix * viewPosition;

  // Perspective size attenuation, clamped so nothing becomes a screen-filling blob.
  gl_PointSize = min(
    uSize * aScale * uPixelRatio * (1.0 / max(-viewPosition.z, 0.1)),
    uPixelRatio * 90.0
  );

  // Fade at both ends of the travel so motes appear and leave gently.
  float edge = smoothstep(0.0, 0.14, progress) * (1.0 - smoothstep(0.86, 1.0, progress));
  float twinkle = 0.55 + 0.45 * sin(uTime * (0.8 + aSpeed * 2.0) + aSeed * 30.0);

  vAlpha = edge * twinkle * (1.0 - uBurst) * uReveal;
}
`;

const MOTE_FRAGMENT = /* glsl */ `
uniform vec3 uColorA;
uniform vec3 uColorB;

varying float vAlpha;
varying float vSeed;

void main() {
  // Soft round sprite, no texture fetch required.
  float distance = length(gl_PointCoord - vec2(0.5));
  float mask = smoothstep(0.5, 0.06, distance);
  if (mask <= 0.001) discard;

  vec3 color = mix(uColorA, uColorB, vSeed);
  gl_FragColor = vec4(color, mask * vAlpha);
}
`;

const FULLSCREEN_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const BLOOM_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uTime;
uniform float uBurst;
uniform float uReveal;

varying vec2 vUv;

void main() {
  vec2 centered = vUv - vec2(0.5, 0.52);
  float radius = length(centered * vec2(1.0, 1.25));

  // Breathing core, plus a flare as the invitation opens.
  float pulse = 0.94 + 0.06 * sin(uTime * 0.6);
  float core = smoothstep(0.52, 0.0, radius) * pulse;
  float flare = smoothstep(0.85, 0.0, radius) * uBurst * 1.4;

  float alpha = (core * uIntensity + flare) * uReveal;
  gl_FragColor = vec4(uColor, alpha);
}
`;

const AURORA_FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uTime;
uniform float uReveal;

varying vec2 vUv;

void main() {
  // Three offset sine bands drifting at different rates: cheap volumetric light.
  float band1 = sin(vUv.x * 2.4 + uTime * 0.16) * 0.5 + 0.5;
  float band2 = sin(vUv.x * 3.7 - uTime * 0.11 + 1.7) * 0.5 + 0.5;
  float band3 = sin(vUv.y * 1.9 + uTime * 0.07) * 0.5 + 0.5;

  float shape = band1 * 0.45 + band2 * 0.3 + band3 * 0.25;

  // Hold the light away from the centre so type stays clean.
  float vignette = smoothstep(0.05, 0.6, length(vUv - 0.5));

  gl_FragColor = vec4(uColor, shape * vignette * uIntensity * uReveal);
}
`;

export interface CoverSceneOptions {
  container: HTMLElement;
  preset: CoverPreset;
  tier: "high" | "low";
}

export class CoverScene {
  private readonly renderer: WebGLRenderer;
  private readonly scene = new Scene();
  private readonly camera: PerspectiveCamera;
  private readonly container: HTMLElement;
  private readonly preset: CoverPreset;

  private readonly motes: Points;
  private readonly bloom: Mesh | null = null;
  private readonly aurora: Mesh | null = null;
  private readonly bokeh: Points | null = null;

  private frame = 0;
  private startedAt = 0;
  private burstStartedAt: number | null = null;
  private reveal = 0;
  private running = false;
  private disposed = false;

  private pointer = { x: 0, y: 0 };
  private pointerTarget = { x: 0, y: 0 };
  private resizeObserver: ResizeObserver | null = null;

  constructor({ container, preset, tier }: CoverSceneOptions) {
    this.container = container;
    this.preset = preset;

    const width = container.clientWidth || 1;
    const height = container.clientHeight || 1;

    this.renderer = new WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "high-performance",
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, tier === "high" ? 2 : 1.5),
    );
    this.renderer.setSize(width, height, false);

    const canvas = this.renderer.domElement;
    canvas.style.position = "absolute";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    canvas.setAttribute("aria-hidden", "true");
    container.appendChild(canvas);

    this.camera = new PerspectiveCamera(58, width / height, 0.1, 100);
    this.camera.position.set(0, 0, 6);

    const count = tier === "high" ? preset.count : Math.round(preset.count * 0.5);

    if (preset.aurora.intensity > 0) {
      this.aurora = this.createFullscreenLayer(AURORA_FRAGMENT, {
        uColor: new Color(preset.aurora.color),
        uIntensity: preset.aurora.intensity,
      });
      this.aurora.position.z = -4;
      this.aurora.scale.set(22, 22, 1);
      this.scene.add(this.aurora);
    }

    if (preset.glow.intensity > 0) {
      this.bloom = this.createFullscreenLayer(BLOOM_FRAGMENT, {
        uColor: new Color(preset.glow.color),
        uIntensity: preset.glow.intensity,
      });
      this.bloom.position.z = -2.4;
      // Sized in world units so the bloom stays a halo behind the names. Scaled
      // to cover the frame it behaves as an exposure lift and drains the
      // template's colour — emerald goes olive, navy goes sepia.
      this.bloom.scale.set(preset.glow.scale, preset.glow.scale * 1.15, 1);
      this.scene.add(this.bloom);
    }

    this.motes = this.createMotes(count, preset.size, 1);
    this.scene.add(this.motes);

    if (preset.bokeh > 0) {
      const bokehCount = tier === "high" ? preset.bokeh : Math.round(preset.bokeh * 0.5);
      // Large, very soft, slow discs sitting nearer the camera for depth.
      this.bokeh = this.createMotes(bokehCount, preset.size * 6.5, 0.45);
      this.bokeh.position.z = 1.6;
      this.scene.add(this.bokeh);
    }

    this.observeResize();
    this.bindPointer();
  }

  private createFullscreenLayer(
    fragmentShader: string,
    uniforms: Record<string, { value: unknown } | unknown>,
  ): Mesh {
    const material = new ShaderMaterial({
      vertexShader: FULLSCREEN_VERTEX,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uBurst: { value: 0 },
        uReveal: { value: 0 },
        ...Object.fromEntries(
          Object.entries(uniforms).map(([key, value]) => [key, { value }]),
        ),
      },
    });

    return new Mesh(new PlaneGeometry(1, 1), material);
  }

  private createMotes(count: number, size: number, speedScale: number): Points {
    const positions = new Float32Array(count * 3);
    const scales = new Float32Array(count);
    const seeds = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let index = 0; index < count; index += 1) {
      // Deterministic-ish spread: wide in x, deep in z, y is driven by the shader.
      positions[index * 3] = (Math.random() - 0.5) * 11;
      positions[index * 3 + 1] = (Math.random() - 0.5) * 2;
      positions[index * 3 + 2] = (Math.random() - 0.5) * 6 - 1;

      scales[index] = 0.35 + Math.random() * 0.9;
      seeds[index] = Math.random();
      speeds[index] = (0.5 + Math.random() * 1.1) * speedScale;
    }

    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(positions, 3));
    geometry.setAttribute("aScale", new BufferAttribute(scales, 1));
    geometry.setAttribute("aSeed", new BufferAttribute(seeds, 1));
    geometry.setAttribute("aSpeed", new BufferAttribute(speeds, 1));

    const material = new ShaderMaterial({
      vertexShader: MOTE_VERTEX,
      fragmentShader: MOTE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSize: { value: size },
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uBurst: { value: 0 },
        uReveal: { value: 0 },
        uDirection: { value: this.preset.direction },
        uSpread: { value: this.preset.spread },
        uSway: { value: this.preset.sway },
        uColorA: { value: new Color(this.preset.colorA) },
        uColorB: { value: new Color(this.preset.colorB) },
      },
    });

    return new Points(geometry, material);
  }

  private observeResize() {
    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(this.container);
  }

  private handleResize() {
    if (this.disposed) return;
    const width = this.container.clientWidth || 1;
    const height = this.container.clientHeight || 1;

    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    const ratio = this.renderer.getPixelRatio();
    for (const layer of [this.motes, this.bokeh]) {
      if (!layer) continue;
      const material = layer.material as ShaderMaterial;
      material.uniforms.uPixelRatio!.value = ratio;
    }
  }

  private bindPointer() {
    if (this.preset.parallax <= 0) return;
    this.container.addEventListener("pointermove", this.onPointerMove, { passive: true });
    window.addEventListener("deviceorientation", this.onDeviceOrientation, {
      passive: true,
    });
  }

  private onPointerMove = (event: PointerEvent) => {
    const rect = this.container.getBoundingClientRect();
    this.pointerTarget.x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    this.pointerTarget.y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  };

  private onDeviceOrientation = (event: DeviceOrientationEvent) => {
    // gamma: left/right tilt, beta: front/back. Clamped to keep it gentle.
    const gamma = event.gamma ?? 0;
    const beta = event.beta ?? 0;
    this.pointerTarget.x = Math.max(-1, Math.min(1, gamma / 35));
    this.pointerTarget.y = Math.max(-1, Math.min(1, (beta - 45) / 45));
  };

  /** Fires the opening surge. Safe to call more than once. */
  burst() {
    if (this.burstStartedAt === null) {
      this.burstStartedAt = performance.now();
    }
  }

  start() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.startedAt = performance.now();
    this.loop();
  }

  stop() {
    this.running = false;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
  }

  private loop = () => {
    if (!this.running || this.disposed) return;

    const now = performance.now();
    const elapsed = (now - this.startedAt) / 1000;

    // Fade the whole stage in rather than popping it on at full strength.
    this.reveal = Math.min(1, this.reveal + 0.012);

    const burst =
      this.burstStartedAt === null
        ? 0
        : Math.min(1, (now - this.burstStartedAt) / 1100);

    // Ease the camera toward the pointer for a parallax that never feels twitchy.
    this.pointer.x += (this.pointerTarget.x - this.pointer.x) * 0.045;
    this.pointer.y += (this.pointerTarget.y - this.pointer.y) * 0.045;
    this.camera.position.x = this.pointer.x * this.preset.parallax * 0.55;
    this.camera.position.y = -this.pointer.y * this.preset.parallax * 0.35;
    this.camera.lookAt(0, 0, 0);

    for (const layer of [this.motes, this.bokeh, this.bloom, this.aurora]) {
      if (!layer) continue;
      const material = layer.material as ShaderMaterial;
      material.uniforms.uTime!.value = elapsed;
      material.uniforms.uBurst!.value = burst;
      material.uniforms.uReveal!.value = this.reveal;
    }

    this.renderer.render(this.scene, this.camera);
    this.frame = requestAnimationFrame(this.loop);
  };

  dispose() {
    this.disposed = true;
    this.stop();

    this.resizeObserver?.disconnect();
    this.container.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("deviceorientation", this.onDeviceOrientation);

    for (const object of [this.motes, this.bokeh, this.bloom, this.aurora]) {
      if (!object) continue;
      this.scene.remove(object);
      object.geometry.dispose();
      (object.material as ShaderMaterial).dispose();
    }

    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
