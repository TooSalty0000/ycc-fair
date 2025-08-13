"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, X, RotateCcw, Check } from "lucide-react"

interface CameraCaptureProps {
  onCapture: (photoData: string) => void
  onClose: () => void
  targetWord: string
}

export function CameraCapture({ onCapture, onClose, targetWord }: CameraCaptureProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      setStream(mediaStream)
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
      }
    } catch (error) {
      console.error("카메라 접근 오류:", error)
      alert("카메라에 접근할 수 없습니다. 권한을 확인해주세요.")
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
  }, [stream])

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current
      const canvas = canvasRef.current
      const context = canvas.getContext("2d")

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight

      if (context) {
        context.drawImage(video, 0, 0)
        const photoData = canvas.toDataURL("image/jpeg", 0.8)
        setCapturedPhoto(photoData)
        stopCamera()
      }
    }
  }

  const retakePhoto = () => {
    setCapturedPhoto(null)
    startCamera()
  }

  const submitPhoto = async () => {
    if (capturedPhoto) {
      setIsLoading(true)
      onCapture(capturedPhoto)
      // Close modal immediately after submitting
      handleClose()
    }
  }

  const handleClose = () => {
    stopCamera()
    onClose()
  }

  // Start camera when component mounts
  useState(() => {
    startCamera()
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">사진 촬영</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Target Word */}
          <div className="text-center bg-indigo-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">찾아야 할 물건</p>
            <p className="text-xl font-bold text-indigo-600">{targetWord}</p>
          </div>

          {/* Camera/Photo Display */}
          <div className="relative bg-gray-100 rounded-lg overflow-hidden aspect-square">
            {!capturedPhoto ? (
              <>
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />

                {/* Camera Overlay
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="border-2 border-white border-dashed rounded-lg w-48 h-48 flex items-center justify-center">
                    <p className="text-white text-sm text-center bg-black bg-opacity-50 px-2 py-1 rounded">
                      {targetWord}를<br />이 영역에 맞춰주세요
                    </p>
                  </div>
                </div> */}
              </>
            ) : (
              <img src={capturedPhoto || "/placeholder.svg"} alt="Captured" className="w-full h-full object-cover" />
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            {!capturedPhoto ? (
              <Button onClick={capturePhoto} className="flex-1 bg-indigo-600 hover:bg-indigo-700" disabled={!stream}>
                <Camera className="w-4 h-4 mr-2" />
                촬영하기
              </Button>
            ) : (
              <>
                <Button onClick={retakePhoto} variant="outline" className="flex-1 bg-transparent">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  다시 촬영
                </Button>
                <Button onClick={submitPhoto} className="flex-1 bg-green-600 hover:bg-green-700" disabled={isLoading}>
                  <Check className="w-4 h-4 mr-2" />
                  {isLoading ? "AI 검증 중..." : "제출하기"}
                </Button>
              </>
            )}
          </div>

          {/* Instructions */}
          <div className="text-xs text-gray-500 text-center space-y-1">
            <p>• 실제 물건을 촬영해주세요 (화면 촬영 금지)</p>
            <p>• 물건이 명확하게 보이도록 촬영해주세요</p>
            <p>• AI가 자동으로 검증합니다</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
