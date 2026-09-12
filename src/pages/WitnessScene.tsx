import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { cameraProgressAt, phaseAt, type Attention } from "./witnessExperience";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

type Props = {
  progress: RefObject<number>;
  orbit: RefObject<{ x: number; y: number; manual: boolean }>;
  reduced: RefObject<boolean>;
  attention: RefObject<Attention>;
  anchors: RefObject<(HTMLButtonElement | null)[]>;
  motionPaused: RefObject<boolean>;
  onReady: () => void;
  onError: () => void;
};
const smooth = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b);

/** Two genuine 3D scenes: the living room is rendered into the figure's screen. */
export default function WitnessScene({ progress, orbit, reduced, attention, anchors, motionPaused, onReady, onError }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const callbacks = useRef({ onReady, onError });
  callbacks.current = { onReady, onError };

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
    } catch {
      callbacks.current.onError();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-label", "A continuous camera journey out of a sunlit room, through a television head, around a still seated person.");
    renderer.domElement.setAttribute("role", "img");
    container.appendChild(renderer.domElement);

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];
    const ownGeometry = <T extends THREE.BufferGeometry>(g: T) => { geometries.push(g); return g; };
    const ownMaterial = <T extends THREE.Material>(m: T) => { materials.push(m); return m; };
    const standard = (color: string, roughness = 0.8, metalness = 0) => ownMaterial(new THREE.MeshStandardMaterial({ color, roughness, metalness }));
    const sphere = ownGeometry(new THREE.SphereGeometry(1, 32, 20));
    const box = (parent: THREE.Object3D, size: [number, number, number], at: [number, number, number], mat: THREE.Material, radius = 0.03) => {
      const mesh = new THREE.Mesh(ownGeometry(new RoundedBoxGeometry(...size, 3, radius)), mat);
      mesh.position.set(...at); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
    };
    const ellipsoid = (parent: THREE.Object3D, at: [number, number, number], size: [number, number, number], mat: THREE.Material) => {
      const mesh = new THREE.Mesh(sphere, mat); mesh.position.set(...at); mesh.scale.set(...size);
      mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
    };
    const rod = (parent: THREE.Object3D, a: [number, number, number], b: [number, number, number], r1: number, r2: number, mat: THREE.Material) => {
      const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), direction = end.clone().sub(start);
      const mesh = new THREE.Mesh(ownGeometry(new THREE.CylinderGeometry(r2, r1, direction.length(), 24)), mat);
      mesh.position.copy(start.add(end).multiplyScalar(.5));
      mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
      mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh;
    };
    const fabricCanvas = document.createElement("canvas"); fabricCanvas.width = fabricCanvas.height = 128;
    const fabricCtx = fabricCanvas.getContext("2d")!;
    const pixels = fabricCtx.createImageData(128, 128);
    for (let i = 0; i < pixels.data.length; i += 4) {
      const x = (i / 4) % 128, y = Math.floor(i / 512);
      const value = 150 + Math.sin(x * 2.5) * 28 + Math.cos(y * 2.5) * 28;
      pixels.data.set([value, value, value, 255], i);
    }
    fabricCtx.putImageData(pixels, 0, 0);
    const fabric = new THREE.CanvasTexture(fabricCanvas); fabric.wrapS = fabric.wrapT = THREE.RepeatWrapping; fabric.repeat.set(8, 8); textures.push(fabric);

    // The everyday world. This camera is also the content of the CRT head.
    const reality = new THREE.Scene(); reality.background = new THREE.Color("#abb6b1");
    const realityCamera = new THREE.PerspectiveCamera(52, 1.5, .1, 100);
    realityCamera.position.set(0, 1.6, 5.8); realityCamera.lookAt(.2, 1.6, -1.5);
    reality.add(new THREE.HemisphereLight("#e8e4d8", "#71634e", 2.2));
    const sun = new THREE.DirectionalLight("#ffe0ab", 4.3); sun.position.set(-4, 6, -5); sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -7; sun.shadow.camera.right = 7; sun.shadow.camera.top = 7; sun.shadow.camera.bottom = -7; sun.shadow.normalBias = .025; sun.shadow.bias = -.0002; sun.shadow.radius = 4;
    sun.target.position.set(1, 0, 2); reality.add(sun, sun.target);
    const plaster = standard("#c4b9a3"), wood = standard("#66513a"), darkWood = standard("#43392d"), linen = standard("#b0aa96"), ceramic = standard("#9d6949", .42);
    linen.bumpMap = fabric; linen.bumpScale = .012;
    box(reality, [15, .15, 17], [0, -.12, 0], wood);
    for (let x = -7; x <= 7; x += .48) box(reality, [.012, .004, 16], [x, -.04, 0], darkWood, .001);
    box(reality, [1.6, 6, .22], [-5.2, 2.9, -4], plaster);
    box(reality, [3.4, 6, .22], [4.3, 2.9, -4], plaster);
    box(reality, [8.5, .6, .22], [-.6, 5.6, -4], plaster);
    box(reality, [8.5, .8, .22], [-.6, .25, -4], plaster);
    box(reality, [.2, 6, 13], [-6, 2.9, 1], plaster);
    box(reality, [.2, 6, 13], [6, 2.9, 1], plaster);

    const skyCanvas = document.createElement("canvas"); skyCanvas.width = 1024; skyCanvas.height = 512;
    const skyCtx = skyCanvas.getContext("2d")!;
    const gradient = skyCtx.createLinearGradient(0, 0, 0, 512);
    gradient.addColorStop(0, "#7e9fa7"); gradient.addColorStop(.51, "#d9c9a4"); gradient.addColorStop(.57, "#ead4a4"); gradient.addColorStop(.59, "#79928c"); gradient.addColorStop(1, "#9eafa0");
    skyCtx.fillStyle = gradient; skyCtx.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 85; i++) {
      const y = 304 + i * 2.5; skyCtx.fillStyle = `rgba(238,221,178,${.03 + (Math.sin(i * 6) + 1) * .04})`;
      skyCtx.fillRect((Math.sin(i * 17) + 1) * 180, y, 500 + Math.cos(i) * 200, 1);
    }
    const skyTexture = new THREE.CanvasTexture(skyCanvas); skyTexture.colorSpace = THREE.SRGBColorSpace; textures.push(skyTexture);
    const outdoor = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(22, 11)), ownMaterial(new THREE.MeshBasicMaterial({ map: skyTexture })));
    outdoor.position.set(0, 3, -9); reality.add(outdoor);
    const frameMat = standard("#413e34", .6);
    for (const x of [-4.35, -2.1, .15, 2.4]) box(reality, [.075, 4.75, .16], [x, 2.95, -3.8], frameMat, .008);
    box(reality, [6.8, .075, .16], [-.98, 2.4, -3.8], frameMat, .008);
    box(reality, [7, .12, .7], [-1, .7, -3.75], plaster);
    // Pleated linen curtains, modeled so light catches each fold.
    const curtainMat = standard("#dfd6c0"); curtainMat.side = THREE.DoubleSide;
    const curtains: THREE.Mesh[] = [];
    for (const x of [-4.45, 2.45]) {
      const geo = ownGeometry(new THREE.PlaneGeometry(1.3, 5, 32, 12));
      const attr = geo.attributes.position;
      for (let i = 0; i < attr.count; i++) attr.setZ(i, Math.sin(attr.getX(i) * 31) * .075);
      geo.computeVertexNormals();
      const mesh = new THREE.Mesh(geo, curtainMat); mesh.position.set(x, 2.9, -3.45); mesh.castShadow = true; mesh.receiveShadow = true; reality.add(mesh); curtains.push(mesh);
    }
    const rugMat = standard("#bcb09a"); rugMat.bumpMap = fabric; rugMat.bumpScale = .02;
    box(reality, [5.8, .025, 4.6], [.2, -.018, .5], rugMat, .01);
    // Quiet sofa at right, low oak table and objects in the foreground.
    const sofa = new THREE.Group(); sofa.position.set(3.1, 0, -.9); sofa.rotation.y = -.28; reality.add(sofa);
    box(sofa, [2.3, .42, 1.1], [0, .52, 0], linen, .14);
    box(sofa, [2.3, .9, .28], [0, 1.05, -.51], linen, .13);
    for (const x of [-1.1, 1.1]) box(sofa, [.24, .67, 1.18], [x, .76, 0], linen, .1);
    for (const x of [-.53, .53]) box(sofa, [1.03, .19, .89], [x, .81, .07], linen, .07);
    for (const x of [-.9, .9]) for (const z of [-.35, .35]) rod(sofa, [x, .05, z], [x, .4, z], .05, .04, darkWood);
    const pillow = box(sofa, [.65, .64, .2], [.7, 1.12, -.28], standard("#8c674c"), .12); pillow.rotation.z = -.16;
    const tabletop = box(reality, [2.5, .14, 1.2], [.1, .68, 1.05], wood, .16);
    tabletop.rotation.y = -.12;
    for (const x of [-.8, .95]) for (const z of [.65, 1.45]) rod(reality, [x, .05, z], [x, .65, z], .035, .04, darkWood);
    const paper = standard("#d6cab2");
    box(reality, [.62, .065, .45], [-.55, .79, .95], standard("#686a55"), .009);
    const book = box(reality, [.56, .035, .4], [-.5, .84, .96], paper, .008); book.rotation.y = .18;
    const cupGeo = ownGeometry(new THREE.LatheGeometry([new THREE.Vector2(.065, 0), new THREE.Vector2(.09, .025), new THREE.Vector2(.105, .22), new THREE.Vector2(.087, .22), new THREE.Vector2(.075, .04)], 32));
    const cup = new THREE.Mesh(cupGeo, ceramic); cup.position.set(.55, .76, .95); cup.castShadow = true; reality.add(cup);
    const handle = new THREE.Mesh(ownGeometry(new THREE.TorusGeometry(.067, .014, 12, 24)), ceramic); handle.position.set(.66, .89, .95); reality.add(handle);
    const coffee = new THREE.Mesh(ownGeometry(new THREE.CircleGeometry(.084, 32)), standard("#2e2015")); coffee.rotation.x = -Math.PI / 2; coffee.position.set(.55, .96, .95); reality.add(coffee);
    // The same unanswered message remains in the physical room through every reveal.
    const phoneCanvas = document.createElement("canvas"); phoneCanvas.width = 384; phoneCanvas.height = 640;
    const phoneCtx = phoneCanvas.getContext("2d")!;
    phoneCtx.fillStyle = "#283c42"; phoneCtx.fillRect(0, 0, 384, 640);
    phoneCtx.fillStyle = "#e7e5dc"; phoneCtx.font = "32px sans-serif"; phoneCtx.fillText("9:41", 34,  60);
    phoneCtx.font = "21px sans-serif"; phoneCtx.fillStyle = "#759a94"; phoneCtx.fillRect(25, 170, 333, 135);
    phoneCtx.fillStyle = "#ffffff"; phoneCtx.fillText("Hey, is everything", 42, 214); phoneCtx.fillText("okay?", 42, 249);
    phoneCtx.fillStyle = "#bac4c2"; phoneCtx.font = "17px sans-serif"; phoneCtx.fillText("Delivered · No reply yet", 75, 342);
    const phoneTexture = new THREE.CanvasTexture(phoneCanvas); phoneTexture.colorSpace = THREE.SRGBColorSpace; textures.push(phoneTexture);
    box(reality, [.35, .027, .63], [-.05, .777, 1.36], standard("#202725", .45), .025);
    const phoneDisplay = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(.31, .57)), ownMaterial(new THREE.MeshBasicMaterial({ map: phoneTexture })));
    phoneDisplay.rotation.x = -Math.PI / 2; phoneDisplay.position.set(-.05, .793, 1.36); reality.add(phoneDisplay);
    const phoneGlow = new THREE.PointLight("#b8ddd3", .08, 1.7); phoneGlow.position.set(-.05, 1, 1.36); reality.add(phoneGlow);
    const thoughtCanvas = document.createElement("canvas"); thoughtCanvas.width = 1024; thoughtCanvas.height = 160;
    const thoughtContext = thoughtCanvas.getContext("2d")!;
    thoughtContext.fillStyle = "#fff1dc"; thoughtContext.font = "italic 48px Georgia";
    thoughtContext.textAlign = "center"; thoughtContext.shadowColor = "#28342a"; thoughtContext.shadowBlur = 16;
    thoughtContext.fillText("They must be upset with me.", 512, 88);
    const thoughtTexture = new THREE.CanvasTexture(thoughtCanvas); thoughtTexture.colorSpace = THREE.SRGBColorSpace; textures.push(thoughtTexture);
    const thoughtMaterial = ownMaterial(new THREE.SpriteMaterial({ map: thoughtTexture, transparent: true, depthWrite: false, opacity: 0 }));
    const thoughtInRoom = new THREE.Sprite(thoughtMaterial); thoughtInRoom.position.set(.1, 2.15, 1.9); thoughtInRoom.scale.set(3.7, .58, 1); reality.add(thoughtInRoom);
    const steamMaterial = ownMaterial(new THREE.MeshBasicMaterial({ color: "#f3e8cd", transparent: true, opacity: .16, depthWrite: false }));
    const steam = new THREE.Group(); reality.add(steam);
    for (let i = 0; i < 5; i++) {
      const wisp = new THREE.Mesh(ownGeometry(new THREE.TorusGeometry(.022 + i * .004, .003, 6, 24, Math.PI * 1.5)), steamMaterial);
      wisp.position.set(.55, 1.06 + i * .065, .95); wisp.rotation.x = .3; steam.add(wisp);
    }
    // Houseplant by the window.
    const pot = new THREE.Mesh(ownGeometry(new THREE.CylinderGeometry(.34, .24, .55, 32)), ceramic); pot.position.set(-3.4, .27, -2.5); pot.castShadow = true; reality.add(pot);
    const leafMat = standard("#4e6040");
    for (let i = 0; i < 14; i++) {
      const angle = i * 2.4, height = .8 + (i % 5) * .24;
      const x = -3.4 + Math.cos(angle) * .5, z = -2.5 + Math.sin(angle) * .4;
      rod(reality, [-3.4, .45, -2.5], [x, height, z], .012, .007, leafMat);
      const leaf = ellipsoid(reality, [x, height, z], [.14, .32, .025], leafMat); leaf.rotation.set(.4, angle, -.6 + (i % 3) * .5);
    }
    // A standing lamp contributes a familiar human scale.
    rod(reality, [4.6, .1, -2.8], [4.6, 2.1, -2.8], .025, .025, darkWood);
    const shade = new THREE.Mesh(ownGeometry(new THREE.CylinderGeometry(.3, .53, .6, 40, 1, true)), standard("#e4c99d")); shade.position.set(4.6, 2.17, -2.8); reality.add(shade);
    const lampLight = new THREE.PointLight("#ffcf85", 8, 4); lampLight.position.set(4.6, 1.9, -2.8); reality.add(lampLight);

    const target = new THREE.WebGLRenderTarget(1200, 800, { depthBuffer: true });
    target.texture.colorSpace = THREE.LinearSRGBColorSpace;
    const scene = new THREE.Scene(); scene.background = new THREE.Color("#bdb5a6"); scene.fog = new THREE.Fog("#bdb5a6", 17, 45);
    const camera = new THREE.PerspectiveCamera(38, 1, .02, 80);
    scene.add(new THREE.HemisphereLight("#f5eede", "#827c70", 2.4));
    const key = new THREE.DirectionalLight("#ffe6bf", 3.3); key.position.set(-3.5, 7, 4); key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -5; key.shadow.camera.right = 5; key.shadow.camera.top = 5; key.shadow.camera.bottom = -5; key.shadow.normalBias = .018; key.shadow.bias = -.0001; key.shadow.radius = 5; scene.add(key);
    const rim = new THREE.DirectionalLight("#dae9ec", 2); rim.position.set(2, 4, -4); scene.add(rim);
    const groundMat = standard("#b8b09f", .95);
    const ground = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(180, 180)), groundMat); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
    // A soft contact shadow grounds the chair without a floating miniature effect.
    const shadowCanvas = document.createElement("canvas"); shadowCanvas.width = shadowCanvas.height = 128;
    const shadowCtx = shadowCanvas.getContext("2d")!;
    const shadowGradient = shadowCtx.createRadialGradient(64, 64, 5, 64, 64, 64); shadowGradient.addColorStop(0, "rgba(29,23,17,.37)"); shadowGradient.addColorStop(1, "rgba(29,23,17,0)"); shadowCtx.fillStyle = shadowGradient; shadowCtx.fillRect(0, 0, 128, 128);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas); textures.push(shadowTex);
    const contact = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(3.8, 3.8)), ownMaterial(new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false })));
    contact.rotation.x = -Math.PI / 2; contact.position.y = .006; scene.add(contact);

    const person = new THREE.Group(); scene.add(person);
    const walnut = standard("#534332", .42), upholstery = standard("#544d40", .93);
    upholstery.bumpMap = fabric; upholstery.bumpScale = .012;
    // Low, upholstered wooden chair. Front faces +Z.
    box(person, [1.13, .18, 1.05], [0, .7, .04], walnut, .09);
    box(person, [1.08, .22, .95], [0, .85, .08], upholstery, .1);
    const chairBack = box(person, [1.13, .89, .13], [0, 1.3, -.43], walnut, .07); chairBack.rotation.x = -.13;
    const chairCushion = box(person, [1.02, .78, .18], [0, 1.32, -.31], upholstery, .1); chairCushion.rotation.x = -.13;
    for (const side of [-1, 1]) {
      rod(person, [side * .61, .02, -.49], [side * .49, .76, -.31], .037, .044, walnut);
      rod(person, [side * .61, .02, .59], [side * .49, .76, .4], .037, .044, walnut);
      rod(person, [side * .54, .72, .41], [side * .54, 1.14, .41], .026, .026, walnut);
      box(person, [.12, .09, 1], [side * .57, 1.17, .05], walnut, .04);
    }
    const sweater = standard("#616656", .97); sweater.bumpMap = fabric; sweater.bumpScale = .012;
    const trousers = standard("#3c4038", .95); trousers.bumpMap = fabric; trousers.bumpScale = .008;
    const skin = standard("#b48a69", .82), shoe = standard("#54473a", .67), sole = standard("#282820", .92);
    // Lathed torso gives the silhouette shoulders, a waist and a natural seated slouch.
    const torsoProfile = [[.0, 0], [.31, .02], [.34, .13], [.32, .3], [.36, .53], [.37, .64], [.28, .71], [.14, .77], [.12, .79]].map(([r, y]) => new THREE.Vector2(r, y));
    const torso = new THREE.Mesh(ownGeometry(new THREE.LatheGeometry(torsoProfile, 48)), sweater); torso.position.set(0, .94, -.06); torso.scale.z = .68; torso.rotation.x = -.07; torso.castShadow = true; torso.receiveShadow = true; person.add(torso);
    ellipsoid(person, [0, .97, .08], [.34, .2, .29], trousers);
    rod(person, [0, 1.67, -.01], [0, 1.91, 0], .115, .105, skin);
    const collar = new THREE.Mesh(ownGeometry(new THREE.TorusGeometry(.127, .023, 12, 40)), sweater); collar.rotation.x = Math.PI / 2; collar.position.set(0, 1.7, -.01); person.add(collar);
    for (const s of [-1, 1]) {
      const thigh = ellipsoid(person, [s * .2, .91, .42], [.18, .18, .43], trousers); thigh.rotation.y = s * -.12;
      ellipsoid(person, [s * .24, .83, .75], [.165, .18, .16], trousers);
      rod(person, [s * .24, .81, .76], [s * .27, .22, .85], .13, .1, trousers);
      ellipsoid(person, [s * .255, .49, .8], [.115, .29, .115], trousers);
      box(person, [.27, .075, .49], [s * .28, .057, .98], sole, .05);
      ellipsoid(person, [s * .28, .15, .99], [.139, .105, .255], shoe);
      // Sleeves descend from shoulders, with forearms resting on the chair arms.
      ellipsoid(person, [s * .33, 1.53, -.03], [.16, .17, .15], sweater);
      rod(person, [s * .35, 1.53, 0], [s * .47, 1.17, .15], .14, .11, sweater);
      ellipsoid(person, [s * .47, 1.17, .15], [.113, .11, .12], sweater);
      rod(person, [s * .47, 1.18, .14], [s * .48, 1.18, .44], .105, .08, sweater);
      ellipsoid(person, [s * .48, 1.16, .51], [.075, .045, .1], skin);
      for (let f = 0; f < 4; f++) {
        const x = s * .48 + (f - 1.5) * .031;
        rod(person, [x, 1.155, .54], [x, 1.12, .63 - Math.abs(f - 1.5) * .018], .015, .011, skin);
        ellipsoid(person, [x, 1.12, .62 - Math.abs(f - 1.5) * .018], [.012, .015, .024], skin);
      }
      const thumb = ellipsoid(person, [s * .405, 1.14, .52], [.027, .031, .065], skin); thumb.rotation.y = s * .5;
    }

    // The head is a rounded, detailed CRT, not a flat screen pasted over a face.
    const tv = new THREE.Group(); tv.position.set(0, 2.13, 0); person.add(tv);
    const shell = standard("#b3aa92", .55), bezel = standard("#292d29", .48), metal = standard("#888b7f", .3, .55);
    box(tv, [1.18, .87, .77], [0, 0, -.025], shell, .105);
    box(tv, [1.1, .79, .055], [0, 0, .373], bezel, .08);
    box(tv, [1.04, .73, .035], [-.025, 0, .411], shell, .07);
    box(tv, [.93, .64, .035], [-.047, .015, .44], bezel, .065);
    const screenGeo = ownGeometry(new THREE.PlaneGeometry(.86, .575, 40, 30));
    const screenPos = screenGeo.attributes.position;
    for (let i = 0; i < screenPos.count; i++) {
      const x = screenPos.getX(i) / .43, y = screenPos.getY(i) / .2875;
      screenPos.setZ(i, .038 * (1 - x * x) * (1 - y * y));
    }
    screenGeo.computeVertexNormals();
    const screenMat = ownMaterial(new THREE.MeshBasicMaterial({ map: target.texture, toneMapped: false }));
    const screen = new THREE.Mesh(screenGeo, screenMat); screen.position.set(-.047, .02, .466); tv.add(screen);
    // Glass edge and small hardware remain readable when the camera moves around.
    const glass = ownMaterial(new THREE.MeshPhysicalMaterial({ color: "#aac4bf", transparent: true, opacity: .045, roughness: .18, metalness: .1, clearcoat: 1, depthWrite: false }));
    const glassPane = new THREE.Mesh(screenGeo, glass); glassPane.position.copy(screen.position); glassPane.position.z += .004; tv.add(glassPane);
    for (let i = 0; i < 2; i++) {
      const dial = new THREE.Mesh(ownGeometry(new THREE.CylinderGeometry(.027, .027, .024, 24)), metal); dial.rotation.x = Math.PI / 2; dial.position.set(.477, -.15 + i * .13, .454); tv.add(dial);
    }
    const led = new THREE.Mesh(sphere, ownMaterial(new THREE.MeshBasicMaterial({ color: "#ddab68" }))); led.scale.setScalar(.007); led.position.set(.48, -.27, .456); tv.add(led);
    for (let i = 0; i < 14; i++) box(tv, [.055, .007, .004], [.475, .08 + i * .013, .449], bezel, .001);
    box(tv, [.76, .57, .14], [0, -.01, -.43], bezel, .08);
    for (let i = 0; i < 12; i++) box(tv, [.57, .011, .006], [0, -.19 + i * .029, -.505], metal, .002);
    for (const x of [-.45, .45]) for (const y of [-.3, .3]) {
      const screw = new THREE.Mesh(sphere, metal); screw.scale.set(.012, .012, .004); screw.position.set(x, y, -.409); tv.add(screw);
    }
    // Start inside the lived view, then let the rear housing occlude that view.
    // This temporary portal faces backward; the actual front screen stays live.
    const rearViewMaterial = ownMaterial(new THREE.MeshBasicMaterial({
      map: target.texture, toneMapped: false, transparent: true, depthWrite: false,
    }));
    const rearView = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(.86, .575)), rearViewMaterial);
    rearView.position.set(-.047, .02, -.52);
    rearView.rotation.y = Math.PI;
    tv.add(rearView);

    // A hanging cable reinforces the physical silhouette from behind.
    const cablePath = new THREE.CatmullRomCurve3([new THREE.Vector3(.24, 1.85, -.43), new THREE.Vector3(.35, 1.37, -.6), new THREE.Vector3(.18, .45, -.62), new THREE.Vector3(.6, .035, -.8), new THREE.Vector3(1.1, .027, -.9)]);
    const cable = new THREE.Mesh(ownGeometry(new THREE.TubeGeometry(cablePath, 48, .012, 8, false)), bezel); cable.castShadow = true; scene.add(cable);

    const fieldMotes = new THREE.Group(); scene.add(fieldMotes);
    const moteMaterial = ownMaterial(new THREE.MeshBasicMaterial({ color: "#eee4cc", transparent: true, opacity: .5 }));
    for (let i = 0; i < 20; i++) {
      const mote = new THREE.Mesh(sphere, moteMaterial); mote.scale.setScalar(.009 + i % 3 * .004);
      mote.position.set(Math.sin(i * 3.7) * 3, .7 + (i % 7) * .5, Math.cos(i * 2.7) * 2); fieldMotes.add(mote);
    }
    const backdropStart = new THREE.Color("#bdb5a6"), galleryWhite = new THREE.Color("#f7f6f2"), floorStart = groundMat.color.clone();
    const detailLocations = [new THREE.Vector3(-.05, .8, 1.36), new THREE.Vector3(-1.8, 2.8, -3.5), new THREE.Vector3(.55, 1.08, .95)];
    const projected = new THREE.Vector3();
    let focusMessage = 0, focusWindow = 0, focusCup = 0;
    let width = 1, height = 1;
    const resize = () => {
      width = container.clientWidth; height = container.clientHeight;
      renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize); observer.observe(container); resize();
    let frame = 0, elapsed = 0, previous = performance.now(), rendered = false, shown = 0, orbitX = 0, orbitY = 0;
    let viewAngle = Math.PI;
    let inView = true;
    const visibility = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; }); visibility.observe(container);
    const look = new THREE.Vector3();
    const contextLost = (event: Event) => { event.preventDefault(); callbacks.current.onError(); };
    renderer.domElement.addEventListener("webglcontextlost", contextLost);
    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const dt = Math.min((now - previous) / 1000, .5); previous = now;
      if (!inView || document.hidden || renderer.getContext().isContextLost()) return;
      if (!motionPaused.current) elapsed += dt;
      const cameraProgress = cameraProgressAt(progress.current);
      shown = reduced.current ? cameraProgress : THREE.MathUtils.damp(shown, cameraProgress, 4.2, dt);
      const passage = phaseAt(progress.current);
      let reveal = smooth(.16, .37, shown);
      let turn = smooth(.45, .55, shown);
      if (reduced.current) { reveal = shown < .16 ? 0 : 1; turn = shown < .45 ? 0 : 1; }
      const allowOrbit = smooth(.38, .405, shown) * (1 - smooth(.55, .6, shown));
      const returnToRoom = reduced.current ? (passage === "attention" ? 1 : 0) : smooth(.56, .61, shown) * (1 - smooth(.735, .8, shown));
      const leave = reduced.current ? (shown >= .88 ? 1 : shown >= .75 ? .6 : 0) : smooth(.75, .88, shown);
      fieldMotes.visible = shown > .76;
      const openingFocus = attention.current === "message" || passage === "story" || passage === "sensation" ? 1 : 0;
      focusMessage = THREE.MathUtils.damp(focusMessage, openingFocus, 1.8, dt);
      focusWindow = THREE.MathUtils.damp(focusWindow, attention.current === "window" ? 1 : 0, 2.3, dt);
      focusCup = THREE.MathUtils.damp(focusCup, attention.current === "cup" ? 1 : 0, 2.3, dt);
      orbitX = reduced.current ? orbit.current.x : THREE.MathUtils.damp(orbitX, orbit.current.x, 3.7, dt);
      orbitY = reduced.current ? 0 : THREE.MathUtils.damp(orbitY, orbit.current.y, 3, dt);
      const targetAngle = Math.PI + Math.PI * (orbit.current.manual ? THREE.MathUtils.lerp(turn, orbitX, allowOrbit) : turn);
      viewAngle = reduced.current ? targetAngle : THREE.MathUtils.damp(viewAngle, targetAngle, 6, dt);
      const angle = viewAngle;
      rearViewMaterial.opacity = 1 - smooth(.18, .235, shown);
      rearView.visible = rearViewMaterial.opacity > .001;
      const mobile = width / height < .85;
      // Begin facing forward through the rear portal and retreat straight behind the figure.
      const halfFov = Math.tan(THREE.MathUtils.degToRad(19));
      const nearDistance = .49 + Math.min(.575 / (2 * halfFov), .86 / (2 * halfFov * camera.aspect)) * .88;
      const distanceReveal = reveal * (1 - returnToRoom);
      const radius = THREE.MathUtils.lerp(nearDistance, mobile ? 8.3 : 6.3, distanceReveal) + leave * (mobile ? 13 : 10);
      const aimY = THREE.MathUtils.lerp(2.15, 1.33, distanceReveal);
      camera.position.set(Math.sin(angle) * radius - .047 * (1 - distanceReveal), THREE.MathUtils.lerp(2.15, 2.6, distanceReveal) + orbitY * .65 * allowOrbit + leave * 1.2, Math.cos(angle) * radius);
      look.set(-.047 * (1 - distanceReveal), aimY - leave * 1.2, 0); camera.lookAt(look);
      const gallery = smooth(.77, .93, shown);
      (scene.background as THREE.Color).copy(backdropStart).lerp(galleryWhite, gallery);
      (scene.fog as THREE.Fog).color.copy(scene.background as THREE.Color);
      groundMat.color.copy(floorStart).lerp(galleryWhite, gallery);
      realityCamera.fov = 52 - focusMessage * 6 - focusCup * 3;
      realityCamera.lookAt(.2 - focusWindow * .5, 1.6 - focusMessage * .23 - focusCup * .12 + focusWindow * .13, -1.5 + focusMessage * .9);
      realityCamera.updateProjectionMatrix();
      phoneGlow.intensity = .08 + focusMessage * .65;
      // Keep the interpretation inside the movie when it becomes a smaller screen.
      thoughtMaterial.opacity = focusMessage * Math.max(smooth(.15, .18, shown) * (1 - smooth(.55, .61, shown)), smooth(.735, .79, shown));
      sun.intensity = 4.3 - focusMessage * .65 + focusWindow * .35;
      lampLight.intensity = 8 + focusCup * 4;
      realityCamera.updateMatrixWorld(); scene.updateMatrixWorld(); camera.updateMatrixWorld();
      if (passage === "inside" || passage === "attention") {
        const imagePlane = passage === "inside" ? rearView : screen;
        detailLocations.forEach((location, index) => {
          const element = anchors.current[index];
          if (!element) return;
          projected.copy(location).project(realityCamera);
          projected.set(projected.x * .43, projected.y * .2875, .04);
          imagePlane.localToWorld(projected); projected.project(camera);
          const x = THREE.MathUtils.clamp((projected.x * .5 + .5) * width, 65, width - 65);
          const y = THREE.MathUtils.clamp((-projected.y * .5 + .5) * height, height * .28, height * .76);
          element.style.left = `${x}px`; element.style.top = `${y}px`;
        });
      }
      renderer.domElement.dataset.cameraAngle = angle.toFixed(3);
      renderer.domElement.dataset.cameraRadius = radius.toFixed(3);
      renderer.domElement.dataset.progress = shown.toFixed(3);
      renderer.domElement.dataset.orbit = allowOrbit > .9 ? "enabled" : "disabled";
      renderer.domElement.dataset.phase = passage;
      renderer.domElement.dataset.attention = attention.current ?? "whole";
      renderer.domElement.dataset.attentionWeight = focusMessage.toFixed(3);
      renderer.domElement.dataset.gallery = gallery.toFixed(3);
      renderer.domElement.dataset.motionTime = elapsed.toFixed(2);
      if (!reduced.current && !motionPaused.current) {
        curtains.forEach((curtain, i) => { curtain.rotation.y = Math.sin(elapsed * .45 + i) * .018; });
        realityCamera.position.x = Math.sin(elapsed * .12) * .025;
        steam.children.forEach((wisp, i) => { wisp.position.y = 1.03 + ((elapsed * .09 + i * .07) % .4); wisp.position.x = .55 + Math.sin(elapsed * 1.2 + i) * .012; });
        fieldMotes.rotation.y = elapsed * .017;
        fieldMotes.position.y = Math.sin(elapsed * .2) * .06;
      }
      renderer.setRenderTarget(target); renderer.render(reality, realityCamera);
      renderer.setRenderTarget(null);
      if (passage === "rest") renderer.render(reality, realityCamera);
      else renderer.render(scene, camera);
      if (!rendered) { rendered = true; callbacks.current.onReady(); }
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame); observer.disconnect(); visibility.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", contextLost);
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose()); target.dispose();
      sun.shadow.dispose(); key.shadow.dispose();
      renderer.dispose(); renderer.domElement.remove();
    };
  }, [progress, orbit, reduced, attention, anchors, motionPaused]);

  return <div ref={host} style={{ width: "100%", height: "100%" }} />;
}
