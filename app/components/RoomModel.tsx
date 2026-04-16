'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Feature = {
  type: string;
  wall: 'back' | 'left' | 'right' | 'floor' | 'ceiling';
  x_cm: number;
  y_cm: number;
  width_cm: number;
  height_cm: number;
  label: string;
};

export type Architecture = {
  wall_width_cm: number;
  wall_height_cm: number;
  room_depth_cm: number;
  wall_colour_hex: string;
  floor_colour_hex: string;
  ceiling_colour_hex: string;
  features: Feature[];
  confidence?: string;
};

const FEATURE_STYLES: Record<string, { color: number; emissive?: number }> = {
  door:           { color: 0x8B6F4E },
  window:         { color: 0xB8D4E3, emissive: 0x3A5A6B },
  radiator:       { color: 0xF0EAE0 },
  light_switch:   { color: 0xF5F1E8 },
  power_socket:   { color: 0xF5F1E8 },
  boiler:         { color: 0xE0E0E0 },
  gas_unit:       { color: 0x8A8A8A },
  fireplace:      { color: 0x2A2A2A },
  skirting_vent:  { color: 0x4A4A4A },
  thermostat:     { color: 0xFFFFFF },
  shelf_built_in: { color: 0xD8D2C0 },
  alcove:         { color: 0x1A1A1A },
};

