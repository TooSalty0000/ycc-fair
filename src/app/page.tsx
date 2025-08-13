"use client"

import { useState, useEffect } from "react"
import { LoginForm } from "@/components/LoginForm"
import { GameInterface } from "@/components/GameInterface"
import { Leaderboard } from "@/components/Leaderboard"
import { UserProfile } from "@/components/UserProfile"
import { CouponsPage } from "@/components/CouponsPage"
import { AdminPage } from "@/components/AdminPage"
import { Navigation } from "@/components/Navigation"

type Page = "login" | "game" | "leaderboard" | "profile" | "coupons"

interface User {
  username: string
  points: number
  is_admin?: boolean
}

export default function Home() {
  const [currentPage, setCurrentPage] = useState<Page>("login")
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Check for existing auth token on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken")
      
      if (!token) {
        setIsCheckingAuth(false)
        return
      }

      try {
        // Validate token with backend
        const response = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (response.ok) {
          const userData = await response.json()
          setUser({
            username: userData.username,
            points: userData.points || 0,
            is_admin: userData.is_admin || false
          })
          setIsAuthenticated(true)
          // Set appropriate starting page for non-admin users
          if (!userData.is_admin) {
            setCurrentPage("game")
          }
        } else {
          // Token is invalid, remove it
          localStorage.removeItem("authToken")
        }
      } catch (error) {
        console.error("Auth check failed:", error)
        localStorage.removeItem("authToken")
      } finally {
        setIsCheckingAuth(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogin = (userData: User) => {
    setUser(userData)
    setIsAuthenticated(true)
    // If user is admin, don't set to game page - let admin page render
    if (!userData.is_admin) {
      setCurrentPage("game")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("authToken")
    setUser(null)
    setIsAuthenticated(false)
    setCurrentPage("login")
  }

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm onLogin={handleLogin} />
  }

  // Show admin interface for admin users
  if (user?.is_admin) {
    return <AdminPage onLogout={handleLogout} />
  }

  // Show regular game interface for normal users
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50">
      <div className="max-w-md mx-auto bg-white shadow-xl min-h-screen">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">
                {currentPage === "game" && "YCC 퀘스트 스냅"}
                {currentPage === "leaderboard" && "실시간 순위"}
                {currentPage === "profile" && "내 프로필"}
                {currentPage === "coupons" && "내 쿠폰"}
              </h1>
              <p className="text-indigo-100 text-sm">
                {currentPage === "game" && "실시간 사진 보물찾기 게임"}
                {currentPage === "leaderboard" && "참가자들의 순위를 확인하세요"}
                {currentPage === "profile" && "내 정보 및 설정"}
                {currentPage === "coupons" && "획득한 쿠폰을 관리하세요"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-indigo-100">안녕하세요</p>
              <p className="font-semibold">{user?.username || "사용자"}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 pb-20">
          {currentPage === "game" && <GameInterface user={user} />}
          {currentPage === "leaderboard" && <Leaderboard />}
          {currentPage === "profile" && <UserProfile user={user} onLogout={handleLogout} />}
          {currentPage === "coupons" && <CouponsPage />}
        </div>

        {/* Navigation */}
        <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md">
          <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
        </div>
      </div>
    </div>
  )
}
