import { useFrame, useThree } from '@react-three/fiber';
import { useRef, useState, useEffect } from 'react';
import { Vector3, Group } from 'three';
import { useGameStore, Entity } from '../store';
// import { useGLTF } from '@react-three/drei'; // Uncomment to load GLB models

/*
  NOTE: To use your custom GLB models:
  1. Place your assets in the public folder (e.g., /public/SpaceShip Images/)
  2. Uncomment the useGLTF import above
  3. Load the model: const { scene } = useGLTF('/SpaceShip Images/astronautA.glb')
  4. Replace the <mesh>...</mesh> placeholder below with <primitive object={scene} />
*/

// Constants
const GRAVITY = 30;
const JUMP_FORCE = 14;
const MOVE_SPEED = 8;
const PLAYER_SIZE = { width: 0.8, height: 1.6, depth: 0.8 };

// AABB Collision Helper
function checkCollision(pos1: Vector3, size1: {width: number, height: number, depth: number}, pos2: Vector3, size2: {width: number, height: number, depth: number}) {
  return (
    Math.abs(pos1.x - pos2.x) < (size1.width + size2.width) / 2 &&
    Math.abs(pos1.y - pos2.y) < (size1.height + size2.height) / 2 &&
    Math.abs(pos1.z - pos2.z) < (size1.depth + size2.depth) / 2
  );
}

export function Player() {
  const ref = useRef<Group>(null);
  const [velocity, setVelocity] = useState(new Vector3(0, 0, 0));
  const [isGrounded, setIsGrounded] = useState(false);
  const { camera } = useThree();
  const isPlaying = useGameStore((state) => state.isPlaying);
  const endGame = useGameStore((state) => state.endGame);
  const entities = useGameStore((state) => state.entities);
  const removeEntity = useGameStore((state) => state.removeEntity);
  const addScore = useGameStore((state) => state.addScore);
  const speedMultiplier = useGameStore((state) => state.speedMultiplier);

  // Input state
  const [keys, setKeys] = useState({ left: false, right: false, jump: false });

  // Keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') setKeys(k => ({ ...k, left: true }));
      if (e.code === 'ArrowRight' || e.code === 'KeyD') setKeys(k => ({ ...k, right: true }));
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') setKeys(k => ({ ...k, jump: true }));
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') setKeys(k => ({ ...k, left: false }));
      if (e.code === 'ArrowRight' || e.code === 'KeyD') setKeys(k => ({ ...k, right: false }));
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') setKeys(k => ({ ...k, jump: false }));
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Touch controls
  useEffect(() => {
    (window as any).setPlayerInput = (input: { left?: boolean; right?: boolean; jump?: boolean }) => {
      setKeys(prev => ({ ...prev, ...input }));
    };
    return () => {
      delete (window as any).setPlayerInput;
    };
  }, []);

  useFrame((state, delta) => {
    if (!isPlaying || !ref.current) return;

    const currentPos = ref.current.position.clone();
    let newVelocity = velocity.clone();

    // Horizontal movement
    const currentSpeed = MOVE_SPEED * speedMultiplier;
    if (keys.left) newVelocity.x = -currentSpeed;
    else if (keys.right) newVelocity.x = currentSpeed;
    else newVelocity.x = 0;

    // Jumping
    if (keys.jump && isGrounded) {
      newVelocity.y = JUMP_FORCE;
      setIsGrounded(false);
    }

    // Gravity
    newVelocity.y -= GRAVITY * delta;

    // Apply movement
    const displacement = newVelocity.clone().multiplyScalar(delta);
    const nextPos = currentPos.clone().add(displacement);

    // --- COLLISION DETECTION ---
    let groundedOnPlatform = false;

    // Check entities
    entities.forEach(entity => {
      if (!entity.active) return;

      if (checkCollision(nextPos, PLAYER_SIZE, entity.position, { width: entity.width, height: entity.height, depth: entity.depth })) {
        
        if (entity.type === 'platform') {
          // Only land on platform if falling and was previously above it
          // Tolerance of 0.5 for "previously above"
          if (velocity.y <= 0 && currentPos.y >= entity.position.y + entity.height / 2) {
            nextPos.y = entity.position.y + entity.height / 2 + PLAYER_SIZE.height / 2;
            newVelocity.y = 0;
            groundedOnPlatform = true;
          }
        } else if (entity.type === 'enemy') {
          // Stomp check: falling and above enemy
          if (velocity.y < 0 && currentPos.y > entity.position.y + entity.height / 2) {
            // Stomp success
            removeEntity(entity.id);
            addScore(100);
            newVelocity.y = JUMP_FORCE * 0.8; // Bounce off enemy
            
            // Spawn burst of coins
            for (let i = 0; i < 5; i++) {
              // We need to import uuidv4 or use a simple random id generator here.
              // Since we can't easily import uuidv4 in this file without adding it to imports,
              // let's just use Math.random for now or pass a generator.
              // Actually, let's just use a simple string id.
              const coinId = `coin-burst-${Date.now()}-${i}`;
              // We need to access addEntity from store
              useGameStore.getState().addEntity({
                id: coinId,
                type: 'coin',
                position: entity.position.clone(),
                width: 0.3,
                height: 0.3,
                depth: 0.1,
                active: true,
                velocity: new Vector3(
                  (Math.random() - 0.5) * 10,
                  5 + Math.random() * 5,
                  (Math.random() - 0.5) * 2
                )
              });
            }
          } else {
            // Hit from side/bottom -> Game Over
            endGame();
          }
        } else if (entity.type === 'barrel') {
          endGame();
        } else if (entity.type === 'coin') {
          removeEntity(entity.id);
          addScore(10);
        }
      }
    });

    // Ground Collision (y = 0 is ground level)
    // Ground is at y = -0.5 with height 1, so top is at 0
    if (nextPos.y <= PLAYER_SIZE.height / 2) {
      nextPos.y = PLAYER_SIZE.height / 2;
      newVelocity.y = 0;
      setIsGrounded(true);
    } else {
      setIsGrounded(groundedOnPlatform);
    }

    // Update position
    ref.current.position.copy(nextPos);
    setVelocity(newVelocity);

    // Camera follow
    const targetCamPos = new Vector3(nextPos.x, nextPos.y + 3, nextPos.z + 12);
    camera.position.lerp(targetCamPos, 0.1);
    camera.lookAt(nextPos.x, nextPos.y, nextPos.z);

    // Check bounds (fall off map)
    if (nextPos.y < -10) {
      endGame();
    }
  });

  return (
    <group ref={ref} position={[0, 1, 0]}>
      {/* Placeholder for Astronaut Model */}
      <mesh castShadow receiveShadow>
        <capsuleGeometry args={[0.4, 0.8, 4, 8]} />
        <meshStandardMaterial color="white" roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Visor */}
      <mesh position={[0, 0.3, 0.35]}>
        <boxGeometry args={[0.5, 0.3, 0.2]} />
        <meshStandardMaterial color="#333" roughness={0.2} metalness={0.8} />
      </mesh>
    </group>
  );
}
