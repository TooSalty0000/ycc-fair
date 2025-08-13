"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Trophy, Gift, AlertTriangle } from "lucide-react"

interface LoginFormProps {
  onLogin: (userData: { username: string; points: number; is_admin?: boolean }) => void
}

export function LoginForm({ onLogin }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [loginData, setLoginData] = useState({ username: "", password: "" })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!loginData.username.trim() || !loginData.password.trim()) {
      setError("사용자명과 비밀번호를 입력해주세요")
      setIsLoading(false)
      return
    }

    if (loginData.password.length < 6) {
      setError("비밀번호는 최소 6자 이상이어야 합니다")
      setIsLoading(false)
      return
    }

    if (loginData.username.length < 3) {
      setError("사용자명은 최소 3자 이상이어야 합니다")
      setIsLoading(false)
      return
    }

    try {
      // Try login first
      let response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          username: loginData.username, 
          password: loginData.password 
        }),
      })

      let data = await response.json()

      // If login fails, try to register automatically
      if (!response.ok) {
        console.log("Login failed, trying to register...")
        response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ 
            username: loginData.username, 
            password: loginData.password 
          }),
        })

        data = await response.json()

        if (!response.ok) {
          setError(data.error || "로그인에 실패했습니다. 사용자명과 비밀번호를 확인해주세요.")
          setIsLoading(false)
          return
        }
      }

      // Store token in localStorage
      if (data.token) {
        localStorage.setItem("authToken", data.token)
      }
      
      // Call onLogin with user data
      onLogin({
        username: data.user?.username || loginData.username,
        points: data.user?.points || 0,
        is_admin: data.user?.is_admin || false,
      })

    } catch (error) {
      console.error("Auth error:", error)
      setError("오류가 발생했습니다. 다시 시도해주세요.")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Hero Section */}
        <div className="text-center text-white mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <img 
              src="/ycc_logo.png" 
              alt="YCC 로고" 
              className="w-12 h-12 object-contain rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
                const fallback = e.currentTarget.parentElement?.querySelector('.fallback-icon') as HTMLElement
                if (fallback) fallback.style.display = 'block'
              }}
            />
            <Camera className="w-10 h-10 fallback-icon" style={{ display: 'none' }} />
          </div>
          <h1 className="text-3xl font-bold mb-2">YCC 퀘스트 스냅</h1>
          <p className="text-indigo-100">YCC 퀘스트 스냅 게임에 참여하세요!</p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="text-center text-white">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-2">
              <Camera className="w-6 h-6 mx-auto" />
            </div>
            <p className="text-xs text-indigo-100">미션 사진 촬영</p>
          </div>
          <div className="text-center text-white">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-2">
              <Trophy className="w-6 h-6 mx-auto" />
            </div>
            <p className="text-xs text-indigo-100">포인트 획득</p>
          </div>
          <div className="text-center text-white">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3 mb-2">
              <Gift className="w-6 h-6 mx-auto" />
            </div>
            <p className="text-xs text-indigo-100">쿠폰 보상 받기</p>
          </div>
        </div>

        {/* Login Form */}
        <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <CardHeader className="text-center">
            <CardTitle className="text-gray-800">게임 참여하기</CardTitle>
            <CardDescription>
              사용자명과 비밀번호를 입력하세요<br />
              <span className="text-xs text-green-600 font-medium">
                신규 사용자는 자동으로 계정이 생성됩니다
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm text-destructive font-medium">{error}</p>
                </div>
              )}
              
              <div>
                <Input
                  type="text"
                  placeholder="사용자명 (최소 3자)"
                  value={loginData.username}
                  onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                  required
                  minLength={3}
                  className="h-12"
                  disabled={isLoading}
                />
              </div>
              <div>
                <Input
                  type="password"
                  placeholder="비밀번호 (최소 6자)"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  required
                  minLength={6}
                  className="h-12"
                  disabled={isLoading}
                />
              </div>
              <Button
                type="submit"
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "처리 중..." : "게임 시작하기"}
              </Button>
            </form>

            {/* Warning for users */}
            <div className="mt-4 bg-amber-50/90 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <h4 className="font-medium text-amber-800 text-xs">
                    중요: 비밀번호 복구 불가능
                  </h4>
                  <p className="text-xs text-amber-700 leading-relaxed">
                    비밀번호를 잊어버리면 계정 복구가 불가능합니다. 기억하기 쉬운 비밀번호를 선택하세요!
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
