import { ContactShadows, Environment } from "@react-three/drei";
import { Player } from "./Player";
import { CameraManager } from "./CameraManager";

export function Experience() {
  return (
    <>
      <CameraManager />
      <Environment preset="sunset" />
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.5}
        scale={10}
        blur={1.5}
        far={1}
      />
      <Player position={[0, 0, 0]} />
    </>
  );
}
