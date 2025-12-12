import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { PerspectiveCamera, ContactShadows, Environment } from '@react-three/drei';
import * as THREE from 'three';

interface PenguinProps {
  mood: number;   // 1-10
  energy: number; // 1-10
  sleep: number;  // 0-24
  className?: string;
  style?: React.CSSProperties;
}

const PenguinModel: React.FC<PenguinProps> = ({ mood, energy, sleep }) => {
  const group = useRef<THREE.Group>(null);
// ... (rest of PenguinModel remains exactly the same logic-wise, just need to ensure I don't cut it off)

  const bodyGroup = useRef<THREE.Group>(null); // Group for body and head to apply waddle
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);
  
  // Refs for Pupils to track mouse
  const leftPupilRef = useRef<THREE.Mesh>(null);
  const rightPupilRef = useRef<THREE.Mesh>(null);

  // Global Mouse Tracking
  const mousePos = useRef({ x: 0, y: 0 });

  React.useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      // Normalize mouse position (-1 to 1) based on window size
      // This ensures tracking works even outside the canvas
      mousePos.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  // Animation Logic
  useFrame((state) => {
    if (!group.current || !bodyGroup.current || !leftWingRef.current || !rightWingRef.current) return;

    const time = state.clock.getElapsedTime();
    // Use our global mouse tracker instead of state.mouse
    const mouseX = mousePos.current.x;
    const mouseY = mousePos.current.y;

    // PUPIL TRACKING
    // Limit the movement so pupils don't leave the eye
    const lookX = mouseX * 0.15; // Increased range slightly
    const lookY = mouseY * 0.15; 

    if (leftPupilRef.current) {
      leftPupilRef.current.position.x = lookX;
      leftPupilRef.current.position.y = lookY - 0.05; // Offset original Y
    }
    if (rightPupilRef.current) {
      rightPupilRef.current.position.x = lookX;
      rightPupilRef.current.position.y = lookY - 0.05; // Offset original Y
    }

    // SPEED: Determined by Energy (1 = slow, 10 = hyper)
    const speed = 0.5 + (energy / 3); 

    // BOUNCE: Determined by Mood
    const bounceHeight = 0.1 + (mood / 10); // Mood affects bounce height more directly
    group.current.position.y = Math.abs(Math.sin(time * speed * 4)) * bounceHeight - 0.5;

    // WADDLE: Side to side rotation based on movement
    bodyGroup.current.rotation.z = Math.sin(time * speed * 2) * 0.08; // Slower waddle

    // SPIN: High energy
    if (energy > 8) {
      group.current.rotation.y += 0.05 * (energy - 7);
    } else {
      // Gentle sway interaction
      group.current.rotation.y = Math.sin(time * 0.5) * 0.2;
    }

    // Wings
    const wingSpeed = speed * 6;
    leftWingRef.current.rotation.z = Math.sin(time * wingSpeed) * 0.4 + 0.6; // Flap range
    rightWingRef.current.rotation.z = -Math.sin(time * wingSpeed) * 0.4 - 0.6;
  });

  // Eyes: Sleep affects openness/tiredness. 
  // < 5 hours = Red eyes (tired).
  const eyeColor = sleep < 5 ? '#ef4444' : '#111827';
  // Eye Size: Mood affects how "wide" open they are (simple scaling)
  const eyeScale = 1 + (mood / 20); // Still a subtle effect, mood related

  return (
    <group ref={group} position={[0, -0.5, 0]}>
      <group ref={bodyGroup}>
        {/* Main Body (Egg Shape) - Black back */}
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.85, 32, 32]} />
          <meshStandardMaterial color="#1f2937" roughness={0.4} />
        </mesh>

        {/* Belly (White Patch) */}
        <mesh position={[0, -0.1, 0.45]}>
          <sphereGeometry args={[0.65, 32, 32]} />
          <meshStandardMaterial color="#f9fafb" roughness={0.5} />
        </mesh>

        {/* HEAD */}
        <mesh position={[0, 0.5, 0.2]} castShadow>
          <sphereGeometry args={[0.55, 32, 32]} /> {/* Slightly larger head */}
          <meshStandardMaterial color="#1f2937" roughness={0.4} />
        </mesh>

        {/* EYES - Big Anime Style with White Sclera */}
        {/* Left Eye */}
        <group position={[-0.3, 0.65, 0.6]}>
          <group scale={[eyeScale, eyeScale, eyeScale]}>
            {/* White Sclera (Eye White) - Flattened sphere */}
            <mesh scale={[1, 1.2, 0.6]}>
              <sphereGeometry args={[0.25, 32, 32]} />
              <meshStandardMaterial color="white" roughness={0.2} />
            </mesh>
            
            {/* Pupil/Iris (Black) - Slightly protruding */}
            <mesh ref={leftPupilRef} position={[0, -0.05, 0.12]} scale={[0.7, 0.7, 0.2]}>
               <sphereGeometry args={[0.18, 32, 32]} />
               <meshStandardMaterial color={eyeColor} roughness={0.1} metalness={0.1} />
            </mesh>

            {/* Main Shine (Highlight) */}
            <mesh position={[-0.08, 0.08, 0.16]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.8} />
            </mesh>
            
            {/* Secondary Shine (Small) */}
            <mesh position={[0.08, -0.08, 0.16]}>
              <sphereGeometry args={[0.03, 16, 16]} />
              <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.6} />
            </mesh>
          </group>
        </group>

        {/* Right Eye */}
        <group position={[0.3, 0.65, 0.6]}>
          <group scale={[eyeScale, eyeScale, eyeScale]}>
            {/* White Sclera (Eye White) - Flattened sphere */}
            <mesh scale={[1, 1.2, 0.6]}>
              <sphereGeometry args={[0.25, 32, 32]} />
              <meshStandardMaterial color="white" roughness={0.2} />
            </mesh>
            
            {/* Pupil/Iris (Black) - Slightly protruding */}
            <mesh ref={rightPupilRef} position={[0, -0.05, 0.12]} scale={[0.7, 0.7, 0.2]}>
               <sphereGeometry args={[0.18, 32, 32]} />
               <meshStandardMaterial color={eyeColor} roughness={0.1} metalness={0.1} />
            </mesh>

            {/* Main Shine (Highlight) */}
            <mesh position={[-0.08, 0.08, 0.16]}>
              <sphereGeometry args={[0.06, 16, 16]} />
              <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.8} />
            </mesh>
            
            {/* Secondary Shine (Small) */}
            <mesh position={[0.08, -0.08, 0.16]}>
              <sphereGeometry args={[0.03, 16, 16]} />
              <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.6} />
            </mesh>
          </group>
        </group>

        {/* BEAK - Position and Rotation adjusted for forward visibility */}
        <mesh position={[0, 0.45, 0.75]} rotation={[-0.2, 0, 0]} castShadow> {/* More forward, slightly down */}
          <coneGeometry args={[0.18, 0.3, 32]} /> {/* Wider beak */}
          <meshStandardMaterial color="#f59e0b" roughness={0.3} />
        </mesh>
      </group> {/* End bodyGroup */}

      {/* WINGS */}
      <mesh ref={leftWingRef} position={[-0.7, 0, 0.1]} rotation={[0, 0, 0.5]}>
        <capsuleGeometry args={[0.15, 0.8, 4, 8]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh ref={rightWingRef} position={[0.7, 0, 0.1]} rotation={[0, 0, -0.5]}>
        <capsuleGeometry args={[0.15, 0.8, 4, 8]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>

      {/* FEET */}
      <mesh position={[-0.4, -0.75, 0.3]} rotation={[-0.2, -0.3, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
      <mesh position={[0.4, -0.75, 0.3]} rotation={[-0.2, 0.3, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color="#f59e0b" />
      </mesh>
    </group>
  );
};

const Penguin3D: React.FC<PenguinProps> = ({ mood, energy, sleep, className, style }) => {
  return (
    <div 
      className={className}
      style={{ 
        width: '100%', 
        height: '350px', 
        borderRadius: '1rem', 
        overflow: 'hidden', 
        background: 'radial-gradient(circle at center, #e0f2fe 0%, #bae6fd 100%)', 
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)', 
        ...style 
      }}
    >
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[0, 0, 4.5]} fov={45} />
        <ambientLight intensity={0.8} />
        <spotLight 
          position={[5, 10, 7]} 
          angle={0.5} 
          penumbra={1} 
          intensity={1.2} 
          castShadow 
        />
        <PenguinModel {...props} />
        <ContactShadows position={[0, -1.2, 0]} opacity={0.4} scale={10} blur={2} far={1} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
};

export default Penguin3D;
