import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { Sky, Stars } from '@react-three/drei';
import { ACESFilmicToneMapping } from 'three';
import { Player } from './Player';
import { Level } from './Level';
import { UI } from './UI';
import { useGameStore } from '../store';

export default function Game() {
  const isPlaying = useGameStore((state) => state.isPlaying);

  return (
    <div className="w-full h-screen bg-black relative">
      <Canvas
        shadows
        camera={{ position: [0, 5, 10], fov: 50 }}
        gl={{
          toneMapping: ACESFilmicToneMapping,
        }}
      >
        <color attach="background" args={['#101020']} />
        <fog attach="fog" args={['#101020', 10, 50]} />
        
        <ambientLight intensity={0.3} />
        <directionalLight
          position={[10, 10, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
        />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <Suspense fallback={null}>
          <group position={[0, -2, 0]}>
            <Player />
            <Level />
          </group>
        </Suspense>
      </Canvas>
      
      <UI />
    </div>
  );
}
