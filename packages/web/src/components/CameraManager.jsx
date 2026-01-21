import { CameraControls } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { usePlayerStore } from "../store";

export const START_CAMERA_POSITION = [500, 10, 1000];
export const DEFAULT_CAMERA_POSITION = [-1, 1, 5];
export const DEFAULT_CAMERA_TARGET = [0, 0, 0];

export const CameraManager = ({ loading }) => {
  const controls = useRef();
  const initialLoading = usePlayerStore((state) => state.loading);

  // ============================================================================
  // DEMO MODE - Simple camera, no category-based positioning
  // ============================================================================

  useEffect(() => {
    if (initialLoading) {
      controls.current.setLookAt(
        ...START_CAMERA_POSITION,
        ...DEFAULT_CAMERA_TARGET
      );
    } else {
      controls.current.setLookAt(
        ...DEFAULT_CAMERA_POSITION,
        ...DEFAULT_CAMERA_TARGET,
        true
      );
    }
  }, [initialLoading, loading]);

  // ============================================================================
  // FULL CREATOR MODE - Uncomment for v1.0
  // ============================================================================

  /*
  const currentCategory = usePlayerStore((state) => state.currentCategory);

  useEffect(() => {
    if (initialLoading) {
      controls.current.setLookAt(
        ...START_CAMERA_POSITION,
        ...DEFAULT_CAMERA_TARGET
      );
    } else if (!loading && currentCategory?.cameraPlacement) {
      controls.current.setLookAt(
        ...currentCategory.cameraPlacement.position,
        ...currentCategory.cameraPlacement.target,
        true
      );
    } else {
      controls.current.setLookAt(
        ...DEFAULT_CAMERA_POSITION,
        ...DEFAULT_CAMERA_TARGET,
        true
      );
    }
  }, [currentCategory, initialLoading, loading]);
  */

  return (
    <CameraControls
      ref={controls}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI / 2}
      minDistance={2}
      maxDistance={8}
    />
  );
};
