import type React from "react"
import type { Metadata } from "next"
import { Inter, Noto_Sans_KR } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-noto-sans-kr",
})

export const metadata: Metadata = {
  title: "YCC 포토 헌트 - 실시간 사진 찾기 게임",
  description: "AI 기반 실시간 사진 스캐빈저 헌트 게임. 키워드에 맞는 사진을 찍고 포인트를 획득하세요!",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko" className={`${inter.variable} ${notoSansKR.variable} antialiased`}>
      <body className="font-sans">{children}</body>
    </html>
  )
}
