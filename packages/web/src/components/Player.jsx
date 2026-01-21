import { useAnimations, useFBX, useGLTF } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { GLTFExporter } from "three-stdlib";
import { usePlayerStore } from "../store";

// ============================================================================
// DEMO MODE - Load selected mascot GLB directly
// ============================================================================

export function Player(props) {
  const group = useRef();
  const selectedPlayer = usePlayerStore((state) => state.selectedPlayer);
  const setDownload = usePlayerStore((state) => state.setDownload);

  // Load selected mascot model (or default)
  const modelPath = selectedPlayer?.model || "/models/mascot-v1.glb";
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
          link.download = `player_${selectedPlayer?.name || "avatar"}_${Date.now()}.glb`;
          link.click();
        },
        function (error) {
          console.error(error);
        },
        { binary: true }
      );
    }
    setDownload(download);
  }, [setDownload, selectedPlayer]);

  // Play idle animation
  useEffect(() => {
    actions["mixamo.com"]?.play();
  }, [actions]);

  // Debug: log nodes and materials
  useEffect(() => {
    console.log("[Player] Model:", modelPath);
    console.log("[Player] Nodes:", Object.keys(nodes));
    console.log("[Player] Materials:", Object.keys(materials));
  }, [nodes, materials, modelPath]);

  // Find ALL skinned meshes in the model
  const skinnedMeshes = Object.values(nodes).filter(n => n.isSkinnedMesh);

  if (skinnedMeshes.length === 0) {
    console.warn("[Player] No skinned meshes found in model");
    return null;
  }

  return (
    <group {...props}>
      <group ref={group} dispose={null}>
        <group name="Scene">
          <group name="Armature" scale={0.01}>
            {skinnedMeshes.map((mesh) => (
              <skinnedMesh
                key={mesh.name}
                name={mesh.name}
                geometry={mesh.geometry}
                material={mesh.material}
                skeleton={mesh.skeleton}
              />
            ))}
            <primitive object={nodes.mixamorigHips} />
          </group>
        </group>
      </group>
    </group>
  );
}

// Preload default mascot
useGLTF.preload("/models/mascot-v1.glb");

// ============================================================================
// FULL CREATOR MODE - Uncomment for v1.0
// ============================================================================

/*
import { Suspense } from "react";
import { Asset } from "./Asset";

export function Player(props) {
  const group = useRef();
  const { nodes, materials } = useGLTF("/models/milady.glb");
  const { animations } = useFBX("/models/Idle.fbx");
  const customization = usePlayerStore((state) => state.customization);
  const setDownload = usePlayerStore((state) => state.setDownload);
  const getAssetUrl = usePlayerStore((state) => state.getAssetUrl);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    function download() {
      const exporter = new GLTFExporter();
      exporter.parse(
        group.current,
        function (result) {
          const blob = new Blob([result], { type: "application/octet-stream" });
          const link = document.createElement("a");
          link.href = URL.createObjectURL(blob);
          link.download = `avatar_${Date.now()}.glb`;
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

  useEffect(() => {
    actions["mixamo.com"]?.play();
  }, [actions]);

  useEffect(() => {
    console.log("Materials:", Object.keys(materials));
  }, [materials]);

  return (
    <group {...props}>
      <group ref={group} dispose={null}>
        <group name="Scene">
          <group name="Armature" scale={0.01}>
            <skinnedMesh
              name="Mesh10"
              geometry={nodes.Mesh10.geometry}
              material={nodes.Mesh10.material}
              skeleton={nodes.Mesh10.skeleton}
            />
            <primitive object={nodes.mixamorigHips} />
            {Object.keys(customization).map((key) => {
              const asset = customization[key]?.asset;
              const assetUrl = asset?.model;
              if (!assetUrl) return null;
              const finalUrl = getAssetUrl(assetUrl);
              return (
                <Suspense key={`${key}-${asset.id}`} fallback={null}>
                  <Asset
                    categoryName={key}
                    url={finalUrl}
                    skeleton={nodes.Mesh10.skeleton}
                  />
                </Suspense>
              );
            })}
          </group>
        </group>
      </group>
    </group>
  );
}

useGLTF.preload("/models/milady.glb");
*/