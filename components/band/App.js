'use client';
import './index.css';
import * as THREE from 'three';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, extend, useThree, useFrame } from '@react-three/fiber';
import { useGLTF, Environment, Lightformer } from '@react-three/drei';
import { BallCollider, CuboidCollider, Physics, RigidBody, useRopeJoint, useSphericalJoint } from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';
  



extend({ MeshLineGeometry, MeshLineMaterial });


const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
const GLTF_PATH = `${BASE_PATH}/assets/kartu.glb`;

useGLTF.preload(GLTF_PATH);

export default function App() {
  return (
    <div className="responsive-wrapper">
      <Canvas camera={{ position: [0, 0, 13], fov: 25 }}>
        <ambientLight intensity={Math.PI} />
        <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
          <Band />
        </Physics>
        <Environment background blur={0.75}>
          <color attach="background" args={['black']} />
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Canvas>
    </div>
  );
}
function useInviteCardTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 900;
    canvas.height = 1260;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    // only the left half of this texture lands on the visible card face
    const cw = w / 2;

    // the card mesh samples this texture with V flipped; pre-flip so our content reads upright
    ctx.translate(0, h);
    ctx.scale(1, -1);

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, cw, h);

    const glow = ctx.createRadialGradient(cw * 0.5, h * 0.5, 10, cw * 0.5, h * 0.5, cw * 1.1);
    glow.addColorStop(0, 'rgba(255,255,255,0.12)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, cw, h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 62px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.fillText('ECCO IL', cw / 2, h * 0.475);
    ctx.fillText('TUO INVITO', cw / 2, h * 0.545);

    const tex = new THREE.CanvasTexture(canvas);
    tex.anisotropy = 16;
    tex.needsUpdate = true;
    return tex;
  }, []);
}

function useBandTexture() {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 60px system-ui, -apple-system, "Segoe UI", Roboto, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DJ SET', canvas.width / 2, canvas.height / 2 + 4);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.needsUpdate = true;
    return tex;
  }, []);
}

function Band({ maxSpeed = 50, minSpeed = 10 }) {
  const band = useRef(), fixed = useRef(), j1 = useRef(), j2 = useRef(), j3 = useRef(), card = useRef(); // prettier-ignore
  const vec = new THREE.Vector3(), ang = new THREE.Vector3(), rot = new THREE.Vector3(), dir = new THREE.Vector3(); // prettier-ignore
  const segmentProps = { type: 'dynamic', canSleep: true, colliders: false, angularDamping: 4, linearDamping: 4 };
  const { nodes, materials } = useGLTF(GLTF_PATH);
  const bandTexture = useBandTexture();
  const inviteTexture = useInviteCardTexture();
  const { width, height } = useThree((state) => state.size);
  const [curve] = useState(() => new THREE.CatmullRomCurve3([new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()]));
  const [dragged, drag] = useState(false);
  const [hovered, hover] = useState(false);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], 1]); // prettier-ignore
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], 1]); // prettier-ignore
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], 1]); // prettier-ignore
  useSphericalJoint(j3, card, [[0, 0, 0], [0, 1.45, 0]]); // prettier-ignore

  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = dragged ? 'grabbing' : 'grab';
      return () => void (document.body.style.cursor = 'auto');
    }
  }, [hovered, dragged]);

  useFrame((state, delta) => {
    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({ x: vec.x - dragged.x, y: vec.y - dragged.y, z: vec.z - dragged.z });
    }
    if (fixed.current) {
      [j1, j2].forEach((ref) => {
        if (!ref.current.lerped) ref.current.lerped = new THREE.Vector3().copy(ref.current.translation());
        const clampedDistance = Math.max(0.1, Math.min(1, ref.current.lerped.distanceTo(ref.current.translation())));
        ref.current.lerped.lerp(ref.current.translation(), delta * (minSpeed + clampedDistance * (maxSpeed - minSpeed)));
      });
      curve.points[0].copy(j3.current.translation());
      curve.points[1].copy(j2.current.lerped);
      curve.points[2].copy(j1.current.lerped);
      curve.points[3].copy(fixed.current.translation());
      band.current.geometry.setPoints(curve.getPoints(32));
      ang.copy(card.current.angvel());
      rot.copy(card.current.rotation());
      card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z });
    }
  });

  curve.curveType = 'chordal';

  return (
    <>
       <group position={[0, 4, 0]}>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[0.5, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[1.5, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[2, 0, 0]} ref={card} {...segmentProps} type={dragged ? 'kinematicPosition' : 'dynamic'}>
          <CuboidCollider args={[0.8, 1.125, 0.01]} />
          <group
            scale={2.25}
            position={[0, -1.2, -0.05]}
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerUp={(e) => (e.target.releasePointerCapture(e.pointerId), drag(false))}
            onPointerDown={(e) => (e.target.setPointerCapture(e.pointerId), drag(new THREE.Vector3().copy(e.point).sub(vec.copy(card.current.translation()))))}>
            <mesh geometry={nodes.card.geometry}>
              <meshPhysicalMaterial map={inviteTexture} map-anisotropy={16} clearcoat={1} clearcoatRoughness={0.15} roughness={0.3} metalness={0.5} />
            </mesh>
            <mesh geometry={nodes.clip.geometry} material={materials.metal} material-roughness={0.3} />
            <mesh geometry={nodes.clamp.geometry} material={materials.metal} />
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial color="white" depthTest={false} resolution={[width, height]} useMap map={bandTexture} repeat={[-4, 1]} lineWidth={1} />
      </mesh>
      
    </>
  );
}