"use client"

import { useState, useEffect } from "react"
import { Gift, Check, AlertCircle, HelpCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Coupon {
  id: number
  word: string
  coupon_code: string
  status: "pending" | "confirmed"
  prize_description: string
  created_at: string
  confirmed_at?: string
}

export function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [confirmingCouponId, setConfirmingCouponId] = useState<number | null>(null)
  const [showInstructions, setShowInstructions] = useState(false)
  const [showFirstTimePopup, setShowFirstTimePopup] = useState(false)

  useEffect(() => {
    loadUserCoupons()
    
    // Check if user has seen instructions before
    const hasSeenInstructions = localStorage.getItem('coupon-instructions-seen')
    if (!hasSeenInstructions) {
      setShowFirstTimePopup(true)
    }
  }, [])

  const handleFirstTimePopupClose = () => {
    setShowFirstTimePopup(false)
    localStorage.setItem('coupon-instructions-seen', 'true')
  }

  const loadUserCoupons = async () => {
    try {
      const response = await fetch("/api/game/user-coupons", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setCoupons(data.coupons || [])
      }
    } catch (error) {
      console.error("Failed to load coupons:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmReceive = async (couponId: number) => {
    setConfirmingCouponId(couponId)
    try {
      const response = await fetch("/api/game/confirm-coupon", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify({ couponId }),
      })

      if (response.ok) {
        setCoupons((prev) =>
          prev.map((coupon) =>
            coupon.id === couponId
              ? { ...coupon, status: "confirmed" as const, confirmed_at: new Date().toISOString() }
              : coupon
          )
        )
      } else {
        console.error("Failed to confirm coupon")
      }
    } catch (error) {
      console.error("Error confirming coupon:", error)
    } finally {
      setConfirmingCouponId(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("ko-KR", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const pendingCoupons = coupons.filter((c) => c.status === "pending")
  const confirmedCoupons = coupons.filter((c) => c.status === "confirmed")

  return (
    <div className="p-4 space-y-6 pb-20">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="mx-auto h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center mb-2">
                  <Gift className="h-5 w-5 text-yellow-600" />
                </div>
                <p className="text-2xl font-bold text-yellow-600">{pendingCoupons.length}</p>
                <p className="text-xs text-gray-600">사용 가능</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="mx-auto h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center mb-2">
                  <Check className="h-5 w-5 text-gray-600" />
                </div>
                <p className="text-2xl font-bold text-gray-600">{coupons.length}</p>
                <p className="text-xs text-gray-600">총 획득</p>
              </CardContent>
            </Card>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-500">쿠폰을 불러오는 중...</p>
              </CardContent>
            </Card>
          ) : coupons.length === 0 ? (
            /* Empty State */
            <Card>
              <CardContent className="p-8 text-center space-y-4">
                <Gift className="h-16 w-16 text-gray-300 mx-auto" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">아직 쿠폰이 없습니다</h3>
                  <p className="text-gray-600 text-sm mb-6">
                    사진을 계속 찍어서 쿠폰을 획득하세요! 성공할 때마다 30% 확률로 부스 쿠폰을 받을 수 있어요.
                  </p>
                </div>
                <p className="text-sm text-gray-500">
                  게임 탭에서 사진을 찍고 쿠폰을 획득해보세요!
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Pending Coupons */}
              {pendingCoupons.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Gift className="h-6 w-6 mr-2 text-yellow-600" />
                    사용 가능한 쿠폰
                  </h2>
                  <div className="space-y-4">
                    {pendingCoupons.map((coupon) => (
                      <Card
                        key={coupon.id}
                        className="border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="h-10 w-10 bg-yellow-500 rounded-full flex items-center justify-center">
                                <Gift className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <CardTitle className="text-sm">부스 상품</CardTitle>
                                <p className="text-xs text-gray-600">&quot;{coupon.word}&quot; 챌린지</p>
                              </div>
                            </div>
                            <Badge className="bg-yellow-100 text-yellow-800">사용 가능</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="bg-white rounded-lg p-3 border border-yellow-300">
                            <p className="text-xs font-medium text-gray-700 mb-1">쿠폰 코드:</p>
                            <p className="text-xl font-mono font-bold text-center text-yellow-700 bg-yellow-100 py-2 rounded">
                              {coupon.coupon_code}
                            </p>
                          </div>

                          <div className="text-center">
                            <p className="text-xs text-gray-600 mb-3">
                              📍 <strong>YCC 부스에 오셔서 상품을 받아가세요!</strong>
                            </p>
                            <Button
                              onClick={() => handleConfirmReceive(coupon.id)}
                              disabled={confirmingCouponId === coupon.id}
                              className="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-400"
                            >
                              {confirmingCouponId === coupon.id ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  확인 중...
                                </>
                              ) : (
                                <>
                                  <Check className="h-4 w-4 mr-2" />
                                  수령 확인
                                </>
                              )}
                            </Button>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatDate(coupon.created_at)}에 획득
                            </p>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* All Collected Coupons - Compact View */}
              {coupons.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Check className="h-5 w-5 mr-2 text-gray-600" />
                    모든 쿠폰 ({coupons.length}개)
                  </h3>
                  <Card className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="grid grid-cols-2 gap-2">
                        {coupons.map((coupon) => (
                          <div 
                            key={coupon.id} 
                            className={`text-center p-2 rounded-lg border text-xs ${
                              coupon.status === "pending" 
                                ? "bg-yellow-50 border-yellow-200" 
                                : "bg-gray-100 border-gray-200 opacity-60"
                            }`}
                          >
                            <p className="font-mono font-semibold">{coupon.coupon_code}</p>
                            <p className="text-gray-500 text-xs truncate">&quot;{coupon.word}&quot;</p>
                            {coupon.status === "confirmed" && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                사용됨
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          )}
      
      {/* Help Button - Always visible */}
      <div className="fixed bottom-24 right-4 z-10">
        <Button
          onClick={() => setShowInstructions(true)}
          className="w-12 h-12 rounded-full bg-blue-500 hover:bg-blue-600 shadow-lg"
          size="sm"
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      </div>

      {/* First Time Instructions Popup */}
      <Dialog open={showFirstTimePopup} onOpenChange={handleFirstTimePopupClose}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-blue-900 flex items-center">
              <Gift className="h-5 w-5 mr-2" />
              쿠폰 사용 방법
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-blue-800">
            <p>🎉 <strong>쿠폰을 획득하셨네요!</strong></p>
            <div className="space-y-2">
              <p>• YCC 부스 운영자에게 <strong>쿠폰 코드를 보여주세요</strong></p>
              <p>• 쿠폰 코드가 명확히 보이도록 <strong>이 화면을 제시하세요</strong></p>
              <p>• 상품을 받은 후 <strong>&quot;수령 확인&quot; 버튼을 클릭하세요</strong></p>
              <p>• 더 많은 쿠폰 획득을 위해 <strong>계속 게임을 플레이하세요</strong>!</p>
            </div>
            <div className="flex justify-end pt-4">
              <Button onClick={handleFirstTimePopupClose} className="bg-blue-600 hover:bg-blue-700">
                알겠습니다!
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Instructions Toggle Dialog */}
      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-blue-900 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              쿠폰 사용 방법
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 text-sm text-blue-800">
            <p>• YCC 부스 운영자에게 <strong>쿠폰 코드를 보여주세요</strong></p>
            <p>• 쿠폰 코드가 명확히 보이도록 <strong>이 화면을 제시하세요</strong></p>
            <p>• 상품을 받은 후 <strong>&quot;수령 확인&quot; 버튼을 클릭하세요</strong></p>
            <p>• 더 많은 쿠폰 획득을 위해 <strong>계속 게임을 플레이하세요</strong>!</p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}