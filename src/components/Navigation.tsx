"use client"

import { Button } from "@/components/ui/button"
import { Camera, Trophy, User, Gift } from "lucide-react"

interface NavigationProps {
  currentPage: "login" | "game" | "leaderboard" | "profile" | "coupons"
  onPageChange: (page: "login" | "game" | "leaderboard" | "profile" | "coupons") => void
}

export function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const navItems = [
    { id: "game" as const, label: "게임", icon: Camera },
    { id: "coupons" as const, label: "쿠폰", icon: Gift },
    { id: "leaderboard" as const, label: "순위", icon: Trophy },
    { id: "profile" as const, label: "프로필", icon: User },
  ]

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      <div className="flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = currentPage === item.id

          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => onPageChange(item.id)}
              className={`flex flex-col items-center gap-1 h-auto py-2 px-4 ${
                isActive ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "text-gray-600 hover:text-indigo-600"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Button>
          )
        })}
      </div>
    </div>
  )
}