export default function RoomModel({ architecture, aspectRatio }: { architecture: Architecture; aspectRatio: string }) {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width  = mount.clientWidth;
    const height = mount.clientHeight;
    if (!width || !height) return;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xF5F1E8);

    // Scale everything to metres (1cm = 0.01 units feels right for camera distances)
    const SCALE = 0.01;
    const W = architecture.wall_width_cm * SCALE;
    const H = architecture.wall_height_cm * SCALE;
    const D = architecture.room_depth_cm * SCALE;

    // Camera
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    const cameraDist = Math.max(W, H, D) * 1.4;
    camera.position.set(cameraDist, H * 0.55, cameraDist);
    camera.lookAt(0, H * 0.45, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    // Lighting
    const ambient = new THREE.AmbientLight(0xFFFFFF, 0.6);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xFFFAF0, 0.8);
    keyLight.position.set(W, H * 1.5, D * 0.8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8FB8E0, 0.3);
    fillLight.position.set(-W, H, -D);
    scene.add(fillLight);

    // Colour parsing with safe fallbacks
    const parseColor = (hex: string | undefined, fallback: number) => {
      if (!hex) return new THREE.Color(fallback);
      try { return new THREE.Color(hex); } catch { return new THREE.Color(fallback); }
    };
    const wallColor    = parseColor(architecture.wall_colour_hex, 0xE8E4D8);
    const floorColor   = parseColor(architecture.floor_colour_hex, 0xB8A584);
    const ceilingColor = parseColor(architecture.ceiling_colour_hex, 0xF8F5EF);

    // Room shell (centered at origin, floor at y=0)
    const wallMat    = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.9, side: THREE.FrontSide });
    const floorMat   = new THREE.MeshStandardMaterial({ color: floorColor, roughness: 0.7 });
    const ceilingMat = new THREE.MeshStandardMaterial({ color: ceilingColor, roughness: 0.95 });

    // Back wall
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(W, H), wallMat);
    backWall.position.set(0, H / 2, -D / 2);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-W / 2, H / 2, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(D, H), wallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(W / 2, H / 2, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Floor
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(W, D), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    scene.add(floor);

    // Ceiling
    const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(W, D), ceilingMat);
    ceiling.rotation.x = Math.PI / 2;
    ceiling.position.set(0, H, 0);
    scene.add(ceiling);

    // Skirting board — a thin line at the base of each wall
    const skirtingMat = new THREE.MeshStandardMaterial({ color: 0xF0EAE0, roughness: 0.8 });
    const skirtingH = 0.15;
    const skirtingD = 0.02;
    const skirtingBack = new THREE.Mesh(new THREE.BoxGeometry(W, skirtingH, skirtingD), skirtingMat);
    skirtingBack.position.set(0, skirtingH / 2, -D / 2 + skirtingD / 2);
    scene.add(skirtingBack);
    const skirtingLeft = new THREE.Mesh(new THREE.BoxGeometry(skirtingD, skirtingH, D), skirtingMat);
    skirtingLeft.position.set(-W / 2 + skirtingD / 2, skirtingH / 2, 0);
    scene.add(skirtingLeft);
    const skirtingRight = new THREE.Mesh(new THREE.BoxGeometry(skirtingD, skirtingH, D), skirtingMat);
    skirtingRight.position.set(W / 2 - skirtingD / 2, skirtingH / 2, 0);
    scene.add(skirtingRight);

    // Features
    (architecture.features || []).forEach((f) => {
      const style = FEATURE_STYLES[f.type] || { color: 0xCCCCCC };
      const featMat = new THREE.MeshStandardMaterial({
        color: style.color,
        emissive: style.emissive || 0x000000,
        emissiveIntensity: style.emissive ? 0.3 : 0,
        roughness: 0.7,
      });

      const fw = f.width_cm * SCALE;
      const fh = f.height_cm * SCALE;
      const fd = 0.05; // 5cm depth / protrusion
      const geo = new THREE.BoxGeometry(fw, fh, fd);
      const mesh = new THREE.Mesh(geo, featMat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const xCm  = Math.max(0, Math.min(f.x_cm, architecture.wall_width_cm - f.width_cm));
      const yCm  = Math.max(0, Math.min(f.y_cm, architecture.wall_height_cm - f.height_cm));
      const x = (xCm - architecture.wall_width_cm / 2) * SCALE + fw / 2;
      const y = yCm * SCALE + fh / 2;

      switch (f.wall) {
        case 'back':
          mesh.position.set(x, y, -D / 2 + fd / 2 + 0.002);
          break;
        case 'left':
          mesh.rotation.y = Math.PI / 2;
          mesh.position.set(
            -W / 2 + fd / 2 + 0.002,
            y,
            (xCm - architecture.room_depth_cm / 2) * SCALE + fw / 2
          );
          break;
        case 'right':
          mesh.rotation.y = -Math.PI / 2;
          mesh.position.set(
            W / 2 - fd / 2 - 0.002,
            y,
            -((xCm - architecture.room_depth_cm / 2) * SCALE + fw / 2)
          );
          break;
        case 'floor':
          mesh.rotation.x = Math.PI / 2;
          mesh.position.set(x, fd / 2, (yCm - architecture.room_depth_cm / 2) * SCALE + fw / 2);
          break;
        case 'ceiling':
          mesh.rotation.x = -Math.PI / 2;
          mesh.position.set(x, H - fd / 2, (yCm - architecture.room_depth_cm / 2) * SCALE + fw / 2);
          break;
      }
      scene.add(mesh);

      // Edge highlight — a subtle wireframe for blueprint feel
      const edges = new THREE.EdgesGeometry(geo);
      const edgeLines = new THREE.LineSegments(
        edges,
        new THREE.LineBasicMaterial({ color: 0x0A0A0A, linewidth: 1, opacity: 0.4, transparent: true })
      );
      edgeLines.position.copy(mesh.position);
      edgeLines.rotation.copy(mesh.rotation);
      scene.add(edgeLines);
    });

    // Room edge lines — architectural outlines
    const roomEdges = new THREE.Group();
    const lineMat = new THREE.LineBasicMaterial({ color: 0x0051BA, opacity: 0.5, transparent: true });
    const makeLine = (a: [number, number, number], b: [number, number, number]) => {
      const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a), new THREE.Vector3(...b)]);
      return new THREE.Line(g, lineMat);
    };
    // floor box
    roomEdges.add(makeLine([-W/2, 0, -D/2], [ W/2, 0, -D/2]));
    roomEdges.add(makeLine([-W/2, 0,  D/2], [ W/2, 0,  D/2]));
    roomEdges.add(makeLine([-W/2, 0, -D/2], [-W/2, 0,  D/2]));
    roomEdges.add(makeLine([ W/2, 0, -D/2], [ W/2, 0,  D/2]));
    // verticals
    roomEdges.add(makeLine([-W/2, 0, -D/2], [-W/2, H, -D/2]));
    roomEdges.add(makeLine([ W/2, 0, -D/2], [ W/2, H, -D/2]));
    roomEdges.add(makeLine([-W/2, 0,  D/2], [-W/2, H,  D/2]));
    roomEdges.add(makeLine([ W/2, 0,  D/2], [ W/2, H,  D/2]));
    // ceiling box
    roomEdges.add(makeLine([-W/2, H, -D/2], [ W/2, H, -D/2]));
    roomEdges.add(makeLine([-W/2, H,  D/2], [ W/2, H,  D/2]));
    roomEdges.add(makeLine([-W/2, H, -D/2], [-W/2, H,  D/2]));
    roomEdges.add(makeLine([ W/2, H, -D/2], [ W/2, H,  D/2]));
    scene.add(roomEdges);

    // Animation loop — camera orbit
    let rafId = 0;
    let angle = Math.PI / 4;
    const orbit = () => {
      angle += 0.003;
      const r = cameraDist;
      camera.position.x = Math.sin(angle) * r;
      camera.position.z = Math.cos(angle) * r;
      camera.position.y = H * 0.55;
      camera.lookAt(0, H * 0.4, 0);
      renderer.render(scene, camera);
      rafId = requestAnimationFrame(orbit);
    };
    orbit();

    // Handle resize
    const onResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
      scene.traverse((obj: any) => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m: any) => m.dispose());
          else obj.material.dispose();
        }
      });
    };
  }, [architecture]);

  return (
    <div className="relative border-2 border-black bg-white p-2">
      <div ref={mountRef} className="bg-[#F5F1E8] w-full overflow-hidden" style={{ aspectRatio }}/>
      <div className="f-mono text-[10px] tracking-widest mt-2 opacity-60 px-1 flex justify-between">
        <span>3D ROOM MODEL</span>
        <span>{(architecture.features || []).length} FEATURES</span>
      </div>
    </div>
  );
}
