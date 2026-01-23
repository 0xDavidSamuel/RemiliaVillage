import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { Suspense, useEffect, useRef } from "react";
import { GLTFExporter } from "three-stdlib";
import { usePlayerStore } from "../store";
import { Asset } from "./Asset";

export function Player(props) {
  const group = useRef();
  const mode = usePlayerStore((state) => state.mode);
  const selectedPlayer = usePlayerStore((state) => state.selectedPlayer);
  const customization = usePlayerStore((state) => state.customization);
  const skin = usePlayerStore((state) => state.skin);
  const setDownload = usePlayerStore((state) => state.setDownload);

  // Load model based on mode
  const modelPath = mode === 'demo' 
    ? (selectedPlayer?.model || "/models/mascot-v1.glb")
    : "/models/milady.glb";
    
  const { nodes, materials } = useGLTF(modelPath);
  const { animations } = useFBX("/models/Idle.fbx");
  const { actions } = useAnimations(animations, group);

  // Download GLB
  useEffect(() => {
    function download() {
      const exporter = new GLTFExporter();
      exporter.parse(
        group.current,
        function (result) {
          const blob = new Blob([result], { type: "application/octet-stream" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `player_${Date.now()}.glb`;
          link.click();
        },
        function (error) {
          console.error(error);
        },
        { binary: true }
      );
    }
    setDownload(download);
  }, [setDownload]);

// Play idle animation
useEffect(() => {
  const actionNames = Object.keys(actions);
  if (actionNames.length > 0 && actions[actionNames[0]]) {
    actions[actionNames[0]].play();
  }
}, [actions]);

// Debug customization
useEffect(() => {
  console.log("[Player] Customization:", customization);
  Object.entries(customization).forEach(([name, data]) => {
    console.log(`[Player] ${name}:`, data.asset?.model);
  });
}, [customization]);

  // Find skinned meshes
  const skinnedMeshes = Object.values(nodes).filter((n) => n.isSkinnedMesh);

  if (skinnedMeshes.length === 0) {
    console.warn("[Player] No skinned meshes found");
    return null;
  }

  // Get the skeleton from the first skinned mesh
  const skeleton = skinnedMeshes[0].skeleton;

  // Helper to determine if mesh should use skin material
  const shouldUseSkin = (meshName) => {
    const name = meshName.toLowerCase();
    return name.includes('body') || name.includes('skin') || name.includes('mesh10');
  };

  // Find root bone (supports both UE and Mixamo naming)
  const rootBone = nodes.pelvis || nodes.mixamorigHips || nodes['mixamorig:Hips'];

  if (!rootBone) {
    console.warn("[Player] No root bone found");
    return null;
  }

  return (
    <group {...props} scale={0.01}>
      <group ref={group} dispose={null}>
        <group name="Scene">
          <group name="Armature" scale={0.01}>
            {/* Base model meshes */}
            {skinnedMeshes.map((mesh) => (
              <skinnedMesh
                key={mesh.name}
                name={mesh.name}
                geometry={mesh.geometry}
                material={mode === 'creator' && shouldUseSkin(mesh.name) ? skin : mesh.material}
                skeleton={mesh.skeleton}
              />
            ))}
            
            {/* Trait assets (creator mode only) */}
            {mode === 'creator' && Object.entries(customization).map(([categoryName, data]) => {
              const assetUrl = data.asset?.model;
              if (!assetUrl) return null;
              
              return (
                <Suspense key={`${categoryName}-${data.asset?.id}`} fallback={null}>
                  <Asset
                    categoryName={categoryName}
                    url={assetUrl}
                    skeleton={skeleton}
                  />
                </Suspense>
              );
            })}
            
            <primitive object={rootBone} />
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/models/mascot-v1.glb");
useGLTF.preload("/models/milady.glb");