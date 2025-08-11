"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Trophy, Medal, Award, Crown, Zap } from "lucide-react"

interface Player {
  rank: number
  username: string
  points: number
  tokens: number
  wordsCompleted: number
}

export function Leaderboard() {
  const [players, setPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadLeaderboard()
    // Refresh leaderboard every 30 seconds
    const interval = setInterval(loadLeaderboard, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadLeaderboard = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/game/leaderboard", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setPlayers(data)
      } else {
        console.error("Failed to load leaderboard")
      }
    } catch (error) {
      console.error("Failed to load leaderboard:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>
    }
  }

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white"
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white"
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white"
      default:
        return "bg-gray-100 text-gray-700"
    }
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">순위를 불러오는 중...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <Card className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white border-0">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trophy className="w-6 h-6" />
            <CardTitle className="text-xl">실시간 순위</CardTitle>
          </div>
          <p className="text-indigo-100">현재 참가자들의 순위를 확인하세요</p>
        </CardHeader>
      </Card>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-2 mb-6">
        {players.slice(0, 3).map((player, index) => (
          <Card key={`${player.username}-${player.rank}`} className={`${index === 0 ? "transform scale-105" : ""}`}>
            <CardContent className="p-4 text-center">
              <div className="mb-3">{getRankIcon(player.rank)}</div>
              <Avatar className="w-12 h-12 mx-auto mb-2">
                <AvatarFallback className="bg-indigo-100 text-indigo-600 font-semibold">
                  {player.username.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <p className="font-semibold text-sm truncate">{player.username}</p>
              <p className="text-xs text-gray-500 mb-2">{player.points}점</p>
              <Badge className={`text-xs ${getRankBadgeColor(player.rank)}`}>{player.rank}위</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Full Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">전체 순위</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-0">
            {players.map((player, index) => (
              <div
                key={`${player.username}-${player.rank}`}
                className={`flex items-center justify-between p-4 border-b last:border-b-0 ${
                  index < 3 ? "bg-gradient-to-r from-indigo-50 to-blue-50" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">{getRankIcon(player.rank)}</div>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-gray-100 text-gray-600 font-semibold">
                      {player.username.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-gray-800">{player.username}</p>
                    <p className="text-xs text-gray-500">{player.wordsCompleted}개 완료</p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="font-bold text-indigo-600">{player.points}</span>
                  </div>
                  {player.tokens > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      🎁 {player.tokens}개
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-indigo-600">{players.length}</p>
            <p className="text-sm text-gray-600">총 참가자</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{players.reduce((sum, p) => sum + p.wordsCompleted, 0)}</p>
            <p className="text-sm text-gray-600">총 완료 수</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
