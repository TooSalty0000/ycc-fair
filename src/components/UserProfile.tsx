"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { User, Zap, Gift, Settings, LogOut, Lock, Trophy } from "lucide-react"

interface UserProfileProps {
  user: { username: string; points: number } | null
  onLogout: () => void
}

interface UserStats {
  id: number
  username: string
  points: number
  coupons: number
  wordsCompleted: number
  is_admin?: boolean
}

export function UserProfile({ user, onLogout }: UserProfileProps) {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [userRank, setUserRank] = useState<number>(0)
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  })

  useEffect(() => {
    loadUserStats()
    loadUserRank()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadUserStats = async () => {
    try {
      const response = await fetch("/api/game/user-stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUserStats(data)
      }
    } catch (error) {
      console.error("Failed to load user stats:", error)
    }
  }

  const loadUserRank = async () => {
    try {
      const response = await fetch("/api/game/leaderboard", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })

      if (response.ok) {
        const leaderboard = await response.json()
        const currentUserRank = leaderboard.find((player: { username: string; rank: number }) => player.username === user?.username)?.rank || 0
        setUserRank(currentUserRank)
      }
    } catch (error) {
      console.error("Failed to load user rank:", error)
    }
  }

  const handlePasswordChange = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      alert("모든 필드를 입력해주세요")
      return
    }

    if (passwordData.new !== passwordData.confirm) {
      alert("새 비밀번호가 일치하지 않습니다.")
      return
    }

    if (passwordData.new.length < 6) {
      alert("새 비밀번호는 최소 6자 이상이어야 합니다")
      return
    }

    setIsChangingPassword(true)

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({
          currentPassword: passwordData.current,
          newPassword: passwordData.new,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        alert("비밀번호가 성공적으로 변경되었습니다")
        setShowPasswordDialog(false)
        setPasswordData({ current: "", new: "", confirm: "" })
      } else {
        alert(`오류: ${data.error}`)
      }
    } catch (error) {
      console.error("Password change error:", error)
      alert("오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className="p-4 space-y-6">
      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-0">
        <CardContent className="p-6 text-center">
          <Avatar className="w-20 h-20 mx-auto mb-4 border-4 border-white/20">
            <AvatarFallback className="bg-white text-indigo-600 text-2xl font-bold">
              {user?.username?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-bold mb-2">{user?.username}</h2>
          <div className="flex items-center justify-center gap-4 text-indigo-100">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{userStats?.points || user?.points || 0}</p>
              <p className="text-xs">포인트</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">#{userRank || "---"}</p>
              <p className="text-xs">순위</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-white">{userStats?.coupons || 0}</p>
              <p className="text-xs">쿠폰</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-5 h-5 text-indigo-500" />
              <span className="font-semibold text-gray-700 text-sm">포인트</span>
            </div>
            <p className="text-2xl font-bold text-indigo-600">{userStats?.points || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="w-5 h-5 text-yellow-500" />
              <span className="font-semibold text-gray-700 text-sm">쿠폰</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{userStats?.coupons || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-green-500" />
              <span className="font-semibold text-gray-700 text-sm">완료</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{userStats?.wordsCompleted || 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <User className="w-5 h-5 text-purple-500" />
              <span className="font-semibold text-gray-700 text-sm">순위</span>
            </div>
            <p className="text-2xl font-bold text-purple-600">#{userRank || "---"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Game Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">게임 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              YCC 퀘스트 스냅에 참여해주셔서 감사합니다!
            </p>
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                📸 실제 물체를 촬영하여 포인트를 획득하세요<br />
                🎁 운이 좋으면 부스 쿠폰도 받을 수 있어요!<br />
                🏆 다른 참가자들과 순위를 경쟁해보세요
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" />
            설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full justify-start bg-transparent">
                <Lock className="w-4 h-4 mr-2" />
                비밀번호 변경
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>비밀번호 변경</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  type="password"
                  placeholder="현재 비밀번호"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                />
                <Input
                  type="password"
                  placeholder="새 비밀번호"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                />
                <Input
                  type="password"
                  placeholder="새 비밀번호 확인"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                />
                <Button 
                  onClick={handlePasswordChange} 
                  className="w-full"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? "변경 중..." : "비밀번호 변경"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="destructive" className="w-full justify-start" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            로그아웃
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
