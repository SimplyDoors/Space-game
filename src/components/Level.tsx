import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useEffect } from 'react';
import { Vector3, Group } from 'three';
import { useGameStore, Entity } from '../store';
import { v4 as uuidv4 } from 'uuid';
// import { useGLTF } from '@react-three/drei'; // Uncomment to load GLB models

/*
  NOTE: To use your custom GLB models for enemies/platforms:
  1. Uncomment useGLTF import
  2. Load models: const alien = useGLTF('/SpaceShip Images/alien.glb')
  3. Clone the scene for each entity: <primitive object={alien.scene.clone()} />
*/

// Constants
const SPAWN_DISTANCE = 40;
const DESPAWN_DISTANCE = 20;
const CHUNK_SIZE = 20;

export function Level() {
  const lastSpawnX = useRef(0);
  const isPlaying = useGameStore((state) => state.isPlaying);
  const addEntity = useGameStore((state) => state.addEntity);
  const entities = useGameStore((state) => state.entities);
  const removeEntity = useGameStore((state) => state.removeEntity);
  const clearEntities = useGameStore((state) => state.clearEntities);

  // Cleanup on unmount or reset
  useEffect(() => {
    if (!isPlaying) {
      clearEntities();
      lastSpawnX.current = 0;
    }
  }, [isPlaying, clearEntities]);

  useFrame(({ camera }, delta) => {
    if (!isPlaying) return;

    const currentX = camera.position.x;

    // Spawn new entities
    if (currentX + SPAWN_DISTANCE > lastSpawnX.current) {
      spawnChunk(lastSpawnX.current + CHUNK_SIZE);
      lastSpawnX.current += CHUNK_SIZE;
    }

    // Update entities (physics for coins)
    entities.forEach(e => {
      // Cleanup old entities
      if (e.position.x < currentX - DESPAWN_DISTANCE) {
        removeEntity(e.id);
        return;
      }

      // Coin physics
      if (e.type === 'coin' && e.velocity) {
        // Apply gravity
        e.velocity.y -= 20 * delta;
        
        // Apply velocity
        e.position.add(e.velocity.clone().multiplyScalar(delta));

        // Bounce off ground
        if (e.position.y < 0.5) {
          e.position.y = 0.5;
          e.velocity.y *= -0.6; // Bounce with damping
          e.velocity.x *= 0.9; // Friction
        }
      }
    });
  });

  const spawnChunk = (startX: number) => {
    // Randomly spawn platforms
    if (Math.random() > 0.3) {
      const height = 1.5 + Math.random() * 2;
      addEntity({
        id: uuidv4(),
        type: 'platform',
        position: new Vector3(startX + Math.random() * 10, height, 0),
        width: 3,
        height: 0.5,
        depth: 1,
        active: true
      });
    }

    // Randomly spawn enemies
    if (Math.random() > 0.5) {
      addEntity({
        id: uuidv4(),
        type: 'enemy',
        position: new Vector3(startX + Math.random() * 15, 0.5, 0),
        width: 0.8,
        height: 0.8,
        depth: 0.8,
        active: true
      });
    }

    // Randomly spawn barrels
    if (Math.random() > 0.7) {
      addEntity({
        id: uuidv4(),
        type: 'barrel',
        position: new Vector3(startX + Math.random() * 15, 0.5, 0),
        width: 0.8,
        height: 1,
        depth: 0.8,
        active: true
      });
    }
    
    // Randomly spawn coins
    if (Math.random() > 0.4) {
      addEntity({
        id: uuidv4(),
        type: 'coin',
        position: new Vector3(startX + Math.random() * 15, 2 + Math.random() * 3, 0),
        width: 0.5,
        height: 0.5,
        depth: 0.1,
        active: true
      });
    }
  };

  return (
    <group>
      <Ground />
      {entities.map(entity => (
        <GameEntity key={entity.id} entity={entity} />
      ))}
    </group>
  );
}

function Ground() {
  const { camera } = useThree();
  const ref = useRef<Group>(null);
  
  // Create static ground segments
  const segments = useMemo(() => [-20, 0, 20, 40, 60], []);

  useFrame(() => {
    if (ref.current) {
      // Snap ground to grid to prevent jitter, but follow camera
      const snapX = Math.floor(camera.position.x / 20) * 20;
      ref.current.position.x = snapX;
    }
  });

  return (
    <group ref={ref}>
      {segments.map(offset => (
        <mesh key={offset} position={[offset, -0.5, 0]} receiveShadow>
          <boxGeometry args={[20, 1, 4]} />
          <meshStandardMaterial color="#888899" roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

function GameEntity({ entity }: { entity: Entity }) {
  const ref = useRef<Group>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.position.copy(entity.position);
      if (entity.type === 'coin') {
        ref.current.rotation.y += 0.05;
      }
    }
  });

  if (entity.type === 'platform') {
    return (
      <group ref={ref} position={entity.position}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[entity.width, entity.height, entity.depth]} />
          <meshStandardMaterial color="#44aaff" />
        </mesh>
      </group>
    );
  }
  
  if (entity.type === 'enemy') {
    return (
      <group ref={ref} position={entity.position}>
        <mesh castShadow>
          <sphereGeometry args={[entity.width / 2]} />
          <meshStandardMaterial color="#ff4444" />
        </mesh>
        {/* Eyes */}
        <mesh position={[0.15, 0.1, 0.3]}>
          <sphereGeometry args={[0.08]} />
          <meshStandardMaterial color="white" />
        </mesh>
        <mesh position={[-0.15, 0.1, 0.3]}>
          <sphereGeometry args={[0.08]} />
          <meshStandardMaterial color="white" />
        </mesh>
      </group>
    );
  }

  if (entity.type === 'barrel') {
    return (
      <group ref={ref} position={entity.position}>
        <mesh castShadow>
          <cylinderGeometry args={[entity.width / 2, entity.width / 2, entity.height]} />
          <meshStandardMaterial color="#aa6622" />
        </mesh>
      </group>
    );
  }
  
  if (entity.type === 'coin') {
    return (
      <group ref={ref} position={entity.position}>
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
          <meshStandardMaterial color="#ffd700" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>
    );
  }

  return null;
}
