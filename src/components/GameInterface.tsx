"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Camera, Zap, Target, Clock, Gift, Trophy, Users, Sparkles, Share2, CheckCircle2, Copy } from "lucide-react"
import { CameraCapture } from "@/components/CameraCapture"

interface GameInterfaceProps {
  user: { username: string; points: number } | null
}

interface GameState {
  currentKeyword: string
  totalSubmissions: number
  requiredSubmissions: number
  progress: number
  isActive: boolean
}

interface GameResult {
  success: boolean
  points: number
  message: string
  token?: boolean
  confidence?: number
  wordProgressed?: boolean
  nextWord?: string | null
  isScreen?: boolean
  explanation?: string
  alreadySubmitted?: boolean
}

export function GameInterface({ user }: GameInterfaceProps) {
  const [gameState, setGameState] = useState<GameState>({
    currentKeyword: "로딩중...",
    totalSubmissions: 0,
    requiredSubmissions: 5,
    progress: 0,
    isActive: false,
  })
  const [showCamera, setShowCamera] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [recentSubmission, setRecentSubmission] = useState<GameResult | null>(null)
  const [userCoupons, setUserCoupons] = useState(0)
  const [hasSubmittedForCurrentWord, setHasSubmittedForCurrentWord] = useState(false)
  const [shareFeedback, setShareFeedback] = useState<string | null>(null)

  // Load game data on mount and periodically
  useEffect(() => {
    loadGameData()
    loadUserStats()
    loadSubmissionStatus()
    const interval = setInterval(() => {
      loadGameData()
      loadUserStats()
      loadSubmissionStatus()
    }, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadGameData = async () => {
    try {
      const response = await fetch("/api/game/current-word", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setGameState({
          currentKeyword: data.word,
          totalSubmissions: data.totalSubmissions,
          requiredSubmissions: data.requiredSubmissions,
          progress: data.progress * 100,
          isActive: data.isActive,
        })
      }
    } catch (error) {
      console.error("Failed to load game data:", error)
    }
  }

  const loadSubmissionStatus = async () => {
    try {
      const response = await fetch("/api/game/submission-status", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })
      if (response.ok) {
        const data = await response.json()
        setHasSubmittedForCurrentWord(Boolean(data.hasSubmitted))
      }
    } catch (error) {
      console.error("Failed to load submission status:", error)
    }
  }

  const loadUserStats = async () => {
    try {
      const response = await fetch("/api/game/user-stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUserCoupons(data.coupons || 0)
        // Update user points if available
        if (user && data.points !== undefined) {
          user.points = data.points
        }
      }
    } catch (error) {
      console.error("Failed to load user stats:", error)
    }
  }

  const handleShare = async () => {
    const shareText = `저는 이미 "${gameState.currentKeyword}"을(를) 찾았았어요! YCC 퀘스트 스냅에서 함께 도전해요!`
    const shareData = {
      title: "YCC 퀘스트 스냅",
      text: shareText,
      url: typeof window !== "undefined" ? window.location.href : undefined,
    }

    try {
      if (navigator.share && typeof navigator.share === "function") {
        await navigator.share(shareData as ShareData)
        setShareFeedback("공유되었습니다!")
      } else {
        await navigator.clipboard.writeText(`${shareText} ${shareData.url ?? ""}`.trim())
        setShareFeedback("클립보드에 복사했어요!")
      }
      setTimeout(() => setShareFeedback(null), 3000)
    } catch (err) {
      try {
        await navigator.clipboard.writeText(`${shareText} ${shareData.url ?? ""}`.trim())
        setShareFeedback("클립보드에 복사했어요!")
        setTimeout(() => setShareFeedback(null), 3000)
      } catch {
        setShareFeedback("공유에 실패했어요. 다시 시도해주세요.")
        setTimeout(() => setShareFeedback(null), 3000)
      }
    }
  }

  const handlePhotoSubmit = async (photoData: string) => {
    setIsProcessing(true)
    setRecentSubmission(null)

    try {
      const response = await fetch("/api/game/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ imageData: photoData }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setRecentSubmission({
          success: true,
          points: data.points,
          message: data.message,
          token: data.token,
          confidence: data.confidence,
          wordProgressed: data.wordProgressed,
          nextWord: data.nextWord,
        })
        
        setHasSubmittedForCurrentWord(true)
        
        // Update user points
        if (user && data.points) {
          user.points = (user.points || 0) + data.points
        }
        
        // Update coupons if earned
        if (data.token) {
          setUserCoupons(prev => prev + 1)
        }
        
        // Reload game data if word progressed
        if (data.wordProgressed) {
          setTimeout(() => {
            loadGameData()
            setHasSubmittedForCurrentWord(false)
          }, 2000)
        }
      } else {
        setRecentSubmission({
          success: false,
          points: 0,
          message: data.message || "사진 처리에 실패했습니다.",
          isScreen: data.isScreen,
          explanation: data.explanation,
          alreadySubmitted: data.alreadySubmitted,
        })
        
        if (data.alreadySubmitted) {
          setHasSubmittedForCurrentWord(true)
        }
      }
    } catch (error) {
      console.error("Submit error:", error)
      setRecentSubmission({
        success: false,
        points: 0,
        message: "오류가 발생했습니다. 다시 시도해주세요.",
      })
    } finally {
      setIsProcessing(false)
      // Clear result after 8 seconds
      setTimeout(() => setRecentSubmission(null), 8000)
    }
  }

  if (!user) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600">사용자 정보를 불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-6">
      {/* Current Challenge */}
      <Card className="border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <CardHeader className="text-center pb-3">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Target className="w-5 h-5 text-indigo-600" />
            <CardTitle className="text-lg text-indigo-800">현재 미션</CardTitle>
          </div>
          <div className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
            <h2 className="text-3xl font-bold mb-2">{gameState.currentKeyword}</h2>
            <p className="text-indigo-100 text-sm">이 물건을 찾아서 사진을 찍어주세요!</p>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">커뮤니티 진행률</span>
              <span className="font-medium">
                {gameState.totalSubmissions}/{gameState.requiredSubmissions}명 성공
              </span>
            </div>
            <Progress value={gameState.progress} className="h-3" />

            <div className="text-center">
              <Badge variant={gameState.progress >= 80 ? "default" : "secondary"}>
                {gameState.progress >= 80 ? "거의 완성!" : "더 많은 참여 필요"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Submission Result */}
      {recentSubmission && (
        <Card
          className={`border-2 transition-all duration-500 ${
            recentSubmission.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
          }`}
        >
          <CardContent className="p-4">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-2">
                {recentSubmission.success && <Trophy className="h-5 w-5 text-green-600" />}
                <span
                  className={`text-lg font-semibold ${
                    recentSubmission.success ? "text-green-700" : "text-red-700"
                  }`}
                >
                  {recentSubmission.success ? "성공!" : "실패"}
                </span>
                {recentSubmission.token && (
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Sparkles className="h-4 w-4 mr-1" />
                    쿠폰!
                  </Badge>
                )}
              </div>
              
              <p className="text-sm text-gray-600">{recentSubmission.message}</p>
              
              {recentSubmission.success && (
                <div className="space-y-2">
                  <Badge className="bg-green-100 text-green-800">
                    +{recentSubmission.points} 포인트
                  </Badge>
                  
                  {recentSubmission.confidence && (
                    <p className="text-xs text-gray-500">
                      AI 확신도: {Math.round(recentSubmission.confidence)}%
                    </p>
                  )}
                  
                  {recentSubmission.wordProgressed && recentSubmission.nextWord && (
                    <div className="mt-3 p-3 bg-blue-100 rounded-lg">
                      <p className="text-sm font-medium text-blue-800">
                        🎉 새로운 단어가 등장했습니다: &quot;{recentSubmission.nextWord}&quot;
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera Button or Completion Status */}
      <Card>
        <CardContent className="p-6 text-center">
          {hasSubmittedForCurrentWord ? (
            <div className="space-y-4">
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
                <Trophy className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-800">이미 완료됨!</h3>
                <p className="text-sm text-gray-600">
                  &quot;{gameState.currentKeyword}&quot;에 대한 점수를 이미 획득했습니다
                </p>
              </div>
              
              {/* Share Screen */}
              <Card className="bg-indigo-50 border-indigo-200">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-center space-x-2">
                    <Share2 className="h-5 w-5 text-indigo-600" />
                    <span className="font-medium text-indigo-800">친구들과 공유하기</span>
                  </div>
                  <p className="text-xs text-indigo-700">
                    오늘의 미션을 완료했어요! 다른 사람들도 함께 참여할 수 있도록 공유해보세요.
                  </p>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={handleShare} className="bg-indigo-600 hover:bg-indigo-700">
                      <Share2 className="h-4 w-4 mr-1" /> 공유하기
                    </Button>
                    <Button variant="secondary" onClick={async () => {
                      const text = `저는 이미 오늘의 미션 "${gameState.currentKeyword}"을(를) 완료했어요! YCC 퀘스트 스냅 헌트에서 함께 도전해요! ${typeof window !== "undefined" ? window.location.href : ""}`.trim()
                      await navigator.clipboard.writeText(text)
                      setShareFeedback("클립보드에 복사했어요!")
                      setTimeout(() => setShareFeedback(null), 3000)
                    }}>
                      <Copy className="h-4 w-4 mr-1" /> 복사하기
                    </Button>
                  </div>
                  {shareFeedback && (
                    <div className="flex items-center justify-center text-xs text-green-700">
                      <CheckCircle2 className="h-4 w-4 mr-1" /> {shareFeedback}
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card className="bg-yellow-50 border-yellow-200">
                <CardContent className="p-4">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium text-yellow-800">다음 미션 대기 중</span>
                  </div>
                  <p className="text-xs text-yellow-700">
                    다음 단어를 잠금 해제하려면{" "}
                    {gameState.requiredSubmissions - gameState.totalSubmissions}명이 더 필요합니다!
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-4">
              <Button
                onClick={() => setShowCamera(true)}
                size="lg"
                disabled={isProcessing}
                className="w-full h-16 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-lg font-semibold"
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                    <span>AI 분석 중...</span>
                  </div>
                ) : (
                  <>
                    <Camera className="w-6 h-6 mr-2" />
                    사진 촬영하기
                  </>
                )}
              </Button>
              <p className="text-sm text-gray-500">
                카메라로 직접 촬영해야 합니다 (화면 촬영 금지)
              </p>
              
              {isProcessing && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-3">
                    <div className="space-y-1 text-center text-sm text-blue-700">
                      <div className="flex items-center justify-center space-x-2">
                        <Zap className="h-4 w-4" />
                        <span>AI가 사진을 분석하고 있습니다</span>
                      </div>
                      <p className="text-xs">
                        🔍 &quot;{gameState.currentKeyword}&quot; 찾는 중<br />
                        🚫 화면 사진이 아닌지 확인 중<br />
                        ⚡ 몇 초 정도 걸릴 수 있습니다
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-indigo-500" />
              <span className="font-medium text-gray-700 text-sm">포인트</span>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{user?.points || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-yellow-500" />
              <span className="font-medium text-gray-700 text-sm">쿠폰</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{userCoupons}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="font-medium text-gray-700 text-sm">참여도</span>
            </div>
            <p className="text-lg font-bold text-blue-600">{gameState.totalSubmissions}</p>
            <p className="text-xs text-gray-500">명 성공</p>
          </CardContent>
        </Card>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <CameraCapture 
          onCapture={handlePhotoSubmit} 
          onClose={() => setShowCamera(false)} 
          targetWord={gameState.currentKeyword} 
        />
      )}
    </div>
  )
}
