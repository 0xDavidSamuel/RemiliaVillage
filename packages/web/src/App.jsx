import { useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { DEFAULT_CAMERA_POSITION } from "./components/CameraManager";
import { Experience } from "./components/Experience";
import { UI } from "./components/UI";
import { usePlayerStore } from "./store";

function App() {
  const initialize = usePlayerStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="flex flex-col md:flex-row h-screen bg-[#130f30] overflow-hidden">
      {/* 3D Canvas */}
      <div className="flex-1 min-h-[50vh] md:min-h-0 relative">
        <Canvas
          camera={{
            position: DEFAULT_CAMERA_POSITION,
            fov: 45,
          }}
          gl={{
            preserveDrawingBuffer: true,
          }}
          shadows
        >
          <color attach="background" args={["#130f30"]} />
          <fog attach="fog" args={["#130f30", 10, 40]} />
          <group position-y={-1}>
            <Experience />
          </group>
        </Canvas>
      </div>
      {/* UI Panel */}
      <UI />
    </div>
  );
}

export default App;
