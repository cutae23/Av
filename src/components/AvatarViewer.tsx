import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { 
  Sun, 
  Moon, 
  Zap, 
  RotateCcw, 
  Download, 
  ChevronRight,
  Eye as EyeIcon,
  Sparkles
} from "lucide-react";
import { AvatarParameters } from "../types";

interface AvatarViewerProps {
  avatar: AvatarParameters;
  animation: string;
}

export default function AvatarViewer({ avatar, animation }: AvatarViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const avatarGroupRef = useRef<THREE.Group | null>(null);

  // References to limbs and face blocks for ticking the 30 animations!
  const headGroupRef = useRef<THREE.Group | null>(null);
  const leftEyeRef = useRef<THREE.Group | null>(null);
  const rightEyeRef = useRef<THREE.Group | null>(null);
  const leftArmRef = useRef<THREE.Mesh | null>(null);
  const rightArmRef = useRef<THREE.Mesh | null>(null);
  const leftLegRef = useRef<THREE.Group | null>(null);
  const rightLegRef = useRef<THREE.Group | null>(null);
  const headMeshRef = useRef<THREE.Mesh | null>(null);
  const leftFingersRef = useRef<THREE.Mesh[]>([]);
  const rightFingersRef = useRef<THREE.Mesh[]>([]);

  const [isRotating, setIsRotating] = useState(false);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rotationRef = useRef({ x: 0.1, y: -0.3 });
  const animTimeRef = useRef(0);

  // Touch & Drag controls
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsRotating(true);
    mouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isRotating) return;
    const deltaX = e.clientX - mouseRef.current.x;
    const deltaY = e.clientY - mouseRef.current.y;
    rotationRef.current.y += deltaX * 0.01;
    rotationRef.current.x = Math.max(-0.4, Math.min(0.4, rotationRef.current.x + deltaY * 0.01));
    mouseRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    setIsRotating(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsRotating(true);
      mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isRotating || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - mouseRef.current.x;
    const deltaY = e.touches[0].clientY - mouseRef.current.y;
    rotationRef.current.y += deltaX * 0.012;
    rotationRef.current.x = Math.max(-0.4, Math.min(0.4, rotationRef.current.x + deltaY * 0.012));
    mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const resetCamera = () => {
    rotationRef.current = { x: 0.1, y: -0.3 };
  };

  const downloadSnapshot = () => {
    if (!canvasRef.current) return;
    try {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      const dataUrl = canvasRef.current.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `3d_chibi_${avatar.gender}_${avatar.hairStyle}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to captured snapshot png:", err);
    }
  };

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    // We increase legLength to 0.82 for super long legs (롱다리) and offset the general group height (baseAvatarY) accordingly to anchor shoes perfectly on the ground!
    const legLength = 0.82;
    const baseAvatarY = 0.40; // Mathematically calculated to ensure the shoes sit perfectly on top of the 3D floor plateau (y = -0.98) without sinking!

    // 1. SCENE SETUP
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Get current container bounding size
    const width = containerRef.current.clientWidth || 500;
    const height = containerRef.current.clientHeight || 500;

    // 2. RENDERER SETUP (Transparent to let beautiful CSS gradients show!)
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // 3. CAMERA SETUP (Elevated to perfectly balance chibi leg bounds)
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    const initialZ = width < height ? 5.2 + (height / width) * 0.8 : 5.5;
    camera.position.set(0, 0.18, initialZ);
    cameraRef.current = camera;

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (renderer && camera) {
          renderer.setSize(w, h);
          camera.aspect = w / h;
          
          // Responsive dynamic distance to ensure head and accessory parts never get clipped on any viewports
          if (w < h) {
            camera.position.z = 5.2 + (h / w) * 0.8;
          } else {
            camera.position.z = 5.5;
          }
          camera.updateProjectionMatrix();
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    // 4. SITUATIONAL LIGHTING & ENVIRONMENT BLOCKS
    let ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    let directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(2, 4, 3);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(ambientLight);
    scene.add(directionalLight);

    // Floor matching the situational scenery
    let floorColor = 0xe5e5df;
    let floorRoughness = 0.9;
    let gridHelper: THREE.GridHelper | null = null;

    switch (avatar.background) {
      case "cafe":
        ambientLight.color.setHex(0xfcf3e8);
        ambientLight.intensity = 0.85;
        directionalLight.color.setHex(0xf59e0b);
        directionalLight.intensity = 0.9;
        directionalLight.position.set(2, 3, 2);
        floorColor = 0xbf9a7a; // warm wood parquet
        break;
      case "room":
        ambientLight.color.setHex(0xf5f3ff);
        ambientLight.intensity = 0.9;
        directionalLight.color.setHex(0x818cf8);
        directionalLight.intensity = 0.7;
        directionalLight.position.set(-1.5, 3, 2);
        floorColor = 0xedd6cc; // soft fluffy rug peach
        break;
      case "school":
        ambientLight.color.setHex(0xe0f2fe);
        ambientLight.intensity = 0.8;
        directionalLight.color.setHex(0x0284c7);
        directionalLight.intensity = 1.0;
        directionalLight.position.set(3, 4, 3);
        floorColor = 0xb2dfdb; // school floor green
        break;
      case "subway":
        ambientLight.color.setHex(0xf1f5f9);
        ambientLight.intensity = 0.75;
        directionalLight.color.setHex(0x64748b);
        directionalLight.intensity = 0.8;
        directionalLight.position.set(0, 4, 1);
        floorColor = 0xcfd8dc; // slate metal tile
        gridHelper = new THREE.GridHelper(10, 20, 0x90a4ae, 0xeceff1);
        break;
      case "hanriver":
        ambientLight.color.setHex(0xf0fdf4);
        ambientLight.intensity = 0.8;
        directionalLight.color.setHex(0x16a34a);
        directionalLight.intensity = 0.75;
        directionalLight.position.set(4, 4, 2);
        floorColor = 0x86efac; // fresh green grass
        break;
      case "beach":
        ambientLight.color.setHex(0xfffbeb);
        ambientLight.intensity = 1.0;
        directionalLight.color.setHex(0xeab308);
        directionalLight.intensity = 1.1;
        directionalLight.position.set(1, 5, 3);
        floorColor = 0xfef08a; // warm beach sand yellow
        break;
      case "cyberpunk":
        ambientLight.color.setHex(0x1e1b4b);
        ambientLight.intensity = 0.9;
        directionalLight.color.setHex(0xec4899); // neo pink light
        directionalLight.intensity = 1.25;
        directionalLight.position.set(-3, 3, 2);
        
        // Add a secondary cyan source for amazing split cyber shades!
        const cyberSecondary = new THREE.DirectionalLight(0x06b6d4, 1.25);
        cyberSecondary.position.set(3, 2, 2);
        scene.add(cyberSecondary);
        floorColor = 0x0f172a; // dark wet road
        gridHelper = new THREE.GridHelper(10, 16, 0xff00ff, 0x00ffff);
        break;
      case "library":
        ambientLight.color.setHex(0xfefbe9);
        ambientLight.intensity = 0.8;
        directionalLight.color.setHex(0xd97706); // warm lightbulb
        directionalLight.intensity = 0.95;
        directionalLight.position.set(1.5, 4, 3.5);
        floorColor = 0x5c4033; // dark desk wood
        break;
    }

    // Scenic base plateau circle
    const floorGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.08, 36);
    const floorMat = new THREE.MeshStandardMaterial({
      color: floorColor,
      roughness: floorRoughness,
      metalness: avatar.background === "cyberpunk" ? 0.44 : 0.02,
    });
    const floorPlateau = new THREE.Mesh(floorGeo, floorMat);
    floorPlateau.position.set(0, -1.02, 0);
    floorPlateau.receiveShadow = true;
    scene.add(floorPlateau);

    if (gridHelper) {
      gridHelper.position.set(0, -0.98, 0);
      scene.add(gridHelper);
    }

    // 4.5 DETAILED SCENIC DIORAMA BACKDROPS
    const bgPropsGroup = new THREE.Group();
    bgPropsGroup.name = "bgPropsGroup";
    scene.add(bgPropsGroup);

    const bgType = avatar.background || "cafe";

    if (bgType === "cafe") {
      // Warm Traditional Korean Hanok (한옥)
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3015, roughness: 0.85 }); // deep warm wood
      const paperMat = new THREE.MeshStandardMaterial({
        color: 0xfffcf5,
        emissive: 0xfff6e6,
        emissiveIntensity: 0.12,
        roughness: 0.95
      });
      const tileMat = new THREE.MeshStandardMaterial({ color: 0x3e4249, roughness: 0.88 }); // Giwa charcoal grey

      // Left Pillar
      const leftPillar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.8, 0.12), woodMat);
      leftPillar.position.set(-0.8, -0.1, -0.9);
      leftPillar.castShadow = true;
      leftPillar.receiveShadow = true;
      bgPropsGroup.add(leftPillar);

      // Right Pillar
      const rightPillar = leftPillar.clone();
      rightPillar.position.x = 0.8;
      bgPropsGroup.add(rightPillar);

      // Base beam
      const baseBeam = new THREE.Mesh(new THREE.BoxGeometry(1.72, 0.08, 0.1), woodMat);
      baseBeam.position.set(0, -0.94, -0.9);
      bgPropsGroup.add(baseBeam);

      // Top Cross Beam (대들보)
      const topBeam = new THREE.Mesh(new THREE.BoxGeometry(1.82, 0.14, 0.14), woodMat);
      topBeam.position.set(0, 0.78, -0.9);
      topBeam.castShadow = true;
      bgPropsGroup.add(topBeam);

      // Traditional Paper Sliding Door (창호지 창문)
      const paperWindow = new THREE.Mesh(new THREE.BoxGeometry(1.48, 1.6, 0.02), paperMat);
      paperWindow.position.set(0, -0.1, -0.95);
      paperWindow.receiveShadow = true;
      bgPropsGroup.add(paperWindow);

      // Wooden Lattice Grids (창살)
      // Center vertical divider
      const vDivider = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.6, 0.03), woodMat);
      vDivider.position.set(0, -0.1, -0.93);
      bgPropsGroup.add(vDivider);

      // Thin Vertical Grids
      const vertSpacings = [-0.6, -0.4, -0.2, 0.2, 0.4, 0.6];
      vertSpacings.forEach(x => {
        const gridBar = new THREE.Mesh(new THREE.BoxGeometry(0.012, 1.6, 0.012), woodMat);
        gridBar.position.set(x, -0.1, -0.935);
        bgPropsGroup.add(gridBar);
      });

      // Thin Horizontal Grids
      const horizSpacings = [-0.7, -0.5, -0.3, -0.1, 0.1, 0.3, 0.5, 0.7];
      horizSpacings.forEach(y => {
        const gridBar = new THREE.Mesh(new THREE.BoxGeometry(1.48, 0.012, 0.012), woodMat);
        gridBar.position.set(0, y, -0.935);
        bgPropsGroup.add(gridBar);
      });

      // Curved Giwa Tiled Roof Eave (처마 기와)
      const roofBase = new THREE.Mesh(new THREE.BoxGeometry(1.92, 0.06, 0.38), tileMat);
      roofBase.position.set(0, 0.88, -0.74);
      roofBase.rotation.x = 0.22;
      roofBase.castShadow = true;
      bgPropsGroup.add(roofBase);

      // Cylindrical Giwa ridges (기와골)
      const numTiles = 9;
      for (let i = 0; i < numTiles; i++) {
        const tX = -0.8 + (i * 0.2);
        const tileRidge = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.4, 8), tileMat);
        tileRidge.rotation.x = Math.PI / 2 + 0.22;
        tileRidge.position.set(tX, 0.91, -0.74);
        tileRidge.castShadow = true;
        bgPropsGroup.add(tileRidge);

        // Circular end cap (수막새)
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.02, 12), tileMat);
        cap.rotation.x = 0.22;
        cap.position.set(tX, 0.82, -0.57);
        cap.castShadow = true;
        bgPropsGroup.add(cap);

        // Gold center pattern on 수막새 for ultra premium look
        const goldCap = new THREE.Mesh(new THREE.SphereGeometry(0.014, 6, 6), new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.1 }));
        goldCap.position.set(tX, 0.82, -0.55);
        bgPropsGroup.add(goldCap);
      }

      // Traditional Soban Table (소반 찻상)
      const tableGroup = new THREE.Group();
      tableGroup.position.set(0.72, -0.98, 0.42);

      // Table top
      const topGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.025, 18);
      const topMesh = new THREE.Mesh(topGeo, woodMat);
      topMesh.position.y = 0.14;
      topMesh.castShadow = true;
      topMesh.receiveShadow = true;
      tableGroup.add(topMesh);

      // Curved legs
      const legGeo = new THREE.BoxGeometry(0.024, 0.14, 0.024);
      const legPositions = [
        [-0.14, 0.07, -0.14],
        [0.14, 0.07, -0.14],
        [-0.14, 0.07, 0.14],
        [0.14, 0.07, 0.14]
      ];
      legPositions.forEach(pos => {
        const leg = new THREE.Mesh(legGeo, woodMat);
        leg.position.set(pos[0], pos[1], pos[2]);
        leg.castShadow = true;
        tableGroup.add(leg);
      });
      bgPropsGroup.add(tableGroup);

      // Ceramic Celadon Teacup
      const cupGroup = new THREE.Group();
      cupGroup.position.set(0.7, -0.80, 0.4);
      
      const cupMat = new THREE.MeshStandardMaterial({ color: 0xaecdc2, roughness: 0.1, metalness: 0.1 }); // celadon jade
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.03, 0.054, 12), cupMat);
      cup.castShadow = true;
      cupGroup.add(cup);

      // Inside brown tea liquid
      const teaMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.1 });
      const tea = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.005, 10), teaMat);
      tea.position.y = 0.022;
      cupGroup.add(tea);

      bgPropsGroup.add(cupGroup);

      // Steam particles that will float
      const steamGroup = new THREE.Group();
      steamGroup.name = "steamGroup";
      steamGroup.position.set(0.7, -0.72, 0.4);
      
      const steamMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 });
      for (let i = 0; i < 3; i++) {
        const sParticle = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), steamMat);
        sParticle.position.set((Math.random() - 0.5) * 0.02, i * 0.04, (Math.random() - 0.5) * 0.02);
        sParticle.userData = { baseY: i * 0.04, offset: i * 2 };
        steamGroup.add(sParticle);
      }
      bgPropsGroup.add(steamGroup);

    } else if (bgType === "room") {
      // Cozy Bedroom
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xfdf2f8, roughness: 0.9 }); // soft pink/lavender wall
      const wall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.04), wallMat);
      wall.position.set(0, -0.1, -0.98);
      wall.receiveShadow = true;
      bgPropsGroup.add(wall);

      // Floor trim
      const trim = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.06, 0.06), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }));
      trim.position.set(0, -0.95, -0.96);
      bgPropsGroup.add(trim);

      // Hanging Star Glowing Cord
      const cord = new THREE.Mesh(new THREE.BoxGeometry(0.006, 0.7, 0.006), new THREE.MeshBasicMaterial({ color: 0x64748b }));
      cord.position.set(-0.4, 0.5, -0.9);
      bgPropsGroup.add(cord);

      // Glowing Star Lamp
      const starGeo = new THREE.SphereGeometry(0.062, 8, 8);
      starGeo.scale(1, 1, 0.5);
      const starLamp = new THREE.Mesh(starGeo, new THREE.MeshBasicMaterial({ color: 0xfbefa3 }));
      starLamp.position.set(-0.4, 0.12, -0.9);
      bgPropsGroup.add(starLamp);

      // Floating Glow Ring
      const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.01, 8, 16), new THREE.MeshBasicMaterial({ color: 0xfde047 }));
      glowRing.rotation.x = Math.PI / 2;
      glowRing.position.set(-0.4, 0.12, -0.9);
      bgPropsGroup.add(glowRing);

      // Bedside Shelf wood
      const shelfWood = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8 }); // clean white
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.22), shelfWood);
      shelf.position.set(-0.68, -0.4, -0.88);
      shelf.castShadow = true;
      bgPropsGroup.add(shelf);

      // Terracotta Pot Cactus
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.03, 0.074, 10), new THREE.MeshStandardMaterial({ color: 0xed785c, roughness: 0.9 }));
      pot.position.set(-0.68, -0.32, -0.88);
      pot.castShadow = true;
      bgPropsGroup.add(pot);

      const cactus = new THREE.Mesh(new THREE.SphereGeometry(0.038, 8, 8), new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.8 }));
      cactus.position.set(-0.68, -0.25, -0.88);
      cactus.scale.set(1, 1.4, 1);
      cactus.castShadow = true;
      bgPropsGroup.add(cactus);

      // Pink Fluffy Heart Pillow on the Floor
      const pillowGroup = new THREE.Group();
      pillowGroup.position.set(0.68, -0.96, 0.44);
      pillowGroup.rotation.set(0.12, -0.4, 0.1);
      
      const pillowMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.85 }); // warm pink velvet
      const sideL = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 12), pillowMat);
      sideL.position.set(-0.04, 0, 0);
      sideL.scale.set(1.1, 1.0, 0.6);
      pillowGroup.add(sideL);

      const sideR = sideL.clone();
      sideR.position.x = 0.04;
      pillowGroup.add(sideR);

      const tail = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.14, 12), pillowMat);
      tail.position.set(0, -0.06, 0);
      tail.rotation.x = Math.PI;
      tail.scale.set(1.4, 1.0, 0.6);
      pillowGroup.add(tail);

      bgPropsGroup.add(pillowGroup);

    } else if (bgType === "school") {
      // School Classroom
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.92 }); // yellow-beige board wall
      const wall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.04), wallMat);
      wall.position.set(0, -0.1, -0.98);
      wall.receiveShadow = true;
      bgPropsGroup.add(wall);

      // Blackboard (칠판)
      const boardWood = new THREE.MeshStandardMaterial({ color: 0x854d0e, roughness: 0.8 }); // wood frame
      const boardBack = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.98, 0.02), boardWood);
      boardBack.position.set(0, 0.12, -0.95);
      boardBack.castShadow = true;
      bgPropsGroup.add(boardBack);

      const boardGreen = new THREE.Mesh(new THREE.BoxGeometry(1.58, 0.88, 0.02), new THREE.MeshStandardMaterial({ color: 0x166534, roughness: 0.98 }));
      boardGreen.position.set(0, 0.12, -0.93);
      boardGreen.receiveShadow = true;
      bgPropsGroup.add(boardGreen);

      // White Chalk Scribble Drawing (Heart)
      const chalkMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const line1 = new THREE.Mesh(new THREE.BoxGeometry(0.015, 0.12, 0.005), chalkMat);
      line1.position.set(-0.06, 0.16, -0.91);
      line1.rotation.z = -Math.PI / 4;
      bgPropsGroup.add(line1);

      const line2 = line1.clone();
      line2.position.x = 0.06;
      line2.rotation.z = Math.PI / 4;
      bgPropsGroup.add(line2);

      // Text line scribbles
      for (let j = 0; j < 3; j++) {
        const textBar = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.012, 0.005), chalkMat);
        textBar.position.set(-0.42, 0.22 - j * 0.08, -0.91);
        bgPropsGroup.add(textBar);
      }

      // Cozy student wood desk
      const deskGroup = new THREE.Group();
      deskGroup.position.set(0.72, -0.98, 0.4);

      const deskTop = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.026, 0.28), new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 }));
      deskTop.position.y = 0.25;
      deskTop.castShadow = true;
      deskTop.receiveShadow = true;
      deskGroup.add(deskTop);

      const metalMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.5, metalness: 0.6 });
      const deskPositions = [
        [-0.16, 0.12, -0.11],
        [0.16, 0.12, -0.11],
        [-0.16, 0.12, 0.11],
        [0.16, 0.12, 0.11]
      ];
      deskPositions.forEach(pos => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.26, 8), metalMat);
        leg.position.set(pos[0], pos[1], pos[2]);
        leg.castShadow = true;
        deskGroup.add(leg);
      });
      bgPropsGroup.add(deskGroup);

    } else if (bgType === "subway") {
      // Midnight Subway Station
      const wallMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.2, roughness: 0.4 }); // steel/white panel
      const wall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.04), wallMat);
      wall.position.set(0, -0.1, -0.98);
      wall.receiveShadow = true;
      bgPropsGroup.add(wall);

      // Dark window pane
      const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.74, 0.03), new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 }));
      windowFrame.position.set(0, 0.22, -0.95);
      bgPropsGroup.add(windowFrame);

      const windowGlass = new THREE.Mesh(new THREE.BoxGeometry(1.32, 0.66, 0.02), new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.1,
        transparent: true,
        opacity: 0.52
      }));
      windowGlass.position.set(0, 0.22, -0.93);
      bgPropsGroup.add(windowGlass);

      // Chrome vertical handle rails (지하철 손잡이)
      const chromeMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.8, 10), chromeMat);
      pole.position.set(-0.64, -0.1, -0.3);
      pole.castShadow = true;
      bgPropsGroup.add(pole);

      const hPole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.8, 10), chromeMat);
      hPole.rotation.z = Math.PI / 2;
      hPole.position.set(0, 0.72, -0.3);
      bgPropsGroup.add(hPole);

      // Cute dangling subway handle (손잡이)
      const handleMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.5 }); // safety yellow
      const handleStrap = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.16, 0.03), handleMat);
      handleStrap.position.set(-0.2, 0.6, -0.3);
      bgPropsGroup.add(handleStrap);

      const ringGeo = new THREE.TorusGeometry(0.042, 0.008, 6, 12);
      const ring = new THREE.Mesh(ringGeo, handleMat);
      ring.position.set(-0.2, 0.5, -0.3);
      bgPropsGroup.add(ring);

    } else if (bgType === "hanriver") {
      // Han River Park Picnic Green
      // Checked red & white picnic mat
      const blanketGroup = new THREE.Group();
      blanketGroup.position.set(0.24, -1.01, 0.38);
      blanketGroup.rotation.y = 0.14;

      const size = 5;
      const cellSize = 0.18;
      for (let x = 0; x < size; x++) {
        for (let z = 0; z < size; z++) {
          const color = (x + z) % 2 === 0 ? 0xef4444 : 0xffffff;
          const cell = new THREE.Mesh(new THREE.BoxGeometry(cellSize, 0.01, cellSize), new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
          cell.position.set((x - (size / 2)) * cellSize, 0, (z - (size / 2)) * cellSize);
          cell.receiveShadow = true;
          blanketGroup.add(cell);
        }
      }
      bgPropsGroup.add(blanketGroup);

      // Picnic Basket
      const basketGroup = new THREE.Group();
      basketGroup.position.set(0.66, -0.98, 0.56);
      basketGroup.rotation.y = -0.32;

      const basketMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.9 }); // rattan straw brown
      const basketBody = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.18), basketMat);
      basketBody.castShadow = true;
      basketGroup.add(basketBody);

      // Basket straw handle
      const ringGeo = new THREE.TorusGeometry(0.08, 0.012, 6, 16, Math.PI);
      const handle = new THREE.Mesh(ringGeo, basketMat);
      handle.position.set(0, 0.075, 0);
      handle.castShadow = true;
      basketGroup.add(handle);

      bgPropsGroup.add(basketGroup);

      // Tree on the left background
      const treeGroup = new THREE.Group();
      treeGroup.position.set(-0.76, -0.98, -0.74);

      const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.044, 0.054, 0.88, 8), woodMat);
      trunk.position.y = 0.44;
      trunk.castShadow = true;
      treeGroup.add(trunk);

      const leaveMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 }); // deep green
      const leaveL = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 12), leaveMat);
      leaveL.position.set(0, 0.85, 0);
      leaveL.castShadow = true;
      treeGroup.add(leaveL);

      const leaveR = new THREE.Mesh(new THREE.SphereGeometry(0.20, 12, 12), leaveMat);
      leaveR.position.set(0.12, 0.95, -0.05);
      leaveR.castShadow = true;
      treeGroup.add(leaveR);

      bgPropsGroup.add(treeGroup);

    } else if (bgType === "beach") {
      // Emerald Beach Diorama
      // Turquoise Ocean Back Plane
      const oceanMat = new THREE.MeshStandardMaterial({ color: 0x14b8a6, roughness: 0.3 }); // shiny teal ocean
      const ocean = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.04), oceanMat);
      ocean.position.set(0, -0.1, -0.98);
      ocean.receiveShadow = true;
      bgPropsGroup.add(ocean);

      // Striped Sun Parasol (파라솔)
      const parasolGroup = new THREE.Group();
      parasolGroup.position.set(-0.72, -0.98, -0.38);

      const poleMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.6 });
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 1.35, 8), poleMat);
      pole.position.y = 0.675;
      pole.castShadow = true;
      parasolGroup.add(pole);

      const umbrellaMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.7 }); // neon red stripe canopy
      const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.48, 0.22, 16), umbrellaMat);
      canopy.position.y = 1.34;
      canopy.castShadow = true;
      parasolGroup.add(canopy);

      // White stripe inserts
      const whiteCap = new THREE.Mesh(new THREE.ConeGeometry(0.44, 0.20, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }));
      whiteCap.position.y = 1.345;
      whiteCap.rotation.y = 0.38; // twist slightly to overlap stripe pattern
      parasolGroup.add(whiteCap);

      bgPropsGroup.add(parasolGroup);

      // Colorful striped beach ball
      const ballGroup = new THREE.Group();
      ballGroup.position.set(0.68, -0.93, 0.54);
      ballGroup.rotation.set(0.3, -0.5, 0.2);

      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 16), new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.4 })); // yellow base
      ball.castShadow = true;
      ballGroup.add(ball);

      // Red vertical stripes
      for (let j = 0; j < 3; j++) {
        const stripe = new THREE.Mesh(new THREE.SphereGeometry(0.122, 12, 12, j * 2.09, 0.4), new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.4 }));
        ballGroup.add(stripe);
      }
      bgPropsGroup.add(ballGroup);

    } else if (bgType === "cyberpunk") {
      // Neo Hongdae Cyber Alleyway
      const brickMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 }); // dark asphalt grey
      const wall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.04), brickMat);
      wall.position.set(0, -0.1, -0.98);
      wall.receiveShadow = true;
      bgPropsGroup.add(wall);

      // Vertical neon tube pink (핑크 네온바)
      const neonPink = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.74, 0.03), new THREE.MeshStandardMaterial({
        color: 0xff007f,
        emissive: 0xff007f,
        emissiveIntensity: 1.2,
        roughness: 0.1
      }));
      neonPink.position.set(-0.76, 0.12, -0.94);
      bgPropsGroup.add(neonPink);

      // Cyan neon ring sign (시안 네온 고리)
      const ringSign = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.016, 8, 16), new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 1.2,
        roughness: 0.1
      }));
      ringSign.position.set(0.66, 0.26, -0.94);
      bgPropsGroup.add(ringSign);

      // Copper & Steel Pipes
      const copperMat = new THREE.MeshStandardMaterial({ color: 0x9a3412, metalness: 0.9, roughness: 0.1 });
      const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 1.8, 8), copperMat);
      pipe1.position.set(-0.44, -0.1, -0.96);
      bgPropsGroup.add(pipe1);

      const silverMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.8, roughness: 0.2 });
      const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.8, 8), silverMat);
      pipe2.rotation.z = Math.PI / 2;
      pipe2.position.set(0, -0.32, -0.96);
      bgPropsGroup.add(pipe2);

    } else if (bgType === "library") {
      // Quiet Warm Book Library
      const backWall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.8, 0.04), new THREE.MeshStandardMaterial({ color: 0x3b1c06, roughness: 0.9 })); // mahogany back board
      backWall.position.set(0, -0.1, -0.98);
      bgPropsGroup.add(backWall);

      // Bookshelves (책꽂이 3단 선반)
      const shelfMat = new THREE.MeshStandardMaterial({ color: 0x5c2c0a, roughness: 0.8 }); // wood shelves
      const shelf1 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 0.14), shelfMat);
      shelf1.position.set(0, 0.38, -0.92);
      bgPropsGroup.add(shelf1);

      const shelf2 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 0.14), shelfMat);
      shelf2.position.set(0, -0.14, -0.92);
      bgPropsGroup.add(shelf2);

      const shelf3 = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.04, 0.14), shelfMat);
      shelf3.position.set(0, -0.66, -0.92);
      bgPropsGroup.add(shelf3);

      // Colorful book clusters on shelf 1
      const bookColors = [0xef4444, 0x3b82f6, 0x10b981, 0xf59e0b, 0xec4899, 0xffffff];
      const bookWidth = 0.028;
      
      // shelf 1 left cluster
      for (let k = 0; k < 6; k++) {
        const height = 0.14 + Math.random() * 0.08;
        const bMat = new THREE.MeshStandardMaterial({ color: bookColors[k % bookColors.length], roughness: 0.7 });
        const book = new THREE.Mesh(new THREE.BoxGeometry(bookWidth, height, 0.098), bMat);
        book.position.set(-0.76 + (k * 0.032), 0.38 + (height / 2) + 0.02, -0.92);
        book.castShadow = true;
        bgPropsGroup.add(book);
      }

      // shelf 1 right cluster (leaning)
      for (let k = 0; k < 5; k++) {
        const height = 0.13 + Math.random() * 0.08;
        const bMat = new THREE.MeshStandardMaterial({ color: bookColors[(k + 3) % bookColors.length], roughness: 0.7 });
        const book = new THREE.Mesh(new THREE.BoxGeometry(bookWidth, height, 0.098), bMat);
        book.position.set(0.48 + (k * 0.032), -0.14 + (height / 2) + 0.02, -0.92);
        if (k === 4) {
          book.rotation.z = -0.22;
          book.position.x += 0.02;
          book.position.y -= 0.01;
        }
        book.castShadow = true;
        bgPropsGroup.add(book);
      }

      // Vintage Emerald Desk Lamp (데스크 스탠드)
      const lampGroup = new THREE.Group();
      lampGroup.position.set(-0.64, -0.98, 0.44);

      const brassMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.9, roughness: 0.15 });
      const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.018, 12), brassMat);
      lampBase.castShadow = true;
      lampGroup.add(lampBase);

      const lampStem = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.18, 8), brassMat);
      lampStem.position.y = 0.09;
      lampStem.castShadow = true;
      lampGroup.add(lampStem);

      const lampShade = new THREE.Mesh(new THREE.SphereGeometry(0.065, 12, 12), new THREE.MeshStandardMaterial({ color: 0x065f46, roughness: 0.1 })); // emerald green
      lampShade.scale.set(1.1, 0.6, 1.1);
      lampShade.position.y = 0.18;
      lampShade.castShadow = true;
      lampGroup.add(lampShade);

      bgPropsGroup.add(lampGroup);
    }

    // 5. ASSEMBLE 3D CHIBI CHARACTER
    const avatarGroup = new THREE.Group();
    scene.add(avatarGroup);
    avatarGroupRef.current = avatarGroup;

    // Materials Palette
    const skinMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatar.skinColor),
      roughness: 0.52,
      metalness: 0.0,
    });

    const hairMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatar.hairColor),
      roughness: 0.64,
      metalness: 0.0,
    });

    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatar.clothingColor),
      roughness: 0.72,
    });

    const bottomMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatar.bottomColor),
      roughness: 0.65,
    });

    const eyesWhiteMat = new THREE.MeshStandardMaterial({
      color: 0xfafafa,
      roughness: 0.4,
    });

    const irisMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(avatar.eyeColor),
      roughness: 0.48,
    });

    const blackPupilMat = new THREE.MeshBasicMaterial({ color: 0x111111 });

    // A. HEAD BASE
    // Determine custom face shape scales first
    const fShape = avatar.faceShape || "round";
    let scaleX = 1.0;
    let scaleY = 1.0;
    let scaleZ = 1.0;
    if (fShape === "long") {
      scaleX = 0.94;
      scaleY = 1.15;
      scaleZ = 0.96;
    } else if (fShape === "square") {
      scaleX = 1.14;
      scaleY = 0.94;
      scaleZ = 0.98;
    } else if (fShape === "heart") {
      scaleX = 1.06;
      scaleY = 0.98;
      scaleZ = 0.92;
    } else if (fShape === "chubby") {
      scaleX = 1.15;
      scaleY = 0.92;
      scaleZ = 1.12;
    } else if (fShape === "slim") {
      scaleX = 0.92;
      scaleY = 1.08;
      scaleZ = 0.94;
    }

    const headGroup = new THREE.Group();
    headGroup.name = "headGroup";
    headGroup.position.set(0, 0.38, 0);
    const fScale = avatar.faceScale !== undefined ? avatar.faceScale : 0.72;
    // Scale the entire headGroup (head + all features + hair + ears + accessories) together
    headGroup.scale.set(fScale * scaleX, fScale * scaleY, fScale * scaleZ);
    avatarGroup.add(headGroup);
    headGroupRef.current = headGroup;

    // Head sphere (Perfect cute chubby baby-face ratio, dynamically reshaped via headGroup scaling)
    const headGeo = new THREE.SphereGeometry(0.72, 32, 28);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.scale.set(1.0, 1.0, 1.0);
    
    headMesh.castShadow = true;
    headMesh.receiveShadow = true;
    headGroup.add(headMesh);
    headMeshRef.current = headMesh;

    // B. EARS (귀도 만들어주고 - 10 styles!)
    const renderEars = () => {
      // Since parent headGroup is scaled by scaleX, scaleY, scaleZ, we set multiplier to 1.0
      // to avoid double-scaling ear coordinates.
      let earOffsetMultiplierX = 1.0;

      const earGroupL = new THREE.Group();
      earGroupL.position.set(-0.76 * earOffsetMultiplierX, 0.0, -0.05);
      headGroup.add(earGroupL);

      const earGroupR = new THREE.Group();
      earGroupR.position.set(0.76 * earOffsetMultiplierX, 0.0, -0.05);
      headGroup.add(earGroupR);

      const earStyle = avatar.earStyle;

      if (earStyle === "none") return;

      let earBaseGeo: THREE.BufferGeometry = new THREE.SphereGeometry(0.12, 12, 12);
      earBaseGeo.scale(0.85, 1.25, 0.45);

      if (earStyle === "pointy") {
        // Elf pointy
        earBaseGeo = new THREE.ConeGeometry(0.1, 0.36, 12);
        earBaseGeo.rotateZ(Math.PI / 4);
      } else if (earStyle === "elephant") {
        // Huge elephant ears
        earBaseGeo = new THREE.SphereGeometry(0.24, 16, 16);
        earBaseGeo.scale(1.1, 1.6, 0.25);
      } else if (earStyle === "droop") {
        // Droop puppy dog ears
        earBaseGeo = new THREE.SphereGeometry(0.15, 12, 12);
        earBaseGeo.scale(0.7, 2.0, 0.7);
        earBaseGeo.translate(0, -0.15, 0);
      }

      const earL = new THREE.Mesh(earBaseGeo, skinMat);
      const earR = new THREE.Mesh(earBaseGeo, skinMat);

      if (earStyle === "pointy") {
        earL.rotation.set(0.2, -0.4, 0.4);
        earR.rotation.set(0.2, 0.4, -0.4);
      } else if (earStyle === "droop") {
        earL.position.x = -0.04;
        earR.position.x = 0.04;
      }

      earGroupL.add(earL);
      earGroupR.add(earR);

      // Ear decoration additions
      if (earStyle === "piercing") {
        // Silver ring loops
        const pierceGeo = new THREE.TorusGeometry(0.04, 0.014, 8, 12);
        const pierceL = new THREE.Mesh(pierceGeo, new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 }));
        pierceL.position.set(-0.06, -0.1, 0.05);
        earGroupL.add(pierceL);

        const pierceR = pierceL.clone();
        pierceR.position.set(0.06, -0.1, 0.05);
        earGroupR.add(pierceR);
      } else if (earStyle === "star") {
        // Glowing star dangle
        const starGeo = new THREE.ConeGeometry(0.05, 0.08, 5);
        starGeo.rotateX(Math.PI);
        const starMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
        
        const dangleL = new THREE.Mesh(starGeo, starMat);
        dangleL.position.set(-0.02, -0.18, 0.05);
        earGroupL.add(dangleL);

        const dangleR = dangleL.clone();
        dangleR.position.set(0.02, -0.18, 0.05);
        earGroupR.add(dangleR);
      } else if (earStyle === "earbuds") {
        // Airpods white cylinders
        const budGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.11, 8);
        const budMat = new THREE.MeshStandardMaterial({ color: 0xfafafa, roughness: 0.2 });
        
        const budL = new THREE.Mesh(budGeo, budMat);
        budL.position.set(0.05, -0.06, 0.06);
        budL.rotation.set(0.2, 0, 0.4);
        earGroupL.add(budL);

        const budR = budL.clone();
        budR.position.set(-0.05, -0.06, 0.06);
        budR.rotation.set(0.2, 0, -0.4);
        earGroupR.add(budR);
      } else if (earStyle === "earmuffs") {
        // Cozy furry winter earmuffs
        const muffGeo = new THREE.SphereGeometry(0.22, 16, 16);
        const muffMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.9 });
        
        const muffL = new THREE.Mesh(muffGeo, muffMat);
        earGroupL.add(muffL);

        const muffR = muffL.clone();
        earGroupR.add(muffR);

        // muff headband connector
        const bandGeo = new THREE.TorusGeometry(0.75, 0.03, 8, 24, Math.PI);
        const band = new THREE.Mesh(bandGeo, muffMat);
        band.position.set(0, 0.4, 0);
        headGroup.add(band);
      } else if (earStyle === "spiral_bot") {
        // Cyborg metallic nuts
        const nutGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.1, 6);
        const nutMat = new THREE.MeshStandardMaterial({ color: 0xb5a642, metalness: 0.9, roughness: 0.15 });
        
        const nutL = new THREE.Mesh(nutGeo, nutMat);
        nutL.rotation.z = Math.PI / 2;
        earGroupL.add(nutL);

        const nutR = nutL.clone();
        earGroupR.add(nutR);
      }
    };
    renderEars();

    // C. EYES (10 styles each!)
    const eyeSize = 0.096;
    const eyeSpacing = 0.20;
    const eyeHeight = 0.12;
    const eyeDepth = 0.725;

    const leftEyeGroup = new THREE.Group();
    leftEyeGroup.position.set(-eyeSpacing, eyeHeight, eyeDepth);
    headGroup.add(leftEyeGroup);
    leftEyeRef.current = leftEyeGroup;

    const rightEyeGroup = new THREE.Group();
    rightEyeGroup.position.set(eyeSpacing, eyeHeight, eyeDepth);
    headGroup.add(rightEyeGroup);
    rightEyeRef.current = rightEyeGroup;

    const renderEyebolds = () => {
      const eStyle = avatar.eyeStyle;

      if (eStyle === "classic") {
        // Classic simple chibi dots (no whites)
        const dotGeo = new THREE.SphereGeometry(eyeSize * 0.74, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.5);
        dotGeo.scale(1, 1, 0.12);
        
        const dotL = new THREE.Mesh(dotGeo, blackPupilMat);
        dotL.rotation.x = Math.PI / 2;
        leftEyeGroup.add(dotL);

        const dotR = dotL.clone();
        rightEyeGroup.add(dotR);
        return;
      }

      if (eStyle === "closed") {
        // Simple elegant crescent closed lines
        const loopGeo = new THREE.TorusGeometry(eyeSize * 0.92, 0.016, 6, 16, Math.PI);
        const loopL = new THREE.Mesh(loopGeo, blackPupilMat);
        loopL.position.y = -0.01;
        leftEyeGroup.add(loopL);

        const loopR = loopL.clone();
        rightEyeGroup.add(loopR);
        return;
      }

      // Sclera white base
      const eyeScleraGeo = new THREE.SphereGeometry(eyeSize, 18, 18);
      eyeScleraGeo.scale(1.0, 1.0, 0.14);
      const leftSclera = new THREE.Mesh(eyeScleraGeo, eyesWhiteMat);
      leftEyeGroup.add(leftSclera);

      const rightSclera = leftSclera.clone();
      rightEyeGroup.add(rightSclera);

      // Iris layout
      const irisGeo = new THREE.SphereGeometry(eyeSize * 0.58, 16, 16);
      irisGeo.scale(1.0, 1.0, 0.1);
      
      const leftIris = new THREE.Mesh(irisGeo, irisMat);
      leftIris.position.set(0, 0, eyeSize * 0.12);
      
      const rightIris = leftIris.clone();

      if (eStyle === "slit") {
        leftIris.scale.set(0.3, 1, 1);
        rightIris.scale.set(0.3, 1, 1);
      } else if (eStyle === "heart") {
        leftIris.scale.set(1.2, 0.8, 1);
        rightIris.scale.set(1.2, 0.8, 1);
        leftIris.material = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.4 });
        rightIris.material = leftIris.material;
      }

      leftEyeGroup.add(leftIris);
      rightEyeGroup.add(rightIris);

      // Pupil layer
      const pupilGeo = new THREE.SphereGeometry(eyeSize * 0.32, 12, 12);
      pupilGeo.scale(1, 1, 0.08);
      const leftPupil = new THREE.Mesh(pupilGeo, blackPupilMat);
      leftPupil.position.set(0, 0, eyeSize * 0.18);
      leftEyeGroup.add(leftPupil);

      const rightPupil = leftPupil.clone();
      rightEyeGroup.add(rightPupil);

      // Catchlight shine highlights
      const shineGeo = new THREE.SphereGeometry(eyeSize * 0.16, 8, 8);
      const shineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      
      const shine1 = new THREE.Mesh(shineGeo, shineMat);
      shine1.position.set(eyeSize * 0.22, eyeSize * 0.22, eyeSize * 0.22);
      leftEyeGroup.add(shine1);

      const shine2 = shine1.clone();
      rightEyeGroup.add(shine2);

      if (eStyle === "anime") {
        // Render 2 extra sparkly shine particles
        const extraShineL = shine1.clone();
        extraShineL.scale.set(0.5, 0.5, 0.5);
        extraShineL.position.set(-eyeSize * 0.2, -eyeSize * 0.2, eyeSize * 0.2);
        leftEyeGroup.add(extraShineL);

        const extraShineR = extraShineL.clone();
        rightEyeGroup.add(extraShineR);
      } else if (eStyle === "star") {
        // Yellow star shine pupil replacement
        const starShinyGeo = new THREE.ConeGeometry(eyeSize * 0.3, 0.04, 5);
        const starShinyMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        
        const starShinyL = new THREE.Mesh(starShinyGeo, starShinyMat);
        starShinyL.position.set(0, 0, eyeSize * 0.2);
        starShinyL.rotation.x = Math.PI / 2;
        leftEyeGroup.add(starShinyL);

        const starShinyR = starShinyL.clone();
        rightEyeGroup.add(starShinyR);
      } else if (eStyle === "spiral") {
        // Hypnotic black helix ring
        const spiralGeo = new THREE.TorusGeometry(eyeSize * 0.26, 0.012, 4, 12);
        const spiralL = new THREE.Mesh(spiralGeo, blackPupilMat);
        spiralL.position.set(0, 0, eyeSize * 0.2);
        leftEyeGroup.add(spiralL);

        const spiralR = spiralL.clone();
        rightEyeGroup.add(spiralR);
      }
    };
    renderEyebolds();

    // D. EYEBROWS (10 styles!)
    const renderEyebrows = () => {
      const bStyle = avatar.eyebrowsStyle;
      if (bStyle === "none") return;

      const browMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(avatar.hairColor),
        roughness: 0.9,
      });

      let browBoxGeo = new THREE.BoxGeometry(0.16, 0.024, 0.02);
      
      if (bStyle === "thick") {
        browBoxGeo = new THREE.BoxGeometry(0.18, 0.05, 0.02);
      } else if (bStyle === "dots") {
        browBoxGeo = new THREE.BoxGeometry(0.05, 0.05, 0.02); // little circular box blocks
      }

      const browL = new THREE.Mesh(browBoxGeo, browMat);
      browL.position.set(-eyeSpacing, eyeHeight + 0.15, eyeDepth - 0.03);
      
      const browR = new THREE.Mesh(browBoxGeo, browMat);
      browR.position.set(eyeSpacing, eyeHeight + 0.15, eyeDepth - 0.03);

      // Style adjustments
      switch (bStyle) {
        case "curved":
          browL.rotation.z = 0.08;
          browR.rotation.z = -0.08;
          break;
        case "slanted":
          browL.rotation.z = 0.16;
          browR.rotation.z = -0.16;
          break;
        case "angry":
          browL.rotation.z = -0.22;
          browR.rotation.z = 0.22;
          browL.position.y -= 0.03;
          browR.position.y -= 0.03;
          break;
        case "sad":
          browL.rotation.z = 0.22;
          browR.rotation.z = -0.22;
          browL.position.y += 0.02;
          browR.position.y += 0.02;
          break;
        case "wavy":
          browL.rotation.x = 0.4;
          browR.rotation.y = 0.4;
          break;
        case "crossed":
          browL.rotation.z = 0.1;
          browR.rotation.z = -0.1;
          break;
      }

      headGroup.add(browL);
      headGroup.add(browR);
    };
    renderEyebrows();

    // E. NOSE (10 styles!)
    const renderNoseModel = () => {
      const nStyle = avatar.noseStyle;
      if (nStyle === "flat_nose") return;

      let noseGeo = new THREE.SphereGeometry(0.046, 12, 12);
      let noseMat = skinMat;

      if (nStyle === "tall") {
        noseGeo = new THREE.SphereGeometry(0.044, 12, 12);
        noseGeo.scale(1, 1.9, 1);
      } else if (nStyle === "pointy") {
        noseGeo = new THREE.SphereGeometry(0.046, 12, 12);
        noseGeo.scale(1, 1, 2.2);
      } else if (nStyle === "broad") {
        noseGeo = new THREE.SphereGeometry(0.068, 12, 12);
        noseGeo.scale(1.5, 1, 1);
      } else if (nStyle === "snout") {
        noseGeo = new THREE.SphereGeometry(0.05, 12, 12);
        noseGeo.scale(1.4, 0.8, 1.2);
      } else if (nStyle === "heart_nose") {
        noseGeo = new THREE.SphereGeometry(0.05, 12, 12);
        noseGeo.scale(1, 1, 1);
        noseMat = new THREE.MeshStandardMaterial({ color: 0xffa4a4 });
      } else if (nStyle === "cat_nose") {
        noseGeo = new THREE.SphereGeometry(0.036, 10, 10);
        noseGeo.scale(1.2, 0.6, 0.8);
        noseMat = blackPupilMat as any;
      } else if (nStyle === "pixel") {
        noseGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06) as any;
      }

      const nose = new THREE.Mesh(noseGeo, noseMat);
      nose.position.set(0, 0.04, eyeDepth + 0.035);
      headGroup.add(nose);
    };
    renderNoseModel();

    // F. MOUTH COMPONENT (10 styles!)
    const renderMouthObj = () => {
      const mStyle = avatar.mouthStyle;
      const mouthMat = new THREE.MeshStandardMaterial({
        color: 0x8f2d56,
        roughness: 0.6,
      });

      const mouthPos = new THREE.Vector3(0, -0.09, eyeDepth + 0.03);

      if (mStyle === "smile") {
        const smileGeo = new THREE.TorusGeometry(0.09, 0.02, 8, 18, Math.PI);
        const smile = new THREE.Mesh(smileGeo, mouthMat);
        smile.position.copy(mouthPos);
        smile.rotation.set(0, 0, Math.PI); // sweep upwards
        headGroup.add(smile);
      } else if (mStyle === "gasp") {
        const gaspGeo = new THREE.TorusGeometry(0.054, 0.02, 8, 14);
        const gasp = new THREE.Mesh(gaspGeo, mouthMat);
        gasp.position.copy(mouthPos);
        headGroup.add(gasp);
      } else if (mStyle === "smirk") {
        const smirkGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.12, 8);
        const smirk = new THREE.Mesh(smirkGeo, mouthMat);
        smirk.position.copy(mouthPos).add(new THREE.Vector3(0.03, 0.02, 0));
        smirk.rotation.set(0.1, 0, -0.22);
        headGroup.add(smirk);
      } else if (mStyle === "heart_mouth") {
        const heartGeo = new THREE.SphereGeometry(0.045, 12, 12);
        heartGeo.scale(1.3, 0.8, 1);
        const hm = new THREE.Mesh(heartGeo, new THREE.MeshStandardMaterial({ color: 0xec4899 }));
        hm.position.copy(mouthPos);
        headGroup.add(hm);
      } else if (mStyle === "tongue") {
        const smirkGeo = new THREE.CylinderGeometry(0.018, 0.018, 0.1, 8);
        const sm = new THREE.Mesh(smirkGeo, mouthMat);
        sm.position.copy(mouthPos);
        sm.rotation.z = Math.PI/2;
        headGroup.add(sm);

        // tiny tongue sphere
        const tongueGeo = new THREE.SphereGeometry(0.035, 8, 8);
        tongueGeo.scale(1, 0.5, 1.2);
        const tongue = new THREE.Mesh(tongueGeo, new THREE.MeshStandardMaterial({ color: 0xfb7185 }));
        tongue.position.copy(mouthPos).add(new THREE.Vector3(0, -0.02, 0.012));
        headGroup.add(tongue);
      } else if (mStyle === "vampire") {
        // smile plus 2 cones fangs
        const smileGeo = new THREE.TorusGeometry(0.08, 0.018, 8, 18, Math.PI);
        const smile = new THREE.Mesh(smileGeo, mouthMat);
        smile.position.copy(mouthPos);
        smile.rotation.set(0, 0, Math.PI);
        headGroup.add(smile);

        const fangGeo = new THREE.ConeGeometry(0.014, 0.038, 4);
        fangGeo.rotateX(Math.PI);
        const fangMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const fangL = new THREE.Mesh(fangGeo, fangMat);
        fangL.position.set(-0.04, -0.08, eyeDepth + 0.04);
        headGroup.add(fangL);

        const fangR = fangL.clone();
        fangR.position.x = 0.04;
        headGroup.add(fangR);
      } else if (mStyle === "pout") {
        const poutGeo = new THREE.TorusGeometry(0.08, 0.018, 8, 18, Math.PI);
        const pout = new THREE.Mesh(poutGeo, mouthMat);
        pout.position.copy(mouthPos).add(new THREE.Vector3(0, -0.04, 0));
        headGroup.add(pout); // sweep downwards
      } else if (mStyle === "drool") {
        const straightGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.1, 8);
        const sm = new THREE.Mesh(straightGeo, mouthMat);
        sm.position.copy(mouthPos);
        sm.rotation.z = Math.PI/2;
        headGroup.add(sm);

        // translucent blue drop
        const tearGeo = new THREE.SphereGeometry(0.03, 8, 8);
        tearGeo.scale(1, 1.8, 1);
        const tear = new THREE.Mesh(tearGeo, new THREE.MeshBasicMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.68 }));
        tear.position.copy(mouthPos).add(new THREE.Vector3(-0.03, -0.05, 0.01));
        headGroup.add(tear);
      } else if (mStyle === "chubby") {
        const ovalGeo = new THREE.SphereGeometry(0.046, 12, 12);
        const oval = new THREE.Mesh(ovalGeo, mouthMat);
        oval.position.copy(mouthPos);
        headGroup.add(oval);
      } else {
        // Neutral line
        const straightGeo = new THREE.CylinderGeometry(0.014, 0.014, 0.12, 12);
        const straight = new THREE.Mesh(straightGeo, mouthMat);
        straight.position.copy(mouthPos);
        straight.rotation.z = Math.PI / 2;
        headGroup.add(straight);
      }
    };
    renderMouthObj();

    // CHEEK BLUSH
    const blushGeo = new THREE.SphereGeometry(0.07, 12, 12);
    blushGeo.scale(1.4, 0.6, 0.2);
    const blushMat = new THREE.MeshBasicMaterial({
      color: 0xffa2a2,
      transparent: true,
      opacity: 0.44,
    });
    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-0.28, -0.04, eyeDepth * 0.98);
    leftBlush.rotation.set(0.1, 0.1, -0.02);
    headGroup.add(leftBlush);

    const rightBlush = leftBlush.clone();
    rightBlush.position.set(0.28, -0.04, eyeDepth * 0.98);
    rightBlush.rotation.set(0.1, -0.1, 0.02);
    headGroup.add(rightBlush);

    // DYNAMIC & EXQUISITE CUTE DETAILS (Cheek Decals & Hairpins)
    // 1. Cheek Star Sticker (Left cheek)
    const starStickerGeo = new THREE.ConeGeometry(0.038, 0.008, 5);
    const starStickerMat = new THREE.MeshStandardMaterial({ 
      color: 0xfacc15, 
      roughness: 0.15, 
      metalness: 0.6,
      emissive: 0xfacc15,
      emissiveIntensity: 0.15
    });
    const starSticker = new THREE.Mesh(starStickerGeo, starStickerMat);
    starSticker.position.set(-0.35, -0.09, eyeDepth * 0.94);
    starSticker.rotation.set(0.2, 0.2, 0.4);
    headGroup.add(starSticker);

    // 2. Cheek Cross Band-aid (Right cheek)
    const bandAidGroup = new THREE.Group();
    bandAidGroup.position.set(0.34, -0.09, eyeDepth * 0.92);
    bandAidGroup.rotation.set(0.12, -0.18, 0.35);
    const stripMat = new THREE.MeshStandardMaterial({ color: 0xfecdd3, roughness: 0.8 }); // sweet pastel pink strip
    const padMat = new THREE.MeshStandardMaterial({ color: 0xffe4e6, roughness: 0.8 }); // lighter middle sponge pad
    const strap1Geo = new THREE.BoxGeometry(0.092, 0.032, 0.016);
    const strap1 = new THREE.Mesh(strap1Geo, stripMat);
    strap1.rotation.z = -0.4;
    const strap2 = strap1.clone();
    strap2.rotation.z = 0.4;
    const padGeo = new THREE.BoxGeometry(0.032, 0.032, 0.018);
    const pad = new THREE.Mesh(padGeo, padMat);
    bandAidGroup.add(strap1);
    bandAidGroup.add(strap2);
    bandAidGroup.add(pad);
    headGroup.add(bandAidGroup);

    // G. HAIR MODELS (30 styles!)
    const hairStyle = avatar.hairStyle;
    if (hairStyle !== "bald") {
      // 3. Cute cross bar hair clips (on side of hair)
      const hairpinGroup = new THREE.Group();
      hairpinGroup.position.set(-0.48, 0.34, 0.46);
      hairpinGroup.rotation.set(0.2, 0.4, 0.5);
      
      const pinMat = new THREE.MeshStandardMaterial({ 
        color: 0xff4b91, 
        roughness: 0.3, 
        metalness: 0.2,
        emissive: 0xff4b91,
        emissiveIntensity: 0.1
      });
      const hClip1Geo = new THREE.BoxGeometry(0.14, 0.024, 0.015);
      const hClip1 = new THREE.Mesh(hClip1Geo, pinMat);
      hClip1.position.set(0, 0, 0);
      hClip1.rotation.z = 0.2;
      
      const hClip2 = hClip1.clone();
      hClip2.position.set(0, -0.04, 0);
      hClip2.rotation.z = -0.2;

      hairpinGroup.add(hClip1, hClip2);
      headGroup.add(hairpinGroup);

      // Core Scalp cap (finely tuned to clear forehead while fully covering the back of head)
      const hairCapGeo = new THREE.SphereGeometry(0.73, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.52);
      hairCapGeo.scale(1.015, 1.015, 1.015);
      const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
      hairCap.position.set(0, 0.035, -0.012);
      hairCap.rotation.x = -0.48; // sweep back further to perfectly clear the forehead/eyes area
      headGroup.add(hairCap);

      // Render custom elements based on selected hairstyle
      if (hairStyle === "short" || hairStyle === "sidesweep") {
        for (let i = -3; i <= 3; i++) {
          const hairClumpGeo = new THREE.SphereGeometry(0.13, 12, 12);
          const clump = new THREE.Mesh(hairClumpGeo, hairMat);
          const angle = (i * Math.PI) / 8;
          clump.position.set(Math.sin(angle) * 0.48, 0.54, Math.cos(angle) * 0.45 + 0.1);
          headGroup.add(clump);
        }
      } else if (hairStyle === "spiky" || hairStyle === "mohican") {
        const spikeGeo = new THREE.ConeGeometry(0.11, 0.28, 6);
        spikeGeo.translate(0, 0.14, 0);
        const spikeCount = 15;
        for (let i = 0; i < spikeCount; i++) {
          const spike = new THREE.Mesh(spikeGeo, hairMat);
          const phi = Math.acos(-1 + (2 * i) / spikeCount);
          const theta = Math.sqrt(spikeCount * Math.PI) * phi;
          if (phi < Math.PI * 0.48) {
            spike.position.set(
              Math.sin(phi) * Math.cos(theta) * 0.72,
              0.04 + Math.cos(phi) * 0.72,
              Math.sin(phi) * Math.sin(theta) * 0.72
            );
            spike.lookAt(new THREE.Vector3(0, 0, 0));
            spike.rotation.x += Math.PI / 2;
            headGroup.add(spike);
          }
        }
      } else if (hairStyle === "curly" || hairStyle === "afro") {
        const curlGeo = new THREE.SphereGeometry(0.16, 12, 12);
        const curlCount = 20;
        for (let i = 0; i < curlCount; i++) {
          const curl = new THREE.Mesh(curlGeo, hairMat);
          const theta = Math.random() * 2 * Math.PI;
          const phi = Math.PI * 0.18 + Math.random() * Math.PI * 0.35;
          curl.position.set(
            Math.sin(phi) * Math.cos(theta) * 0.69,
            0.05 + Math.cos(phi) * 0.69,
            Math.sin(phi) * Math.sin(theta) * 0.69
          );
          headGroup.add(curl);
        }
      } else if (hairStyle === "bob" || hairStyle === "hime") {
        const bobPanelGeo = new THREE.CapsuleGeometry(0.12, 0.36, 8, 12);
        const bobL = new THREE.Mesh(bobPanelGeo, hairMat);
        bobL.position.set(-0.72, -0.16, 0.08);
        bobL.rotation.set(0.1, 0, 0.16);
        headGroup.add(bobL);

        const bobR = bobL.clone();
        bobR.position.set(0.72, -0.16, 0.08);
        bobR.rotation.set(0.1, 0, -0.16);
        headGroup.add(bobR);
      } else if (hairStyle === "long" || hairStyle === "witch") {
        const lockGeo = new THREE.CapsuleGeometry(0.12, 0.8, 8, 12);
        const lockL = new THREE.Mesh(lockGeo, hairMat);
        lockL.position.set(-0.64, -0.32, -0.12);
        lockL.rotation.set(0.1, 0, 0.06);
        headGroup.add(lockL);

        const lockR = lockL.clone();
        lockR.position.set(0.64, -0.32, -0.12);
        lockR.rotation.set(0.1, 0, -0.06);
        headGroup.add(lockR);

        const backCurtainGeo = new THREE.SphereGeometry(0.76, 20, 16);
        backCurtainGeo.scale(1, 1.4, 0.6);
        const backCurtain = new THREE.Mesh(backCurtainGeo, hairMat);
        backCurtain.position.set(0, -0.15, -0.3);
        headGroup.add(backCurtain);
      } else if (hairStyle === "ponytail") {
        const tieGeo = new THREE.TorusGeometry(0.08, 0.03, 8, 16);
        const tieMat = new THREE.MeshStandardMaterial({ color: 0xdb2777 });
        const tie = new THREE.Mesh(tieGeo, tieMat);
        tie.position.set(0, 0.34, -0.72);
        tie.rotation.x = Math.PI / 4;
        headGroup.add(tie);

        const ponyGeo = new THREE.ConeGeometry(0.16, 0.72, 12);
        ponyGeo.translate(0, -0.3, 0);
        const ponytail = new THREE.Mesh(ponyGeo, hairMat);
        ponytail.position.set(0, 0.3, -0.76);
        ponytail.rotation.set(-0.4, 0, 0);
        headGroup.add(ponytail);
      } else if (hairStyle === "twintail" || hairStyle === "twintail_braid") {
        const tieGeo = new THREE.TorusGeometry(0.06, 0.024, 6, 12);
        const tieMat = new THREE.MeshStandardMaterial({ color: 0x22c55e });
        
        const tieL = new THREE.Mesh(tieGeo, tieMat);
        tieL.position.set(-0.66, 0.22, -0.5);
        tieL.rotation.y = Math.PI / 3;
        headGroup.add(tieL);

        const tieR = tieL.clone();
        tieR.position.x = 0.66;
        tieR.rotation.y = -Math.PI / 3;
        headGroup.add(tieR);

        const tailGeo = new THREE.CapsuleGeometry(0.11, 0.44, 8, 12);
        const tailL = new THREE.Mesh(tailGeo, hairMat);
        tailL.position.set(-0.76, -0.1, -0.56);
        tailL.rotation.set(0.15, 0, 0.22);
        headGroup.add(tailL);

        const tailR = tailL.clone();
        tailR.position.x = 0.76;
        tailR.rotation.z = -0.22;
        headGroup.add(tailR);
      } else if (hairStyle === "spacebuns") {
        const bunGeo = new THREE.SphereGeometry(0.25, 14, 14);
        const bunL = new THREE.Mesh(bunGeo, hairMat);
        bunL.position.set(-0.55, 0.62, -0.3);
        headGroup.add(bunL);

        const bunR = bunL.clone();
        bunR.position.x = 0.55;
        headGroup.add(bunR);
      } else {
        // Fallback default messy tufted crop
        for (let i = -1; i <= 1; i++) {
          const clumpGeo = new THREE.SphereGeometry(0.16, 12, 12);
          const spr = new THREE.Mesh(clumpGeo, hairMat);
          spr.position.set(i * 0.28, 0.58, 0.2);
          headGroup.add(spr);
        }
      }
    }

    // FACIAL HAIR
    if (avatar.gender === "male" && avatar.facialHair !== "none") {
      const fHairMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(avatar.hairColor),
        roughness: 0.9,
      });

      if (avatar.facialHair === "beard") {
        const beardGeo = new THREE.SphereGeometry(0.74, 18, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
        beardGeo.scale(1.02, 0.8, 1.02);
        const beard = new THREE.Mesh(beardGeo, fHairMat);
        beard.position.set(0, -0.01, -0.01);
        headGroup.add(beard);
      } else if (avatar.facialHair === "mustache") {
        const mustGeo = new THREE.SphereGeometry(0.042, 10, 10);
        mustGeo.scale(2.2, 0.7, 0.8);
        const mustache = new THREE.Mesh(mustGeo, fHairMat);
        mustache.position.set(0, -0.03, eyeDepth + 0.05);
        headGroup.add(mustache);
      }
    }

    // H. ACCESSORIES (30 styles!)
    const rAcc = avatar.accessory;
    if (rAcc !== "none") {
      const accGroup = new THREE.Group();
      headGroup.add(accGroup);

      if (rAcc === "classic_specs" || rAcc === "round_specs" || rAcc === "sunglasses" || rAcc === "star_specs") {
        const rColor = rAcc === "sunglasses" ? 0x111111 : 0xffa400;
        const frameMat = new THREE.MeshStandardMaterial({
          color: rColor,
          roughness: 0.2,
          metalness: 0.8,
        });

        const framePosL = new THREE.Vector3(-0.21, 0.1, 0.65);
        const framePosR = new THREE.Vector3(0.21, 0.1, 0.65);

        let shapeGeo = new THREE.TorusGeometry(0.12, 0.018, 8, 18);
        
        if (rAcc === "classic_specs") {
          shapeGeo = new THREE.TorusGeometry(0.12, 0.018, 4, 14) as any; // square-ish
        } else if (rAcc === "star_specs") {
          shapeGeo = new THREE.ConeGeometry(0.13, 0.02, 5) as any;
          shapeGeo.rotateX(Math.PI / 2);
        }

        const lensL = new THREE.Mesh(shapeGeo, frameMat);
        lensL.position.copy(framePosL);
        accGroup.add(lensL);

        const lensR = new THREE.Mesh(shapeGeo, frameMat);
        lensR.position.copy(framePosR);
        accGroup.add(lensR);

        // Center link bar cylinder
        const barGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.14, 8);
        const bar = new THREE.Mesh(barGeo, frameMat);
        bar.position.set(0, 0.11, 0.65);
        bar.rotation.z = Math.PI / 2;
        accGroup.add(bar);

        if (rAcc === "sunglasses") {
          // Transparent plastic glass lenses
          const glassGeo = new THREE.SphereGeometry(0.11, 12, 12);
          glassGeo.scale(1, 1, 0.1);
          const glassMat = new THREE.MeshStandardMaterial({ color: 0x111111, transparent: true, opacity: 0.9, roughness: 0.1 });
          
          const glassL = new THREE.Mesh(glassGeo, glassMat);
          glassL.position.copy(framePosL);
          accGroup.add(glassL);

          const glassR = glassL.clone();
          glassR.position.copy(framePosR);
          accGroup.add(glassR);
        }
      } else if (rAcc === "visor") {
        // Glowing hot pink futuristic neon visor strip
        const visorGeo = new THREE.CylinderGeometry(0.75, 0.75, 0.20, 24, 1, true, -Math.PI / 2.6, Math.PI * 0.77);
        const visorMat = new THREE.MeshBasicMaterial({
          color: 0x06b6d4,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
        });
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 0.12, 0.02);
        visor.rotation.set(0.1, 0, 0);
        accGroup.add(visor);
      } else if (rAcc === "cap" || rAcc === "chef_hat" || rAcc === "witch_hat") {
        const topMat = rAcc === "cap" ? bodyMat : (rAcc === "chef_hat" ? eyesWhiteMat : new THREE.MeshStandardMaterial({ color: 0x582f8c }));
        
        if (rAcc === "cap") {
          const capDomeGeo = new THREE.SphereGeometry(0.76, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.52);
          const capDome = new THREE.Mesh(capDomeGeo, topMat);
          capDome.position.set(0, 0.12, -0.04);
          capDome.rotation.x = -0.3;
          accGroup.add(capDome);

          // bill brim visor
          const billGeo = new THREE.BoxGeometry(0.5, 0.02, 0.44);
          const bill = new THREE.Mesh(billGeo, topMat);
          bill.position.set(0, 0.38, 0.74);
          bill.rotation.x = 0.12;
          accGroup.add(bill);
        } else if (rAcc === "chef_hat") {
          const puffGeo = new THREE.CylinderGeometry(0.48, 0.4, 0.52, 16);
          const puff = new THREE.Mesh(puffGeo, topMat);
          puff.position.set(0, 0.84, -0.15);
          accGroup.add(puff);

          const baseGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.18, 16);
          const base = new THREE.Mesh(baseGeo, topMat);
          base.position.set(0, 0.55, -0.13);
          accGroup.add(base);
        } else if (rAcc === "witch_hat") {
          const brimGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.02, 24);
          const brim = new THREE.Mesh(brimGeo, topMat);
          brim.position.set(0, 0.5, -0.1);
          brim.rotation.x = 0.1;
          accGroup.add(brim);

          const coneGeo = new THREE.ConeGeometry(0.44, 0.9, 14);
          const cone = new THREE.Mesh(coneGeo, topMat);
          cone.position.set(0, 0.92, -0.22);
          cone.rotation.x = -0.15;
          accGroup.add(cone);
        }
      } else if (rAcc === "beanie") {
        const beanieGeo = new THREE.SphereGeometry(0.78, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.65);
        const beanie = new THREE.Mesh(beanieGeo, new THREE.MeshStandardMaterial({ color: 0x3b82f6, roughness: 0.95 }));
        beanie.position.set(0, 0.11, -0.05);
        beanie.rotation.x = -0.35;
        accGroup.add(beanie);
      } else if (rAcc === "crown") {
        const goldMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.1 });
        const crownBaseGeo = new THREE.CylinderGeometry(0.36, 0.36, 0.12, 16, 1, true);
        const base = new THREE.Mesh(crownBaseGeo, goldMat);
        base.position.set(0, 0.72, -0.1);
        accGroup.add(base);

        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI * 2) / 6;
          const spikeGeo = new THREE.ConeGeometry(0.04, 0.14, 4);
          const spike = new THREE.Mesh(spikeGeo, goldMat);
          spike.position.set(Math.sin(angle) * 0.36, 0.84, Math.cos(angle) * 0.36 - 0.1);
          accGroup.add(spike);
        }
      } else if (rAcc === "headphones") {
        const hpMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.4 });
        const padMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
        
        const earCupGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.08, 16);
        earCupGeo.rotateZ(Math.PI / 2);
        
        const padGeo = new THREE.CylinderGeometry(0.19, 0.19, 0.04, 16);
        padGeo.rotateZ(Math.PI / 2);

        // Left Cup & Pad
        const cupL = new THREE.Mesh(earCupGeo, hpMat);
        cupL.position.set(-0.76, 0.0, -0.04);
        accGroup.add(cupL);

        const padL = new THREE.Mesh(padGeo, padMat);
        padL.position.set(-0.71, 0.0, -0.04);
        accGroup.add(padL);

        // Right Cup & Pad
        const cupR = cupL.clone();
        cupR.position.x = 0.76;
        accGroup.add(cupR);

        const padR = padL.clone();
        padR.position.set(0.71, 0.0, -0.04);
        accGroup.add(padR);

        // Band starts at y = 0.0 to perfectly merge with the ear cups on the head
        const bandGeo = new THREE.TorusGeometry(0.76, 0.024, 8, 24, Math.PI);
        const band = new THREE.Mesh(bandGeo, hpMat);
        band.position.set(0, 0.0, -0.04);
        accGroup.add(band);
      } else if (rAcc === "halo") {
        const haloGeo = new THREE.TorusGeometry(0.44, 0.022, 8, 24);
        const haloMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.position.set(0, 1.0, -0.15);
        halo.rotation.x = Math.PI / 2;
        accGroup.add(halo);
      } else if (rAcc === "flower_crown") {
        const ringGeo = new THREE.TorusGeometry(0.54, 0.02, 8, 24);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x16a34a });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(0, 0.54, -0.05);
        ring.rotation.x = Math.PI / 2.2;
        accGroup.add(ring);

        // Add 5 pink flower spheres
        for (let i = 0; i < 5; i++) {
          const angle = (i * Math.PI) / 4;
          const flGeo = new THREE.SphereGeometry(0.06, 8, 8);
          const flMat = new THREE.MeshStandardMaterial({ color: 0xfb7185 });
          const fl = new THREE.Mesh(flGeo, flMat);
          fl.position.set(Math.sin(angle) * 0.52, 0.58, Math.cos(angle) * 0.52);
          accGroup.add(fl);
        }
      }
    }

    // I. TORSO / CLOTHING (위옷 - 30 styles!)
    // Capsule torso base representing standard high-end vinyl toy aesthetic (0.58 width)
    const torsoGeo = new THREE.CapsuleGeometry(0.24, 0.55, 12, 18);
    // Move the geometries central origin snug on pivot hips
    torsoGeo.translate(0, -0.27, 0);

    const torsoMesh = new THREE.Mesh(torsoGeo, bodyMat);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    torsoMesh.position.set(0, 0.0, 0);
    avatarGroup.add(torsoMesh);

    // Collar ring decoration on shirt neck
    const collarTone = avatar.clothingType === "suit" ? 0xffffff : bodyMat.color.getHex();
    const collarGeo = new THREE.TorusGeometry(0.18, 0.024, 8, 24);
    collarGeo.scale(1.1, 0.6, 1.0);
    const collar = new THREE.Mesh(collarGeo, new THREE.MeshStandardMaterial({ color: collarTone }));
    collar.position.set(0, 0.0, 0);
    collar.rotation.x = Math.PI / 2;
    avatarGroup.add(collar);

    // Torso custom clothing parts decorator (옷이 반영이 안돼 - 30 styles details!)
    const cStyle = avatar.clothingType;
    if (cStyle === "suit") {
      // Red Necktie hanging
      const tieGeo = new THREE.ConeGeometry(0.04, 0.25, 4);
      tieGeo.translate(0, -0.12, 0);
      const tie = new THREE.Mesh(tieGeo, new THREE.MeshStandardMaterial({ color: 0xbe123c, roughness: 0.5 }));
      tie.position.set(0, -0.04, 0.22);
      tie.rotation.set(0.1, 0, 0);
      avatarGroup.add(tie);
    } else if (cStyle === "hoodie") {
      // Large cowl neck tube Around chin
      const hoodGeo = new THREE.TorusGeometry(0.22, 0.06, 8, 20);
      const hood = new THREE.Mesh(hoodGeo, bodyMat);
      hood.position.set(0, -0.02, 0.02);
      hood.rotation.x = Math.PI / 2.2;
      avatarGroup.add(hood);

      // Cute white cords hanging!
      const cordGeo = new THREE.CapsuleGeometry(0.008, 0.15, 4, 8);
      const cordMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
      const cordL = new THREE.Mesh(cordGeo, cordMat);
      cordL.position.set(-0.06, -0.15, 0.22);
      cordL.rotation.set(0.1, 0, 0.05);
      const cordR = cordL.clone();
      cordR.position.x = 0.06;
      avatarGroup.add(cordL, cordR);
    } else if (cStyle === "police") {
      // Gold chest emblem badges
      const badgeGeo = new THREE.ConeGeometry(0.035, 0.01, 5);
      badgeGeo.rotateX(Math.PI / 2);
      const badge = new THREE.Mesh(badgeGeo, new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.9, roughness: 0.1 }));
      badge.position.set(-0.11, -0.16, 0.20);
      avatarGroup.add(badge);
    } else if (cStyle === "dragon_robe") {
      // Imperial gold chest round circle dragon seal
      const circleGeo = new THREE.CylinderGeometry(0.09, 0.09, 0.01, 16);
      circleGeo.rotateX(Math.PI / 2);
      const seal = new THREE.Mesh(circleGeo, new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.8, roughness: 0.2 }));
      seal.position.set(0, -0.2, 0.21);
      avatarGroup.add(seal);
    } else if (cStyle === "mummy") {
      // Mummy overlapping plates wrapping around
      for (let i = 0; i < 4; i++) {
        const wrapGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.08, 12);
        const wMesh = new THREE.Mesh(wrapGeo, eyesWhiteMat);
        wMesh.position.set(0, -0.12 - i * 0.11, 0);
        wMesh.rotation.y = i * 0.4;
        avatarGroup.add(wMesh);
      }
    } else if (cStyle === "shirt" || cStyle === "pajama") {
      // Cute buttons down the front
      for (let i = 0; i < 3; i++) {
        const btnGeo = new THREE.SphereGeometry(0.015, 8, 8);
        const btn = new THREE.Mesh(btnGeo, new THREE.MeshBasicMaterial({ color: cStyle === "pajama" ? 0xfecdd3 : 0xffffff }));
        btn.position.set(0, -0.12 - i * 0.12, 0.23);
        avatarGroup.add(btn);
      }
      // Small chest pocket
      const pocketGeo = new THREE.BoxGeometry(0.05, 0.05, 0.01);
      const pocket = new THREE.Mesh(pocketGeo, bodyMat);
      pocket.position.set(0.09, -0.14, 0.21);
      avatarGroup.add(pocket);
    } else if (cStyle === "sweater") {
      // Cable knit textures modeled with vertical capsules!
      for (let i = 0; i < 2; i++) {
        const cableGeo = new THREE.CapsuleGeometry(0.018, 0.35, 4, 8);
        const cable = new THREE.Mesh(cableGeo, bodyMat);
        cable.position.set(i === 0 ? -0.06 : 0.06, -0.25, 0.20);
        avatarGroup.add(cable);
      }
    } else if (cStyle === "sailor") {
      // Large sailor white back flap collar and front bow knot!
      const flapGeo = new THREE.BoxGeometry(0.44, 0.08, 0.18);
      flapGeo.translate(0, 0, -0.06);
      const flapMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
      const flap = new THREE.Mesh(flapGeo, flapMat);
      flap.position.set(0, -0.05, 0);
      flap.rotation.x = 0.15;
      avatarGroup.add(flap);

      // Red bow scarf knot
      const scarfGeo = new THREE.SphereGeometry(0.035, 8, 8);
      scarfGeo.scale(1.6, 1.0, 1.0);
      const redScarf = new THREE.Mesh(scarfGeo, new THREE.MeshStandardMaterial({ color: 0xd946ef, roughness: 0.7 })); // bright sweet pink/magenta scarf
      redScarf.position.set(0, -0.08, 0.21);
      avatarGroup.add(redScarf);
    } else if (cStyle === "hanbok") {
      // Diagonal white neckline trim (깃)
      const gitGeo = new THREE.TorusGeometry(0.18, 0.02, 6, 16, Math.PI * 0.8);
      const git = new THREE.Mesh(gitGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
      git.position.set(0, -0.04, 0.16);
      git.rotation.set(Math.PI / 2.3, 0.15, 0.4);
      avatarGroup.add(git);

      // Beautiful long dynamic ribbon bow (고름)
      const bowGeo = new THREE.BoxGeometry(0.032, 0.25, 0.012);
      bowGeo.translate(0, -0.11, 0);
      const ribbon = new THREE.Mesh(bowGeo, new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.8 }));
      ribbon.position.set(0.05, -0.08, 0.21);
      ribbon.rotation.set(0.1, 0.1, -0.15);
      avatarGroup.add(ribbon);
    } else if (cStyle === "chef") {
      // Red neck scarf
      const scarfGeo = new THREE.TorusGeometry(0.18, 0.032, 6, 20);
      const scarf = new THREE.Mesh(scarfGeo, new THREE.MeshStandardMaterial({ color: 0xe11d48, roughness: 0.8 }));
      scarf.position.set(0, 0.0, 0);
      scarf.rotation.x = Math.PI / 2;
      avatarGroup.add(scarf);

      // Double breasted buttons (6 golden balls!)
      const btnGeo = new THREE.SphereGeometry(0.016, 8, 8);
      const btnMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
      for (let i = 0; i < 3; i++) {
        const bL = new THREE.Mesh(btnGeo, btnMat);
        bL.position.set(-0.06, -0.14 - i * 0.12, 0.21);
        const bR = bL.clone();
        bR.position.x = 0.06;
        avatarGroup.add(bL, bR);
      }
    } else if (cStyle === "detective") {
      // Classic belt buckle line across torso waist
      const beltGeo = new THREE.TorusGeometry(0.245, 0.026, 6, 24);
      const belt = new THREE.Mesh(beltGeo, new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8 })); // dark leather belt
      belt.position.set(0, -0.46, 0);
      belt.rotation.x = Math.PI / 2;
      avatarGroup.add(belt);

      const goldBGeo = new THREE.BoxGeometry(0.06, 0.046, 0.012);
      const goldB = new THREE.Mesh(goldBGeo, new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.8, roughness: 0.1 }));
      goldB.position.set(0, -0.46, 0.24);
      avatarGroup.add(goldB);
    } else if (cStyle === "bomber" || cStyle === "jersey") {
      // Front zipper line
      const zipGeo = new THREE.BoxGeometry(0.01, 0.44, 0.01);
      const zipMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.1 });
      const zipper = new THREE.Mesh(zipGeo, zipMat);
      zipper.position.set(0, -0.22, 0.225);
      avatarGroup.add(zipper);
    } else if (cStyle === "overalls") {
      // Denim vertical suspender straps
      const strapGeo = new THREE.BoxGeometry(0.038, 0.52, 0.025);
      const strapMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.72 }); // classic indigo pocket denim
      const strapL = new THREE.Mesh(strapGeo, strapMat);
      strapL.position.set(-0.11, -0.24, 0.185);
      strapL.rotation.set(0.08, 0, 0.1);
      const strapR = strapL.clone();
      strapR.position.x = 0.11;
      strapR.rotation.z = -0.1;

      // Small brass clip button on overalls
      const btnGeo = new THREE.SphereGeometry(0.018, 8, 8);
      const btnMat = new THREE.MeshStandardMaterial({ color: 0xeab308, metalness: 0.8 });
      const pinL = new THREE.Mesh(btnGeo, btnMat);
      pinL.position.set(-0.10, -0.16, 0.21);
      const pinR = pinL.clone();
      pinR.position.x = 0.10;

      avatarGroup.add(strapL, strapR, pinL, pinR);
    } else if (cStyle === "spacesuit") {
      // High-tech NASA command controls box on breast
      const packGeo = new THREE.BoxGeometry(0.12, 0.08, 0.05);
      const packMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6 });
      const pack = new THREE.Mesh(packGeo, packMat);
      pack.position.set(0, -0.18, 0.21);
      avatarGroup.add(pack);

      const light1 = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
      light1.position.set(-0.03, -0.18, 0.24);
      const light2 = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 6), new THREE.MeshBasicMaterial({ color: 0x22c55e }));
      light2.position.set(0.03, -0.18, 0.24);
      avatarGroup.add(light1, light2);
    } else if (cStyle === "raincoat") {
      // Elegant retro coat toggle buttons
      const togGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.06, 6);
      togGeo.rotateZ(Math.PI / 2);
      const togMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8 });
      for (let i = 0; i < 2; i++) {
        const tog = new THREE.Mesh(togGeo, togMat);
        tog.position.set(0, -0.15 - i * 0.14, 0.22);
        avatarGroup.add(tog);
      }
    } else if (cStyle === "leather") {
      // Silver metallic punk spikes on shoulders!
      const coneGeo = new THREE.ConeGeometry(0.024, 0.05, 6);
      coneGeo.translate(0, 0.025, 0);
      const spikeMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.9, roughness: 0.1 });
      for (let i = 0; i < 3; i++) {
        const spikeL = new THREE.Mesh(coneGeo, spikeMat);
        spikeL.position.set(-0.25, -0.06, -0.08 + i * 0.08);
        spikeL.rotation.z = -0.5;
        const spikeR = spikeL.clone();
        spikeR.position.x = 0.25;
        spikeR.rotation.z = 0.5;
        avatarGroup.add(spikeL, spikeR);
      }
    } else if (cStyle === "suspenders") {
      // Leather suspenders running down torso
      const strapGeo = new THREE.BoxGeometry(0.028, 0.52, 0.02);
      const suspMat = new THREE.MeshStandardMaterial({ color: 0x3f2a1d, roughness: 0.85 }); // classic leather dark brown
      const suspL = new THREE.Mesh(strapGeo, suspMat);
      suspL.position.set(-0.11, -0.24, 0.185);
      const suspR = suspL.clone();
      suspR.position.x = 0.11;
      avatarGroup.add(suspL, suspR);
    } else if (cStyle === "vampire") {
      // Vampire tall folded standing cloak collar behind the ears
      const collarPlGeo = new THREE.BoxGeometry(0.48, 0.32, 0.035);
      const collarPl = new THREE.Mesh(collarPlGeo, new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.4 })); // bloody velvet red inside
      collarPl.position.set(0, 0.08, -0.18);
      collarPl.rotation.x = -0.25;
      avatarGroup.add(collarPl);
    } else if (cStyle === "baseball") {
      // Athletic letter 'C' (Cute!) emblem stitched on upper breast
      const logoCGeo = new THREE.TorusGeometry(0.046, 0.015, 6, 12, Math.PI * 1.5);
      const logoC = new THREE.Mesh(logoCGeo, new THREE.MeshBasicMaterial({ color: 0xfbcfe8 })); // sweet pink letter C
      logoC.position.set(-0.10, -0.15, 0.21);
      logoC.rotation.z = Math.PI / 4;
      avatarGroup.add(logoC);
    } else if (cStyle === "padding") {
      // Horizontal puffy nested rings!
      for (let i = 0; i < 3; i++) {
        const ringGeo = new THREE.TorusGeometry(0.245, 0.05, 8, 20);
        ringGeo.scale(1.02, 0.6, 1.02);
        const ring = new THREE.Mesh(ringGeo, bodyMat);
        ring.position.set(0, -0.14 - i * 0.13, 0);
        ring.rotation.x = Math.PI / 2;
        avatarGroup.add(ring);
      }
    } else if (cStyle === "maid") {
      // Beautiful white retro lace ruffled apron overlay on front torso!
      const apronGeo = new THREE.BoxGeometry(0.22, 0.26, 0.012);
      const apronMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
      const apron = new THREE.Mesh(apronGeo, apronMat);
      apron.position.set(0, -0.32, 0.20);
      avatarGroup.add(apron);

      // Frill frills along apron sides
      const frillGeo = new THREE.SphereGeometry(0.024, 8, 8);
      for (let i = 0; i < 4; i++) {
        const fL = new THREE.Mesh(frillGeo, apronMat);
        fL.position.set(-0.12, -0.22 - i * 0.06, 0.215);
        const fR = fL.clone();
        fR.position.x = 0.12;
        avatarGroup.add(fL, fR);
      }
    } else if (cStyle === "santa") {
      // White fluffy trim ring at the neck and front buttons
      const neckTrimGeo = new THREE.TorusGeometry(0.18, 0.04, 8, 24);
      neckTrimGeo.scale(1.1, 0.5, 1.0);
      const whiteTrim = new THREE.Mesh(neckTrimGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }));
      whiteTrim.position.set(0, 0.0, 0);
      whiteTrim.rotation.x = Math.PI / 2;
      avatarGroup.add(whiteTrim);

      // Fluffy cotton ball button
      const puffGeo = new THREE.SphereGeometry(0.028, 8, 8);
      const puffL = new THREE.Mesh(puffGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95 }));
      puffL.position.set(0, -0.16, 0.22);
      const puffR = puffL.clone();
      puffR.position.y = -0.32;
      avatarGroup.add(puffL, puffR);
    } else if (cStyle === "croptop") {
      // Skin-colored lower slice of the torso to simulate a belly with belly button!
      const skinSliceGeo = new THREE.CylinderGeometry(0.232, 0.24, 0.16, 16);
      skinSliceGeo.translate(0, -0.08, 0);
      const skinSlice = new THREE.Mesh(skinSliceGeo, skinMat);
      skinSlice.position.set(0, -0.43, 0); // located at the waist/abdomen region
      avatarGroup.add(skinSlice);
    }

    // J. HANDS & ARMS (We maintain the hand model and support clothes cuff textures)
    // Support sleeveless and cropped skin tone arms
    const isSleeveless = ["sleeveless", "croptop", "hawaiian", "suspenders", "swimsuit"].includes(cStyle);
    const armMatToUse = isSleeveless ? skinMat : bodyMat;

    // Flared comfortable arm angles
    const armGeo = new THREE.CapsuleGeometry(0.07, 0.22, 8, 12);
    armGeo.translate(0, -0.11, 0); // anchor at shoulder hinge

    // Left Arm mesh (Snug at body side - resolving "팔이 얼굴이 아니라 몸에 붙게")
    const leftArm = new THREE.Mesh(armGeo, armMatToUse);
    leftArm.name = "leftArm";
    leftArm.castShadow = true;
    leftArm.receiveShadow = true;
    leftArm.position.set(-0.29, -0.15, 0);
    avatarGroup.add(leftArm);
    leftArmRef.current = leftArm;

    if (isSleeveless && cStyle !== "swimsuit") {
      const cuffGeo = new THREE.CylinderGeometry(0.076, 0.076, 0.04, 12);
      const cuff = new THREE.Mesh(cuffGeo, bodyMat);
      cuff.position.set(0, -0.02, 0);
      leftArm.add(cuff);
    }

    // Build Left Hand with 5 fingers
    const buildChibiHand = (side: "left" | "right") => {
      const handGroup = new THREE.Group();
      handGroup.name = `${side}Hand`;
      
      // Palm sphere
      const palmGeo = new THREE.SphereGeometry(0.065, 12, 12);
      const palmMesh = new THREE.Mesh(palmGeo, skinMat);
      palmMesh.castShadow = true;
      palmMesh.receiveShadow = true;
      handGroup.add(palmMesh);

      const fingers: THREE.Mesh[] = [];
      // Rounded stubby finger capsules
      const fingerGeo = new THREE.CapsuleGeometry(0.016, 0.05, 4, 8);
      fingerGeo.translate(0, -0.025, 0); // pivot at finger base

      // Create 5 fingers
      for (let i = 0; i < 5; i++) {
        const finger = new THREE.Mesh(fingerGeo, skinMat);
        finger.name = `finger_${i}`;
        finger.castShadow = true;
        finger.receiveShadow = true;
        handGroup.add(finger);
        fingers.push(finger);
      }

      const isLeft = side === "left";
      const thumbSign = isLeft ? 1 : -1;

      // Position the fingers naturally
      // finger_0 = Thumb, finger_1 = Index, finger_2 = Middle, finger_3 = Ring, finger_4 = Pinky
      
      // Thumb
      fingers[0].position.set(0.042 * thumbSign, -0.01, 0.02);
      fingers[0].rotation.set(0.2, 0, -0.6 * thumbSign);

      // Index
      fingers[1].position.set(0.025 * thumbSign, -0.05, 0.02);
      fingers[1].rotation.set(0.1, 0, -0.15 * thumbSign);

      // Middle
      fingers[2].position.set(0, -0.058, 0.015);
      fingers[2].rotation.set(0.1, 0, 0);

      // Ring
      fingers[3].position.set(-0.025 * thumbSign, -0.05, 0.01);
      fingers[3].rotation.set(0.1, 0, 0.15 * thumbSign);

      // Pinky
      fingers[4].position.set(-0.044 * thumbSign, -0.04, 0.005);
      fingers[4].rotation.set(0.1, 0, 0.3 * thumbSign);
      fingers[4].scale.set(0.85, 0.8, 0.85);

      return { handGroup, fingers };
    };

    const leftHandData = buildChibiHand("left");
    leftHandData.handGroup.position.set(0, -0.24, 0);
    leftArm.add(leftHandData.handGroup);
    leftFingersRef.current = leftHandData.fingers;

    // Right Arm mesh
    const rightArm = new THREE.Mesh(armGeo, armMatToUse);
    rightArm.name = "rightArm";
    rightArm.castShadow = true;
    rightArm.receiveShadow = true;
    rightArm.position.set(0.29, -0.15, 0);
    avatarGroup.add(rightArm);
    rightArmRef.current = rightArm;

    if (isSleeveless && cStyle !== "swimsuit") {
      const cuffGeo = new THREE.CylinderGeometry(0.076, 0.076, 0.04, 12);
      const cuff = new THREE.Mesh(cuffGeo, bodyMat);
      cuff.position.set(0, -0.02, 0);
      rightArm.add(cuff);
    }

    const rightHandData = buildChibiHand("right");
    rightHandData.handGroup.position.set(0, -0.24, 0);
    rightArm.add(rightHandData.handGroup);
    rightFingersRef.current = rightHandData.fingers;

    // K. LEGS & SHIRTS/SKIRTS BOTTOMS (다리도 만들어주고, 아래옷 30개!)
    // Let's make the legs much longer! (Using outer legLength = 0.82)
    const bStyle = avatar.bottomType;
    const isSkirt = bStyle.includes("skirt") || bStyle === "hanbok_skirt" || bStyle === "ruffle_skirt";
    const isShorts = bStyle === "shorts" || bStyle === "hawaiian_shorts" || bStyle === "gym_shorts" || bStyle === "swimsuit";

    // Dynamic material selection for the legs
    // Leg mesh splits into upper (clothing) and lower (skin/socks) depending on bottoms type (하의도 고르게!)
    const createCustomLegMesh = (side: "left" | "right") => {
      const legGroup = new THREE.Group();

      if (isSkirt) {
        // Skirt - she wears cute skin-colored thighs + stylish white knee socks!
        // Upper thigh (Skin): Capsule
        const thighGeo = new THREE.CapsuleGeometry(0.082, legLength * 0.5, 8, 12);
        thighGeo.translate(0, -legLength * 0.25, 0);
        const thighMesh = new THREE.Mesh(thighGeo, skinMat);
        thighMesh.castShadow = true;
        thighMesh.receiveShadow = true;
        legGroup.add(thighMesh);

        // Lower calf (Socks): Capsule
        const sockGeo = new THREE.CapsuleGeometry(0.086, legLength * 0.5, 8, 12);
        sockGeo.translate(0, -legLength * 0.75, 0);
        const sockMat = new THREE.MeshStandardMaterial({ color: 0xf3f4f6, roughness: 0.9 });
        const sockMesh = new THREE.Mesh(sockGeo, sockMat);
        sockMesh.castShadow = true;
        sockMesh.receiveShadow = true;
        legGroup.add(sockMesh);

        // Cute colored ribbon stripe at the sock rim
        const stripeGeo = new THREE.TorusGeometry(0.09, 0.015, 6, 12);
        stripeGeo.scale(1.0, 0.5, 1.0);
        const stripe = new THREE.Mesh(stripeGeo, bottomMat);
        stripe.position.set(0, -legLength * 0.58, 0);
        stripe.rotation.x = Math.PI / 2;
        legGroup.add(stripe);

      } else if (isShorts) {
        // Shorts - upper portion is trouser color, lower is bare skin!
        const thighGeo = new THREE.CapsuleGeometry(0.086, legLength * 0.45, 8, 12);
        thighGeo.translate(0, -legLength * 0.22, 0);
        const thighMesh = new THREE.Mesh(thighGeo, bottomMat);
        thighMesh.castShadow = true;
        thighMesh.receiveShadow = true;
        legGroup.add(thighMesh);

        const calfGeo = new THREE.CapsuleGeometry(0.080, legLength * 0.55, 8, 12);
        calfGeo.translate(0, -legLength * 0.725, 0);
        const calfMesh = new THREE.Mesh(calfGeo, skinMat);
        calfMesh.castShadow = true;
        calfMesh.receiveShadow = true;
        legGroup.add(calfMesh);

      } else {
        // Long pants (default) - entire leg is bottom color!
        const pantsGeo = new THREE.CapsuleGeometry(0.086, legLength, 10, 12);
        pantsGeo.translate(0, -legLength / 2, 0);
        const pantsMesh = new THREE.Mesh(pantsGeo, bottomMat);
        pantsMesh.castShadow = true;
        pantsMesh.receiveShadow = true;
        legGroup.add(pantsMesh);

        // EXTRA DETAILS for specific long pants types:
        if (bStyle === "jeans" || bStyle === "overalls_denim") {
          // Folded denim cuffs at the ankles!
          const cuffGeo = new THREE.TorusGeometry(0.092, 0.02, 6, 16);
          cuffGeo.scale(1.0, 0.6, 1.0);
          const cuff = new THREE.Mesh(cuffGeo, new THREE.MeshStandardMaterial({ color: 0x93c5fd, roughness: 0.8 }));
          cuff.position.set(0, -legLength + 0.04, 0);
          cuff.rotation.x = Math.PI / 2;
          legGroup.add(cuff);
        } else if (bStyle === "sweatpants" || bStyle === "leggings") {
          // Classic sporty two white lines down the sides of the legs!
          const lineGeo = new THREE.BoxGeometry(0.012, legLength * 0.8, 0.088);
          const lineMesh = new THREE.Mesh(lineGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }));
          lineMesh.position.set(side === "left" ? -0.082 : 0.082, -legLength / 2, 0);
          legGroup.add(lineMesh);
        } else if (bStyle === "cargo_pants") {
          // Large 3D pocket bags on the sides of the thighs!
          const pocketGeo = new THREE.BoxGeometry(0.03, 0.12, 0.09);
          const pocket = new THREE.Mesh(pocketGeo, bottomMat);
          pocket.position.set(side === "left" ? -0.08 : 0.08, -legLength * 0.4, 0);
          legGroup.add(pocket);
        } else if (bStyle === "mummy_wraps") {
          // Overlapping white wrapping bands
          for (let i = 0; i < 4; i++) {
            const wrapGeo = new THREE.TorusGeometry(0.09, 0.015, 6, 12);
            wrapGeo.scale(1.05, 0.6, 1.05);
            const wMesh = new THREE.Mesh(wrapGeo, new THREE.MeshStandardMaterial({ color: 0xfffbeb, roughness: 0.9 }));
            wMesh.position.set(0, -0.04 - (i * legLength * 0.28), 0);
            wMesh.rotation.set(0.1, i * 0.4, 0.15);
            legGroup.add(wMesh);
          }
        }
      }

      return legGroup;
    };

    // Shoes builder (신발도 고르게 - 6 classes!)
    const sType = avatar.shoeType || "sneakers";
    const sColor = new THREE.Color(avatar.shoeColor || "#ffffff");

    const buildCuteShoe = () => {
      const shoeGroup = new THREE.Group();
      const sMat = new THREE.MeshStandardMaterial({
        color: sColor,
        roughness: 0.72,
        metalness: sType === "boots" ? 0.2 : 0.0
      });

      if (sType === "sneakers") {
        // Chunky cool high-fashion athletic platform sneakers
        const soleGeo = new THREE.BoxGeometry(0.11, 0.05, 0.21);
        const soleMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9 });
        const sole = new THREE.Mesh(soleGeo, soleMat);
        sole.position.set(0, -0.04, 0.03);
        shoeGroup.add(sole);

        const upperGeo = new THREE.SphereGeometry(0.10, 12, 12);
        upperGeo.scale(1.02, 0.88, 1.32);
        const upper = new THREE.Mesh(upperGeo, sMat);
        upper.position.set(0, 0.005, 0.03);
        shoeGroup.add(upper);

      } else if (sType === "boots") {
        // Fashionable knee-high walk boots
        const upperGeo = new THREE.BoxGeometry(0.11, 0.18, 0.18);
        upperGeo.translate(0, 0.09, 0);
        const upper = new THREE.Mesh(upperGeo, sMat);
        upper.position.set(0, -0.06, 0.02);
        shoeGroup.add(upper);

        const toeGeo = new THREE.SphereGeometry(0.104, 12, 12);
        toeGeo.scale(1.0, 0.8, 1.3);
        const toe = new THREE.Mesh(toeGeo, sMat);
        toe.position.set(0, -0.04, 0.05);
        shoeGroup.add(toe);

      } else if (sType === "shoes_ribbon") {
        // Lolita sweet ribbons flats/pumps
        const baseGeo = new THREE.SphereGeometry(0.094, 12, 12);
        baseGeo.scale(1.0, 0.6, 1.4);
        const flat = new THREE.Mesh(baseGeo, sMat);
        flat.position.set(0, -0.03, 0.03);
        shoeGroup.add(flat);

        // Ribbon bow knots
        const ribbonMat = new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.5 });
        const loopL = new THREE.SphereGeometry(0.024, 8, 8);
        loopL.scale(1.4, 0.8, 0.5);
        
        const m1 = new THREE.Mesh(loopL, ribbonMat);
        m1.position.set(-0.02, 0.01, 0.09);
        m1.rotation.set(0.1, 0.1, 0.3);
        shoeGroup.add(m1);

        const m2 = m1.clone();
        m2.position.x = 0.02;
        m2.rotation.z = -0.3;
        shoeGroup.add(m2);

      } else if (sType === "sandals") {
        // Cool summer active cross strap sandals
        const soleGeo = new THREE.BoxGeometry(0.115, 0.03, 0.205);
        const soleMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9 });
        const sole = new THREE.Mesh(soleGeo, soleMat);
        sole.position.set(0, -0.05, 0.035);
        shoeGroup.add(sole);

        const toeGeo = new THREE.SphereGeometry(0.088, 10, 10);
        toeGeo.scale(1.0, 0.5, 0.8);
        const toe = new THREE.Mesh(toeGeo, skinMat);
        toe.position.set(0, -0.035, 0.085);
        shoeGroup.add(toe);

        const strapGeo = new THREE.BoxGeometry(0.12, 0.02, 0.035);
        const strap1 = new THREE.Mesh(strapGeo, sMat);
        strap1.position.set(0, -0.02, 0.045);
        const strap2 = strap1.clone();
        strap2.position.set(0, -0.01, -0.01);
        shoeGroup.add(strap1, strap2);

      } else if (sType === "socks_only") {
        // Fluffy socks with rainbow or color block bands
        const socksBaseGeo = new THREE.SphereGeometry(0.094, 12, 12);
        socksBaseGeo.scale(0.96, 0.65, 1.3);
        const sockBase = new THREE.Mesh(socksBaseGeo, sMat);
        sockBase.position.set(0, -0.03, 0.03);
        shoeGroup.add(sockBase);

        // Rainbow colored ring stripe
        const stripeGeo = new THREE.TorusGeometry(0.096, 0.016, 6, 12);
        stripeGeo.scale(1.0, 0.5, 1.0);
        const stripe1 = new THREE.Mesh(stripeGeo, new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
        stripe1.position.set(0, 0.01, 0.01);
        stripe1.rotation.x = Math.PI / 2;
        shoeGroup.add(stripe1);

      } else {
        // barefoot (default)
        const footGeo = new THREE.SphereGeometry(0.09, 12, 12);
        footGeo.scale(0.96, 0.6, 1.35);
        const foot = new THREE.Mesh(footGeo, skinMat);
        foot.position.set(0, -0.04, 0.045);
        shoeGroup.add(foot);
        
        const bigToeGeo = new THREE.SphereGeometry(0.022, 6, 6);
        const bigToe = new THREE.Mesh(bigToeGeo, skinMat);
        bigToe.position.set(0.025, -0.04, 0.12);
        shoeGroup.add(bigToe);
      }

      return shoeGroup;
    };

    // Construct right & left legs (Anchor snug under pelvis)
    const leftLeg = new THREE.Group();
    leftLeg.name = "leftLeg";
    leftLeg.position.set(-0.14, -0.50, 0);

    const leftLegMesh = createCustomLegMesh("left");
    leftLeg.add(leftLegMesh);

    const leftShoeMesh = buildCuteShoe();
    leftShoeMesh.position.set(0, -legLength, 0.01);
    leftLeg.add(leftShoeMesh);

    avatarGroup.add(leftLeg);
    leftLegRef.current = leftLeg;

    const rightLeg = new THREE.Group();
    rightLeg.name = "rightLeg";
    rightLeg.position.set(0.14, -0.50, 0);

    const rightLegMesh = createCustomLegMesh("right");
    rightLeg.add(rightLegMesh);

    const rightShoeMesh = buildCuteShoe();
    rightShoeMesh.position.set(0, -legLength, 0.01);
    rightLeg.add(rightShoeMesh);

    avatarGroup.add(rightLeg);
    rightLegRef.current = rightLeg;

    // RENDER SPECIAL SKIRT ENVELOPE (To match a beautiful girl/female bottom options)
    if (isSkirt) {
      let skirtGeo = new THREE.CylinderGeometry(0.24, 0.44, 0.45, 24);
      let skirtY = -0.52;
      
      if (bStyle === "hanbok_skirt") {
        skirtGeo = new THREE.CylinderGeometry(0.22, 0.58, 0.70, 24);
        skirtY = -0.62;
      } else if (bStyle === "ruffle_skirt") {
        skirtGeo = new THREE.CylinderGeometry(0.24, 0.48, 0.48, 18);
        skirtY = -0.53;
      }

      const skirt = new THREE.Mesh(skirtGeo, bottomMat);
      skirt.position.set(0, skirtY, 0);
      skirt.castShadow = true;
      skirt.receiveShadow = true;
      avatarGroup.add(skirt);
    }

    // M. EXTRA PREMIUM CUTE DETAILED FLOATIES (Floating Sparkles & Heart Particles!)
    const floatiesList: THREE.Group[] = [];
    const floatiesGroup = new THREE.Group();
    scene.add(floatiesGroup);

    // Helper to create a cute 3D star
    const create3DStarValue = (colorHex: number) => {
      const g = new THREE.Group();
      const starMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.1,
        metalness: 0.8,
        emissive: colorHex,
        emissiveIntensity: 0.2
      });
      
      const starCone1 = new THREE.ConeGeometry(0.045, 0.1, 4);
      const m1 = new THREE.Mesh(starCone1, starMat);
      m1.position.y = 0.05;
      g.add(m1);

      const starCone2 = new THREE.ConeGeometry(0.045, 0.1, 4);
      const m2 = new THREE.Mesh(starCone2, starMat);
      m2.position.y = -0.05;
      m2.rotation.x = Math.PI;
      g.add(m2);

      return g;
    };

    // Helper to create a cute 3D Heart
    const create3DHeartValue = (colorHex: number) => {
      const heartGroup = new THREE.Group();
      const heartMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.3,
        metalness: 0.1,
        emissive: colorHex,
        emissiveIntensity: 0.12
      });

      // Left lobe
      const lobeLGeo = new THREE.SphereGeometry(0.035, 8, 8);
      const lobeL = new THREE.Mesh(lobeLGeo, heartMat);
      lobeL.position.set(-0.024, 0.016, 0);
      heartGroup.add(lobeL);

      // Right lobe
      const lobeR = lobeL.clone();
      lobeR.position.x = 0.024;
      heartGroup.add(lobeR);

      // Bottom cone tip
      const tipGeo = new THREE.ConeGeometry(0.045, 0.09, 8);
      const tip = new THREE.Mesh(tipGeo, heartMat);
      tip.position.set(0, -0.03, 0);
      tip.rotation.z = Math.PI;
      heartGroup.add(tip);

      heartGroup.scale.set(0.9, 0.9, 0.9);
      return heartGroup;
    };

    const positionsList = [
      { x: -0.74, y: 0.5, z: 0.3, type: "star", color: 0xfacc15 },   // Gold Sparkle Left
      { x: 0.74, y: 0.7, z: 0.2, type: "heart", color: 0xf43f5e },  // Rose Pink Heart Right
      { x: -0.52, y: 1.1, z: -0.2, type: "heart", color: 0xec4899 },  // Vivid Pink Heart Top Left
      { x: 0.58, y: 1.2, z: 0.1, type: "star", color: 0xfacc15 }    // Gold Sparkle Top Right
    ];

    positionsList.forEach((pos, i) => {
      const g = pos.type === "star" ? create3DStarValue(pos.color) : create3DHeartValue(pos.color);
      g.position.set(pos.x, pos.y, pos.z);
      g.userData = {
        baseY: pos.y,
        speed: 1.4 + Math.random() * 0.8,
        offset: i * (Math.PI / 2)
      };
      floatiesGroup.add(g);
      floatiesList.push(g);
    });

    // L. ENTRY REVEAL SCALE ON BOUNCE
    avatarGroup.position.set(0, baseAvatarY, 0);
    avatarGroup.scale.set(0.1, 0.1, 0.1);

    // 6. ANIMATIONS RUN LOOP (30 actions trigger!)
    let animationFrameId = 0;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const time = performance.now() * 0.001;
      animTimeRef.current = time;

      // Elastic rotation easing
      if (avatarGroup) {
        avatarGroup.rotation.y += (rotationRef.current.y - avatarGroup.rotation.y) * 0.12;
        avatarGroup.rotation.x += (rotationRef.current.x - avatarGroup.rotation.x) * 0.12;
      }

      // Safe Scale Ease-in on reveal
      if (avatarGroup && avatarGroup.scale.x < 1.0) {
        const currentScale = avatarGroup.scale.x;
        const nextScale = currentScale + (1.0 - currentScale) * 0.1;
        avatarGroup.scale.set(nextScale, nextScale, nextScale);
      }

      // Gently animate background steam particles in Hanok cafe
      if (scene) {
        const steamGroup = scene.getObjectByName("steamGroup");
        if (steamGroup) {
          steamGroup.children.forEach((child) => {
            child.position.y = child.userData.baseY + Math.sin(time * 3.5 + child.userData.offset) * 0.014;
            child.position.x = Math.cos(time * 2.2 + child.userData.offset) * 0.008;
          });
        }
      }

      // BLINKING LOOP
      const blinkPhase = Math.sin(time * 3);
      if (leftEyeRef.current && rightEyeRef.current) {
        if (blinkPhase > 0.96) {
          leftEyeRef.current.scale.y = 0.08;
          rightEyeRef.current.scale.y = 0.08;
        } else {
          leftEyeRef.current.scale.y = 1.0;
          rightEyeRef.current.scale.y = 1.0;
        }
      }

      // TRIGNOMETRIC ACTIONS INTEGRATION
      if (avatarGroup && avatarGroup.scale.x >= 0.9) {
        
        // Reset defaults
        avatarGroup.position.y = baseAvatarY;
        avatarGroup.rotation.z = 0;
        
        if (headGroupRef.current) {
          headGroupRef.current.rotation.set(0, 0, 0);
          headGroupRef.current.position.set(0, 0.38, 0);
        }
        if (leftArmRef.current) leftArmRef.current.rotation.set(0, 0, -0.3);
        if (rightArmRef.current) rightArmRef.current.rotation.set(0, 0, 0.3);
        if (leftLegRef.current) leftLegRef.current.rotation.set(0, 0, 0);
        if (rightLegRef.current) rightLegRef.current.rotation.set(0, 0, 0);

        // Reset left hand fingers to default postures
        if (leftFingersRef.current && leftFingersRef.current.length === 5) {
          leftFingersRef.current[0].rotation.set(0.2, 0, -0.6);
          leftFingersRef.current[1].rotation.set(0.1, 0, -0.15);
          leftFingersRef.current[2].rotation.set(0.1, 0, 0);
          leftFingersRef.current[3].rotation.set(0.1, 0, 0.15);
          leftFingersRef.current[4].rotation.set(0.1, 0, 0.3);
          for (let i = 0; i < 5; i++) {
            leftFingersRef.current[i].scale.set(i === 4 ? 0.85 : 1.0, i === 4 ? 0.8 : 1.0, i === 4 ? 0.85 : 1.0);
          }
        }
        // Reset right hand fingers to default postures
        if (rightFingersRef.current && rightFingersRef.current.length === 5) {
          rightFingersRef.current[0].rotation.set(0.2, 0, 0.6);
          rightFingersRef.current[1].rotation.set(0.1, 0, 0.15);
          rightFingersRef.current[2].rotation.set(0.1, 0, 0);
          rightFingersRef.current[3].rotation.set(0.1, 0, -0.15);
          rightFingersRef.current[4].rotation.set(0.1, 0, -0.3);
          for (let i = 0; i < 5; i++) {
            rightFingersRef.current[i].scale.set(i === 4 ? 0.85 : 1.0, i === 4 ? 0.8 : 1.0, i === 4 ? 0.85 : 1.0);
          }
        }

        const exp = animation; // avatar.expression matches motion state

        switch (exp) {
          case "dance":
            // Groovy Side rock 
            const bounce = Math.abs(Math.sin(time * 4)) * 0.08;
            avatarGroup.position.y = baseAvatarY + bounce;
            avatarGroup.rotation.z = Math.sin(time * 3.5) * 0.08;
            
            if (headGroupRef.current) {
              headGroupRef.current.rotation.y = Math.cos(time * 3.5) * 0.14;
            }
            if (leftArmRef.current) {
              leftArmRef.current.rotation.z = -0.4 + Math.sin(time * 4) * 0.25;
              leftArmRef.current.rotation.x = Math.cos(time * 4) * 0.2;
            }
            if (rightArmRef.current) {
              rightArmRef.current.rotation.z = 0.4 + Math.cos(time * 4) * 0.25;
              rightArmRef.current.rotation.x = Math.sin(time * 4) * 0.2;
            }
            if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(time * 4) * 0.15;
            if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.sin(time * 4) * 0.15;
            break;

          case "wave":
            // Right arm raises high and waves side to side
            if (rightArmRef.current) {
              rightArmRef.current.rotation.z = 2.4;
              rightArmRef.current.rotation.x = Math.sin(time * 12) * 0.35;
            }
            if (leftArmRef.current) {
              leftArmRef.current.rotation.z = -0.4 + Math.sin(time * 2) * 0.05;
            }
            break;

          case "heart_loop":
            // Both hands meet in front of chest 
            if (leftArmRef.current) {
              leftArmRef.current.rotation.set(-1.1, 0.6, 0.3);
            }
            if (rightArmRef.current) {
              rightArmRef.current.rotation.set(-1.1, -0.6, -0.3);
            }
            avatarGroup.position.y = baseAvatarY + Math.sin(time * 2) * 0.016;

            // Form a heart with fingers: keep thumb and index extended, bend middle/ring/pinky
            if (leftFingersRef.current && leftFingersRef.current.length === 5) {
              leftFingersRef.current[0].rotation.set(0.1, 0.4, -0.1); // Thumb
              leftFingersRef.current[1].rotation.set(0.4, 0.5, -0.6); // Index curves in
              leftFingersRef.current[2].rotation.set(1.6, 0, 0); // Middle folded
              leftFingersRef.current[3].rotation.set(1.6, 0, 0); // Ring folded
              leftFingersRef.current[4].rotation.set(1.6, 0, 0); // Pinky folded
            }
            if (rightFingersRef.current && rightFingersRef.current.length === 5) {
              rightFingersRef.current[0].rotation.set(0.1, -0.4, 0.1); // Thumb
              rightFingersRef.current[1].rotation.set(0.4, -0.5, 0.6); // Index curves in
              rightFingersRef.current[2].rotation.set(1.6, 0, 0); // Middle folded
              rightFingersRef.current[3].rotation.set(1.6, 0, 0); // Ring folded
              rightFingersRef.current[4].rotation.set(1.6, 0, 0); // Pinky folded
            }
            break;

          case "thumbs_up":
            // Right arm points forward and up
            if (rightArmRef.current) {
              rightArmRef.current.rotation.set(-1.1, -0.3, -0.4);
            }
            if (headGroupRef.current) {
              headGroupRef.current.rotation.x = 0.08 + Math.cos(time * 3) * 0.04;
            }
            // Right hand: Thumb pointing straight up, others folded
            if (rightFingersRef.current && rightFingersRef.current.length === 5) {
              rightFingersRef.current[0].rotation.set(-0.9, 0, 0.1); // Thumb UP
              rightFingersRef.current[1].rotation.set(1.6, 0, 0); // Folded
              rightFingersRef.current[2].rotation.set(1.6, 0, 0); // Folded
              rightFingersRef.current[3].rotation.set(1.6, 0, 0); // Folded
              rightFingersRef.current[4].rotation.set(1.6, 0, 0); // Folded
            }
            break;

          case "shiver":
            // Extreme vibration
            const shiv = Math.sin(time * 45) * 0.014;
            avatarGroup.position.set(shiv, baseAvatarY, shiv);
            if (leftArmRef.current) leftArmRef.current.rotation.z = -0.1 + Math.sin(time * 40) * 0.08;
            if (rightArmRef.current) rightArmRef.current.rotation.z = 0.1 + Math.sin(time * 40) * 0.08;
            break;

          case "cry_sob":
            // Bow head, rub eyes in sorrow
            if (headGroupRef.current) {
              headGroupRef.current.rotation.x = 0.25 + Math.sin(time * 3) * 0.02;
            }
            if (leftArmRef.current) leftArmRef.current.rotation.set(-1.3, 0.35, 0.5 + Math.sin(time * 10) * 0.05);
            if (rightArmRef.current) rightArmRef.current.rotation.set(-1.3, -0.35, -0.5 - Math.sin(time * 10) * 0.05);
            avatarGroup.position.y = baseAvatarY + Math.sin(time * 24) * 0.005; // trembling
            break;

          case "angry_stomp":
            // alternate stamping legs
            const rStamp = Math.sin(time * 12);
            if (leftLegRef.current) leftLegRef.current.rotation.x = Math.max(0, rStamp * 0.22);
            if (rightLegRef.current) rightLegRef.current.rotation.x = Math.max(0, -rStamp * 0.22);
            if (headGroupRef.current) {
              headGroupRef.current.rotation.set(0.14, Math.sin(time * 12) * 0.08, 0);
            }
            break;

          case "sleepy_head":
            // slow drop and fast nod-up!
            const tCycle = (time * 0.3) % 1.0; // slow loop
            const drop = tCycle < 0.7 ? (tCycle / 0.7) * 0.26 : (1.0 - (tCycle - 0.7) / 0.3) * 0.26;
            if (headGroupRef.current) {
              headGroupRef.current.rotation.x = drop;
            }
            break;

          case "shy_wiggle":
            // leg squeeze, hip twist
            avatarGroup.rotation.y += Math.sin(time * 4) * 0.12;
            if (leftLegRef.current) leftLegRef.current.rotation.z = 0.09;
            if (rightLegRef.current) rightLegRef.current.rotation.z = -0.09;
            break;

          case "flight":
            // gravity floating slow sweep
            avatarGroup.position.y = (baseAvatarY + 0.07) + Math.sin(time * 2.2) * 0.12;
            if (leftArmRef.current) leftArmRef.current.rotation.z = -0.45 + Math.sin(time * 2.2) * 0.08;
            if (rightArmRef.current) rightArmRef.current.rotation.z = 0.45 - Math.sin(time * 2.2) * 0.08;
            if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(time * 2) * 0.08;
            break;

          case "jumping":
            const hop = Math.max(baseAvatarY, baseAvatarY + Math.sin(time * 5.5) * 0.3);
            avatarGroup.position.y = hop;
            if (leftArmRef.current) leftArmRef.current.rotation.z = -1.2;
            if (rightArmRef.current) rightArmRef.current.rotation.z = 1.2;
            break;

          case "bowing":
            // slow deep bow
            const bowCycle = Math.sin(time * 1.5) * 0.5 + 0.5; // 0 to 1
            if (headGroupRef.current) {
              headGroupRef.current.position.y = 0.38 - bowCycle * 0.15;
            }
            avatarGroup.rotation.x = bowCycle * 0.32;
            break;

          case "laughing":
            const laughShake = Math.sin(time * 30) * 0.012;
            if (headGroupRef.current) {
              headGroupRef.current.rotation.set(-0.11 + laughShake, 0, 0);
            }
            avatarGroup.position.y = baseAvatarY + laughShake * 0.5;
            break;

          case "facepalm":
            // Right hand coverings face
            if (rightArmRef.current) {
              rightArmRef.current.rotation.set(-1.4, -0.5, -0.8);
            }
            if (headGroupRef.current) {
              headGroupRef.current.rotation.set(0.18, 0, 0.05);
            }
            break;

          case "exploding":
            const expl = 1.0 + Math.abs(Math.sin(time * 14)) * 0.04;
            avatarGroup.scale.set(expl, expl, expl);
            break;

          case "running":
            // alternating active run
            const rCycle = time * 7;
            if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(rCycle) * 0.44;
            if (rightLegRef.current) rightLegRef.current.rotation.x = -Math.sin(rCycle) * 0.44;
            if (leftArmRef.current) leftArmRef.current.rotation.x = -Math.sin(rCycle) * 0.5;
            if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(rCycle) * 0.5;
            break;

          case "sneaking":
            avatarGroup.position.y = (baseAvatarY - 0.09) + Math.abs(Math.sin(time * 3.5)) * 0.04;
            if (leftLegRef.current) leftLegRef.current.rotation.set(0.25, 0, 0);
            if (rightLegRef.current) rightLegRef.current.rotation.set(0.25, 0, 0);
            break;

          case "clapping":
            // rapid clap
            const clap = Math.sin(time * 20) * 0.25;
            if (leftArmRef.current) leftArmRef.current.rotation.set(-0.8, 0.4, 0.4 + clap);
            if (rightArmRef.current) rightArmRef.current.rotation.set(-0.8, -0.4, -0.4 - clap);
            break;

          case "thinking":
            if (leftArmRef.current) leftArmRef.current.rotation.set(-1.3, 0.5, 0.7);
            if (headGroupRef.current) headGroupRef.current.rotation.set(0.08, 0.12, 0.06);
            break;

          case "saluting":
            if (rightArmRef.current) {
              rightArmRef.current.rotation.set(-1.4, -0.7, -1.1); // rigid salute
            }
            break;

          case "rockout":
            // heavy headbanging
            const headBang = Math.sin(time * 16) * 0.28;
            if (headGroupRef.current) headGroupRef.current.rotation.x = 0.1 + headBang;
            if (leftArmRef.current) leftArmRef.current.rotation.set(-1.5, 0.2, 1.2 + Math.sin(time * 10) * 0.2);
            if (rightArmRef.current) rightArmRef.current.rotation.set(-1.5, -0.2, -1.2 - Math.sin(time * 10) * 0.2);
            break;

          case "begging":
            if (leftArmRef.current) leftArmRef.current.rotation.set(-1.1, 0.4, 0.3);
            if (rightArmRef.current) rightArmRef.current.rotation.set(-1.1, -0.4, -0.3);
            avatarGroup.position.y = baseAvatarY + Math.sin(time * 4) * 0.016;

            // Straighten and align both left and right fingers for a praying/begging posture
            if (leftFingersRef.current && leftFingersRef.current.length === 5) {
              leftFingersRef.current[0].rotation.set(-0.3, 0.1, -0.1);
              leftFingersRef.current[1].rotation.set(-0.4, 0.1, -0.05);
              leftFingersRef.current[2].rotation.set(-0.4, 0, 0);
              leftFingersRef.current[3].rotation.set(-0.4, -0.1, 0.05);
              leftFingersRef.current[4].rotation.set(-0.4, -0.2, 0.1);
            }
            if (rightFingersRef.current && rightFingersRef.current.length === 5) {
              rightFingersRef.current[0].rotation.set(-0.3, -0.1, 0.1);
              rightFingersRef.current[1].rotation.set(-0.4, -0.1, 0.05);
              rightFingersRef.current[2].rotation.set(-0.4, 0, 0);
              rightFingersRef.current[3].rotation.set(-0.4, 0.1, -0.05);
              rightFingersRef.current[4].rotation.set(-0.4, 0.2, -0.1);
            }
            break;

          case "yawning":
            if (leftArmRef.current) leftArmRef.current.rotation.z = -1.9;
            if (rightArmRef.current) rightArmRef.current.rotation.z = 1.9;
            avatarGroup.rotation.x = -Math.abs(Math.sin(time * 1.5)) * 0.14;
            break;

          case "boxing":
            const boxer = Math.sin(time * 9);
            if (leftArmRef.current) leftArmRef.current.rotation.set(boxer > 0 ? -1.4 : -0.5, 0.1, boxer > 0 ? 0.2 : -0.2);
            if (rightArmRef.current) rightArmRef.current.rotation.set(boxer <= 0 ? -1.4 : -0.5, -0.1, boxer <= 0 ? -0.2 : 0.2);
            break;

          case "dizzy_spin":
            avatarGroup.rotation.y += 0.05;
            if (headGroupRef.current) {
              headGroupRef.current.rotation.set(Math.sin(time * 4) * 0.11, Math.cos(time * 4) * 0.11, 0);
            }
            break;

          case "surprised_hop":
            avatarGroup.position.y = baseAvatarY + Math.max(0, Math.sin(time * 3) * 0.16);
            if (leftArmRef.current) leftArmRef.current.rotation.z = -1.1;
            if (rightArmRef.current) rightArmRef.current.rotation.z = 1.1;
            break;

          case "flying_kiss":
            const kiss = Math.sin(time * 2);
            if (rightArmRef.current) {
              rightArmRef.current.rotation.set(-0.95 + kiss * 0.35, -0.3, -0.6 + kiss * 0.2);
            }
            break;

          case "sweat_drop":
            if (leftArmRef.current) {
              leftArmRef.current.rotation.set(-1.3, 0.5, 1.0 + Math.sin(time * 5) * 0.1);
            }
            break;

          case "victory_v":
            if (leftArmRef.current) leftArmRef.current.rotation.z = -0.3;
            if (rightArmRef.current) {
              rightArmRef.current.rotation.set(-1.2, -0.3, -0.6);
            }
            if (rightFingersRef.current && rightFingersRef.current.length === 5) {
              // Fold thumb, ring, pinky
              rightFingersRef.current[0].rotation.set(1.1, -0.3, 0.4); // Thumb folded across palm
              rightFingersRef.current[3].rotation.set(1.6, 0, 0); // Ring folded
              rightFingersRef.current[4].rotation.set(1.6, 0, 0); // Pinky folded
              
              // Extend index and middle, spread them apart for V sign
              rightFingersRef.current[1].rotation.set(-0.5, -0.22, 0.1); // Index
              rightFingersRef.current[2].rotation.set(-0.5, 0.22, -0.1); // Middle
              
              // Scale index and middle up slightly to make the V sign look very clear and cute!
              rightFingersRef.current[1].scale.set(1.15, 1.25, 1.15);
              rightFingersRef.current[2].scale.set(1.15, 1.25, 1.15);
            }
            break;

          default:
            // "idle" breathing
            const breatheY = Math.sin(time * 1.8) * 0.012;
            avatarGroup.position.y = baseAvatarY + breatheY;
            
            if (headGroupRef.current) {
              headGroupRef.current.rotation.z = Math.sin(time * 0.9) * 0.016;
              headGroupRef.current.rotation.y = Math.cos(time * 0.8) * 0.026;
            }
            if (leftArmRef.current) {
              leftArmRef.current.rotation.z = -0.35 + Math.sin(time * 1.8) * 0.03;
              leftArmRef.current.rotation.x = 0.1 + Math.cos(time * 1.8) * 0.03;
            }
            if (rightArmRef.current) {
              rightArmRef.current.rotation.z = 0.35 - Math.sin(time * 1.8) * 0.03;
              rightArmRef.current.rotation.x = 0.1 - Math.cos(time * 1.8) * 0.03;
            }
            break;
        }

        // Ambient premium floaties (bobbing and rotating)
        floatiesList.forEach((flo) => {
          const speed = flo.userData.speed || 1.5;
          const offset = flo.userData.offset || 0;
          const baseY = flo.userData.baseY || 0.4;
          
          flo.position.y = baseY + Math.sin(time * speed + offset) * 0.12;
          flo.rotation.y += 0.014;
          flo.rotation.x += 0.007;
        });
      }

      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
    };
  }, [avatar, animation]);

  return (
    <div className="relative w-full h-[460px] md:h-[580px] select-none rounded-[32px] overflow-hidden flex flex-col justify-between">
      
      {/* Click and Drag to Rotate Badge */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5 pointer-events-none z-10">
        <span className="px-3 py-1.5 bg-white/90 backdrop-blur-md text-[10px] font-black tracking-wide text-[#5C218B] uppercase rounded-full shadow-xs border border-[#E1DEE6]">
          🖐️ 마우스로 드래그하여 회전
        </span>
        <button
          onClick={resetCamera}
          id="btn-3d-reset-cam-new"
          title="Reset Viewpoint"
          className="pointer-events-auto p-1.5 hover:scale-105 active:scale-95 bg-white backdrop-blur-md rounded-full shadow-xs text-[#5C218B] border border-[#E1DEE6] transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* WebGL Canvas */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        className="relative flex-grow w-full cursor-grab active:cursor-grabbing flex items-center justify-center overflow-hidden"
      >
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* Download action footer dock */}
      <div className="p-3 bg-white/40 backdrop-blur-md border-t border-white/20 z-10 flex gap-2.5 items-center justify-between">
        <p className="text-[10px] text-[#5C218B] font-bold px-3 py-1 rounded-full bg-white/80">
          Chibi Engine v3.0 Alpha
        </p>
        
        <button
          onClick={downloadSnapshot}
          id="btn-download-chibi-snap"
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#5C218B] hover:bg-[#4d1478] text-white font-bold text-xs rounded-full shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <Download className="w-4 h-4 text-white" />
          <span>고화질 PNG 아바타 스냅샷 저장</span>
        </button>
      </div>
    </div>
  );
}
