'use client'

import React, { useEffect, useState } from 'react'
import { useGlobalLoginUser } from '@/app/stores/auth/loginUser'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBan } from '@fortawesome/free-solid-svg-icons'
import { BlockButton } from '@/components/block/BlockButton'

interface StatisticsProps {
    userId?: number
}
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

const Statistics: React.FC<StatisticsProps> = ({ userId }) => {
    const { isLogin, loginUser } = useGlobalLoginUser()
    const [totalLikes, setTotalLikes] = useState<number>(0)
    const [totalViews, setTotalViews] = useState<number>(0)
    const [totalPosts, setTotalPosts] = useState<number>(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isBlockedByMe, setIsBlockedByMe] = useState<boolean>(false)

    // 디버깅을 위한 로그 추가
    console.log('Statistics Debug:', {
        isLogin,
        userId,
        loginUser,
        isBlockedByMe,
        condition: isLogin && userId && userId !== loginUser.id,
    })

    // 차단 상태 확인
    useEffect(() => {
        const checkBlockStatus = async () => {
            if (!isLogin || !userId) return

            try {
                const response = await fetch(`${API_BASE_URL}/api/users/${userId}/block`, {
                    credentials: 'include',
                })
                if (response.ok) {
                    const data = await response.json()
                    setIsBlockedByMe(data.isBlocked)
                }
            } catch (err) {
                console.error('차단 상태 확인 오류:', err)
            }
        }

        checkBlockStatus()
    }, [isLogin, userId])

    // 차단/차단해제 처리
    const handleBlockToggle = async () => {
        if (!isLogin || !userId) return

        try {
            const response = await fetch(`${API_BASE_URL}/api/users/block`, {
                method: isBlockedByMe ? 'DELETE' : 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ blockedId: Number(userId) }),
            })

            if (response.ok) {
                setIsBlockedByMe(!isBlockedByMe)
            } else {
                console.error('차단 처리 실패:', response.status)
            }
        } catch (err) {
            console.error('차단 처리 오류:', err)
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            const targetUserId = userId || (isLogin ? loginUser.id : null)

            if (!targetUserId) {
                setIsLoading(false)
                return
            }

            setIsLoading(true)
            setError(null)

            try {
                // 총 좋아요 수 가져오기
                try {
                    const likesResponse = await fetch(`${API_BASE_URL}/api/posts/public/likes/${targetUserId}`, {})
                    if (likesResponse.ok) {
                        const likesText = await likesResponse.text()
                        setTotalLikes(likesText ? JSON.parse(likesText) : 0)
                    } else {
                        console.log('좋아요 수를 가져오는데 실패했습니다:', await likesResponse.text())
                        setTotalLikes(0)
                    }
                } catch (err) {
                    console.error('좋아요 수 가져오기 오류:', err)
                    setTotalLikes(0)
                }

                // 총 조회수 가져오기
                try {
                    const viewsResponse = await fetch(`${API_BASE_URL}/api/posts/public/views/${targetUserId}`, {})
                    if (viewsResponse.ok) {
                        const viewsText = await viewsResponse.text()
                        setTotalViews(viewsText ? JSON.parse(viewsText) : 0)
                    } else {
                        console.log('조회수를 가져오는데 실패했습니다:', await viewsResponse.text())
                        setTotalViews(0)
                    }
                } catch (err) {
                    console.error('조회수 가져오기 오류:', err)
                    setTotalViews(0)
                }

                // 총 게시글 수 가져오기
                try {
                    const postsResponse = await fetch(`${API_BASE_URL}/api/posts/public/count/${targetUserId}`, {})
                    if (postsResponse.ok) {
                        const postsText = await postsResponse.text()
                        setTotalPosts(postsText ? JSON.parse(postsText) : 0)
                    } else {
                        console.log('게시글 수를 가져오는데 실패했습니다:', await postsResponse.text())
                        setTotalPosts(0)
                    }
                } catch (err) {
                    console.error('게시글 수 가져오기 오류:', err)
                    setTotalPosts(0)
                }
            } catch (err) {
                console.error('통계 정보 가져오기 오류:', err)
                setError(err instanceof Error ? err.message : '통계 정보를 불러오는데 문제가 발생했습니다')
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [userId, isLogin, loginUser])

    if (isLoading) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-800 mb-3">통계</h3>
                <div className="text-sm text-gray-500">로딩 중...</div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-800 mb-3">통계</h3>
                <div className="text-sm text-red-500">{error}</div>
            </div>
        )
    }

    return (
        <div>
            <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-sm font-bold text-gray-800 mb-3">통계</h3>
                <ul className="text-sm">
                    <li className="py-1.5 flex justify-between">
                        <span className="text-gray-700">총 좋아요</span>
                        <span className="text-gray-500">{totalLikes.toLocaleString()}</span>
                    </li>
                    <li className="py-1.5 flex justify-between">
                        <span className="text-gray-700">총 조회수</span>
                        <span className="text-gray-500">{totalViews.toLocaleString()}</span>
                    </li>
                    <li className="py-1.5 flex justify-between">
                        <span className="text-gray-700">총 게시글</span>
                        <span className="text-gray-500">{totalPosts.toLocaleString()}</span>
                    </li>
                </ul>
            </div>

            {/* 차단하기 버튼 */}
            {isLogin && userId && userId !== loginUser.id && (
                <div className="mt-4 pr-1">
                    <div className="flex justify-end">
                        <BlockButton
                            userId={userId}
                            isBlocked={isBlockedByMe}
                            variant="text"
                            onBlockChange={(isBlocked) => setIsBlockedByMe(isBlocked)}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default Statistics
