"use client"

import Header from "@/components/header"
import { Progress } from "@/components/ui/progress"
import { Engine, EngineStats, Quat } from "reze-engine"
import { useCallback, useEffect, useRef, useState } from "react"

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<Engine | null>(null)
  const [engineError, setEngineError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<EngineStats>({
    fps: 0,
    frameTime: 0,
    gpuMemory: 0,
  })
  const [progress, setProgress] = useState(0)
  const [inVr, setInVr] = useState(false)

  const initEngine = useCallback(
    async (xr: boolean) => {
      if (canvasRef.current) {
        // Initialize engine
        try {
          const engine = new Engine(canvasRef.current)
          engineRef.current = engine
          await engine.init(xr)
          await engine.loadModel("/models/塞尔凯特/塞尔凯特.pmx")
          setLoading(false)

          if (xr) {
            engine.runRenderLoopXR(() => {
              setStats(engine.getStats())
            })
          } else {
            engine.runRenderLoop(() => {
              setStats(engine.getStats())
            })
          }

          engine.rotateBones(
            ["腰", "首", "右腕", "左腕", "右ひざ"],
          [
            new Quat(-0.4, -0.3, 0, 1),
            new Quat(0.3, -0.3, -0.3, 1),
            new Quat(0.3, 0.3, 0.3, 1),
            new Quat(-0.3, 0.3, -0.3, 1),
            new Quat(-1.0, -0.3, 0.0, 1),
          ],
          1500
        )
      } catch (error) {
        setEngineError(error instanceof Error ? error.message : "Unknown error")
      }
    }
  },
  []
)

useEffect(() => {
  void (async () => {
    await initEngine(inVr)
  })()

  // Cleanup on unmount
  return () => {
    if (engineRef.current) {
      engineRef.current.dispose()
    }
  }
}, [initEngine, inVr])

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            return 0
          }
          return prev + 1
        })
      }, 50)

      return () => clearInterval(interval)
    }
  }, [loading])

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden touch-none">
      <Header stats={stats} />

      {!inVr && (
        <button
          onClick={async () => {
            setInVr(true)
          }}
          className="absolute bottom-4 right-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded z-10"
        >
          Enter VR
        </button>
      )}

      {engineError && (
        <div className="absolute inset-0 w-full h-full flex items-center justify-center text-white p-6">
          Engine Error: {engineError}
        </div>
      )}
      {loading && !engineError && (
        <div className="absolute inset-0 max-w-xs mx-auto w-full h-full flex items-center justify-center text-white p-6">
          <Progress value={progress} className="rounded-none" />
        </div>
      )}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none z-1" />
    </div>
  )
}
