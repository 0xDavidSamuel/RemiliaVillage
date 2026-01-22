import { ContactShadows, Environment } from "@react-three/drei";
import { Player } from "./Player";
import { CameraManager } from "./CameraManager";
import { usePlayerStore } from "../store";

export function Experience() {
  const mode = usePlayerStore((state) => state.mode);
  const selectedPlayer = usePlayerStore((state) => state.selectedPlayer);
  const customization = usePlayerStore((state) => state.customization);
  
  // Create a key that changes when mode, player, or customization changes
  const customizationKey = mode === 'creator' 
    ? JSON.stringify(customization)
    : selectedPlayer?.id;

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
      <Player key={`${mode}-${customizationKey}`} position={[0, 0, 0]} />
    </>
  );
}
