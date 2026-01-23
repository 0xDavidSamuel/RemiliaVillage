import { useGLTF } from "@react-three/drei";
import { useEffect } from "react";

export function Asset({ url, skeleton, categoryName }) {
  const { nodes } = useGLTF(url);

  useEffect(() => {
    console.log(`[Asset] Loaded ${categoryName}:`, url, Object.keys(nodes));
  }, [nodes, url, categoryName]);

  const skinnedMeshes = Object.values(nodes).filter((n) => n.isSkinnedMesh);

  if (skinnedMeshes.length === 0) {
    console.warn(`[Asset] No skinned meshes in ${categoryName}`);
    return null;
  }

  return (
    <>
      {skinnedMeshes.map((mesh) => (
        <skinnedMesh
          key={mesh.name}
          name={mesh.name}
          geometry={mesh.geometry}
          material={mesh.material}
          skeleton={skeleton}
        />
      ))}
    </>
  );
}