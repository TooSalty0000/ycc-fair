"use client"

import { useState, useEffect } from "react"
import { 
  Users, 
  Gift, 
  Settings, 
  Plus, 
  Trash2, 
  Play, 
  RotateCcw,
  Shield,
  Trophy,
  LogOut,
  Key,
  Menu,
  X,
  AlertCircle,
  CheckCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"

interface UserStat {
  id: number
  username: string
  is_admin: boolean
  created_at: string
  last_active: string
  total_points: number
  total_coupons: number
  words_completed: number
}

interface Coupon {
  id: number
  coupon_code: string
  word: string
  status: string
  created_at: string
  confirmed_at?: string
  username: string
}

interface Word {
  id: number
  word: string
  is_active: boolean
  created_at: string
  activated_at?: string
  completed_at?: string
  current_completions: number
}

interface AdminPageProps {
  onLogout?: () => void
}

export function AdminPage({ onLogout }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState("overview")
  const [users, setUsers] = useState<UserStat[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [words, setWords] = useState<Word[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newWord, setNewWord] = useState("")
  const [resetPasswordUserId, setResetPasswordUserId] = useState<number | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newAdminPassword, setNewAdminPassword] = useState("")
  const [couponDropRate, setCouponDropRate] = useState(30)
  const [defaultRequiredCompletions, setDefaultRequiredCompletions] = useState(5)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsResponse, wordsResponse, settingsResponse] = await Promise.all([
        fetch("/api/admin/stats", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }),
        fetch("/api/admin/words", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        }),
        fetch("/api/admin/settings", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("authToken")}`
          }
        })
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setUsers(statsData.users || [])
        setCoupons(statsData.coupons || [])
      }

      if (wordsResponse.ok) {
        const wordsData = await wordsResponse.json()
        setWords(wordsData.words || [])
      }

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json()
        setCouponDropRate(settingsData.coupon_drop_rate || 30)
        setDefaultRequiredCompletions(settingsData.default_required_completions || 5)
      }

    } catch (error) {
      console.error("Failed to load admin data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleWordAction = async (action: string, wordId?: number, requiredCompletions?: number) => {
    try {
      const response = await fetch("/api/admin/words", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify({
          action,
          wordId,
          word: newWord,
          requiredCompletions: requiredCompletions || defaultRequiredCompletions
        })
      })

      if (response.ok) {
        setNewWord("")
        await loadData()
      } else {
        const errorData = await response.json()
        alert(`오류: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Word action error:", error)
      alert("오류가 발생했습니다")
    }
  }

  const handlePasswordChange = async () => {
    if (!currentPassword || !newAdminPassword) {
      alert("현재 비밀번호와 새 비밀번호를 모두 입력해주세요")
      return
    }

    if (newAdminPassword.length < 6) {
      alert("새 비밀번호는 최소 6자 이상이어야 합니다")
      return
    }

    try {
      const response = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify({
          currentPassword,
          newPassword: newAdminPassword
        })
      })

      const result = await response.json()

      if (response.ok) {
        alert(result.message)
        setShowPasswordChange(false)
        setCurrentPassword("")
        setNewAdminPassword("")
      } else {
        alert(`오류: ${result.error}`)
      }
    } catch (error) {
      console.error("Password change error:", error)
      alert("오류가 발생했습니다")
    }
  }

  const handleUserAction = async (action: string, userId: number) => {
    if (action === "delete" && !confirm("이 사용자를 삭제하시겠습니까? 모든 제출 기록과 쿠폰도 함께 삭제됩니다.")) {
      return
    }

    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify({
          action,
          userId,
          newPassword: action === "resetPassword" ? newPassword : undefined
        })
      })

      const result = await response.json()

      if (response.ok) {
        alert(result.message)
        setResetPasswordUserId(null)
        setNewPassword("")
        await loadData()
      } else {
        alert(`오류: ${result.error}`)
      }
    } catch (error) {
      console.error("User action error:", error)
      alert("오류가 발생했습니다")
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const handleCouponRateChange = async () => {
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify({
          action: "updateCouponRate",
          rate: couponDropRate
        })
      })

      if (response.ok) {
        alert("쿠폰 드롭률이 업데이트되었습니다!")
      } else {
        const errorData = await response.json()
        alert(`오류: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Settings update error:", error)
      alert("오류가 발생했습니다")
    }
  }

  const handleDefaultCompletionsChange = async () => {
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`
        },
        body: JSON.stringify({
          action: "updateDefaultCompletions",
          completions: defaultRequiredCompletions
        })
      })

      if (response.ok) {
        alert("기본 필요 완료 수가 업데이트되었습니다!")
      } else {
        const errorData = await response.json()
        alert(`오류: ${errorData.error}`)
      }
    } catch (error) {
      console.error("Settings update error:", error)
      alert("오류가 발생했습니다")
    }
  }

  const activeWord = words.find(w => w.is_active)
  const totalUsers = users.length
  const totalCoupons = coupons.length
  const pendingCoupons = coupons.filter(c => c.status === "pending").length

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-500">관리자 패널을 불러오는 중...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-xl">
          <div className="px-4 py-6">
            {/* Desktop Header */}
            <div className="hidden lg:flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Shield className="h-8 w-8" />
                <div>
                  <h1 className="text-2xl font-bold">YCC 관리자 패널</h1>
                  <p className="text-indigo-100">포토 헌트 게임 관리 시스템</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => setShowPasswordChange(!showPasswordChange)}
                  variant="secondary"
                  size="sm"
                  className="bg-white/20 hover:bg-white/30 text-white border-0"
                >
                  <Key className="h-4 w-4 mr-2" />
                  비밀번호 변경
                </Button>
                {onLogout && (
                  <Button
                    onClick={onLogout}
                    variant="secondary"
                    size="sm"
                    className="bg-red-500/20 hover:bg-red-500/30 text-white border-0"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    로그아웃
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile Header */}
            <div className="lg:hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Shield className="h-6 w-6" />
                  <div>
                    <h1 className="text-xl font-bold">YCC 관리자</h1>
                    <p className="text-xs text-indigo-100">게임 관리</p>
                  </div>
                </div>
                <Button
                  onClick={() => setShowMobileMenu(!showMobileMenu)}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:bg-white/20"
                >
                  {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>

              {/* Mobile Menu */}
              {showMobileMenu && (
                <div className="mt-4 space-y-2">
                  <Button
                    onClick={() => { setShowPasswordChange(!showPasswordChange); setShowMobileMenu(false) }}
                    variant="secondary"
                    size="sm"
                    className="w-full bg-white/20 hover:bg-white/30 text-white border-0"
                  >
                    <Key className="h-4 w-4 mr-2" />
                    비밀번호 변경
                  </Button>
                  {onLogout && (
                    <Button
                      onClick={() => { onLogout(); setShowMobileMenu(false) }}
                      variant="secondary" 
                      size="sm"
                      className="w-full bg-red-500/20 hover:bg-red-500/30 text-white border-0"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      로그아웃
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Password Change Dialog */}
          <Dialog open={showPasswordChange} onOpenChange={setShowPasswordChange}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center">
                  <Key className="h-5 w-5 mr-2" />
                  관리자 비밀번호 변경
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">현재 비밀번호</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    placeholder="현재 비밀번호를 입력하세요"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newAdminPassword">새 비밀번호 (최소 6자)</Label>
                  <Input
                    id="newAdminPassword"
                    type="password"
                    placeholder="새 비밀번호를 입력하세요"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                  />
                </div>
                <div className="flex space-x-2 pt-4">
                  <Button 
                    onClick={handlePasswordChange}
                    disabled={!currentPassword || !newAdminPassword}
                    className="flex-1"
                  >
                    비밀번호 변경
                  </Button>
                  <Button 
                    onClick={() => {
                      setShowPasswordChange(false)
                      setCurrentPassword("")
                      setNewAdminPassword("")
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    취소
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-blue-600">{totalUsers}</h3>
                <p className="text-sm text-gray-600">전체 사용자</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mb-3">
                  <Gift className="h-6 w-6 text-yellow-600" />
                </div>
                <h3 className="text-2xl font-bold text-yellow-600">{totalCoupons}</h3>
                <p className="text-sm text-gray-600">발급된 쿠폰</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mb-3">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-2xl font-bold text-orange-600">{pendingCoupons}</h3>
                <p className="text-sm text-gray-600">대기 중</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mx-auto h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-bold text-green-600 truncate">{activeWord?.word || "없음"}</h3>
                <p className="text-sm text-gray-600">현재 단어</p>
              </CardContent>
            </Card>
          </div>

          {/* Current Game Status */}
          {activeWord && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Trophy className="h-5 w-5 mr-2" />
                  현재 게임 상태
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-100 rounded-full p-3">
                      <Trophy className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-green-700">현재 활성 단어: &quot;{activeWord.word}&quot;</h3>
                      <p className="text-sm text-gray-600">
                        완료 현황: {activeWord.current_completions}명이 성공 
                        (다음 단어까지 {defaultRequiredCompletions - activeWord.current_completions}명 남음)
                      </p>
                    </div>
                  </div>
                  <div className="w-full lg:w-32">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div 
                        className="bg-green-600 h-3 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((activeWord.current_completions / defaultRequiredCompletions) * 100, 100)}%` 
                        }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 text-center">
                      {Math.max(0, defaultRequiredCompletions - activeWord.current_completions)}명 더 필요
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Main Content Tabs */}
          <Card>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="border-b px-6">
                <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4 lg:inline-flex">
                  <TabsTrigger value="overview" className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">사용자</span>
                  </TabsTrigger>
                  <TabsTrigger value="coupons" className="flex items-center">
                    <Gift className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">쿠폰</span>
                  </TabsTrigger>
                  <TabsTrigger value="words" className="flex items-center">
                    <Plus className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">단어</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">설정</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                {/* Users Tab */}
                <TabsContent value="overview" className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">사용자 통계 & 관리</h2>
                    <div className="overflow-x-auto">
                      <div className="min-w-full">
                        {users.map((user) => (
                          <Card key={user.id} className={`mb-3 ${user.is_admin ? "border-purple-200 bg-purple-50" : ""}`}>
                            <CardContent className="p-4">
                              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                                <div className="flex items-center space-x-3">
                                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                    user.is_admin ? "bg-purple-100" : "bg-gray-100"
                                  }`}>
                                    {user.is_admin ? (
                                      <Shield className="h-5 w-5 text-purple-600" />
                                    ) : (
                                      <Users className="h-5 w-5 text-gray-600" />
                                    )}
                                  </div>
                                  <div>
                                    <div className="font-medium">
                                      {user.username}
                                      {user.is_admin && <Badge className="ml-2" variant="secondary">ADMIN</Badge>}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {user.total_points}점 | {user.total_coupons}쿠폰 | {user.words_completed}완료
                                    </div>
                                  </div>
                                </div>
                                
                                {!user.is_admin && (
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    {resetPasswordUserId === user.id ? (
                                      <div className="flex items-center space-x-2">
                                        <Input
                                          type="password"
                                          placeholder="새 비밀번호"
                                          value={newPassword}
                                          onChange={(e) => setNewPassword(e.target.value)}
                                          className="w-32"
                                        />
                                        <Button
                                          onClick={() => handleUserAction("resetPassword", user.id)}
                                          size="sm"
                                          className="bg-green-600 hover:bg-green-700"
                                        >
                                          저장
                                        </Button>
                                        <Button
                                          onClick={() => {
                                            setResetPasswordUserId(null)
                                            setNewPassword("")
                                          }}
                                          variant="outline"
                                          size="sm"
                                        >
                                          취소
                                        </Button>
                                      </div>
                                    ) : (
                                      <>
                                        <Button
                                          onClick={() => setResetPasswordUserId(user.id)}
                                          variant="outline"
                                          size="sm"
                                        >
                                          <RotateCcw className="h-4 w-4 mr-1" />
                                          비밀번호 재설정
                                        </Button>
                                        <Button
                                          onClick={() => handleUserAction("delete", user.id)}
                                          variant="outline"
                                          size="sm"
                                          className="text-red-600 hover:text-red-700"
                                        >
                                          <Trash2 className="h-4 w-4 mr-1" />
                                          삭제
                                        </Button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Coupons Tab */}
                <TabsContent value="coupons" className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">쿠폰 관리</h2>
                    <div className="space-y-3">
                      {coupons.map((coupon) => (
                        <Card key={coupon.id}>
                          <CardContent className="p-4">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-2 lg:space-y-0">
                              <div className="flex items-center space-x-3">
                                <div className="font-mono font-bold text-lg">{coupon.coupon_code}</div>
                                <Badge variant={coupon.status === "confirmed" ? "default" : "secondary"}>
                                  {coupon.status === "confirmed" ? "확인됨" : "대기 중"}
                                </Badge>
                              </div>
                              <div className="text-sm text-gray-600">
                                <div>{coupon.username} | &quot;{coupon.word}&quot;</div>
                                <div>
                                  생성: {formatDate(coupon.created_at)}
                                  {coupon.confirmed_at && ` | 확인: ${formatDate(coupon.confirmed_at)}`}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Words Tab */}
                <TabsContent value="words" className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">단어 관리</h2>
                    
                    {/* Add New Word */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">새 단어 추가</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <Input
                            placeholder="새 단어를 입력하세요..."
                            value={newWord}
                            onChange={(e) => setNewWord(e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            onClick={() => handleWordAction("add")}
                            disabled={!newWord.trim()}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            단어 추가
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Words List */}
                    <div className="space-y-3">
                      {words.map((word) => (
                        <Card key={word.id} className={word.is_active ? "border-green-200 bg-green-50" : ""}>
                          <CardContent className="p-4">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                              <div className="flex items-center space-x-4">
                                <div className="font-semibold text-lg">{word.word}</div>
                                <Badge variant={
                                  word.is_active ? "default" : 
                                  word.completed_at ? "secondary" : "outline"
                                }>
                                  {word.is_active ? "활성" : word.completed_at ? "완료됨" : "준비됨"}
                                </Badge>
                              </div>
                              
                              <div className="flex items-center space-x-4">
                                <div className="text-sm text-gray-600">
                                  <div className="flex items-center space-x-2">
                                    <span>{word.current_completions} / {defaultRequiredCompletions}</span>
                                    <div className="w-16 bg-gray-200 rounded-full h-2">
                                      <div 
                                        className={`h-2 rounded-full transition-all duration-300 ${
                                          word.is_active ? "bg-green-600" : word.completed_at ? "bg-blue-600" : "bg-gray-400"
                                        }`}
                                        style={{ 
                                          width: `${Math.min((word.current_completions / defaultRequiredCompletions) * 100, 100)}%` 
                                        }}
                                      />
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex gap-2">
                                  {!word.is_active && (
                                    <Button
                                      onClick={() => handleWordAction("activate", word.id)}
                                      size="sm"
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      <Play className="h-4 w-4 mr-1" />
                                      활성화
                                    </Button>
                                  )}
                                  {!word.is_active && !word.completed_at && (
                                    <Button
                                      onClick={() => handleWordAction("remove", word.id)}
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-4 w-4 mr-1" />
                                      삭제
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">게임 설정</h2>
                    
                    {/* Coupon Drop Rate */}
                    <Card>
                      <CardHeader>
                        <CardTitle>쿠폰 드롭률</CardTitle>
                        <p className="text-sm text-gray-600">플레이어가 성공적인 제출 후 쿠폰을 받을 확률</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">드롭률</span>
                          <span className="text-2xl font-bold text-indigo-600">{couponDropRate}%</span>
                        </div>
                        <Slider
                          value={[couponDropRate]}
                          onValueChange={(value) => setCouponDropRate(value[0])}
                          max={100}
                          step={5}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>• 0%: 쿠폰 지급 안함</p>
                          <p>• 30%: 기본 설정 (권장)</p>
                          <p>• 100%: 매번 쿠폰 지급</p>
                        </div>
                        <Button onClick={handleCouponRateChange} className="w-full">
                          <Settings className="h-4 w-4 mr-2" />
                          설정 저장
                        </Button>
                      </CardContent>
                    </Card>

                    {/* Default Required Completions */}
                    <Card>
                      <CardHeader>
                        <CardTitle>기본 필요 완료 수</CardTitle>
                        <p className="text-sm text-gray-600">새로운 단어가 다음 단계로 진행하기 위해 필요한 기본 제출 수</p>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm">필요 완료 수</span>
                          <span className="text-2xl font-bold text-indigo-600">{defaultRequiredCompletions}명</span>
                        </div>
                        <Slider
                          value={[defaultRequiredCompletions]}
                          onValueChange={(value) => setDefaultRequiredCompletions(value[0])}
                          min={1}
                          max={20}
                          step={1}
                          className="w-full"
                        />
                        <div className="text-xs text-gray-500 space-y-1">
                          <p>• 낮은 수: 빠른 진행, 더 많은 단어</p>
                          <p>• 높은 수: 모든 플레이어가 참여할 시간</p>
                          <p>• 기본값: 5명 (권장)</p>
                        </div>
                        <Button onClick={handleDefaultCompletionsChange} className="w-full">
                          <Settings className="h-4 w-4 mr-2" />
                          설정 저장
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  )
}