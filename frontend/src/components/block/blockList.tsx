'use client'


import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { BlockButton } from './blockButton'


interface BlockedUser {
    id: string
    name: string
    email: string
    role: string
    imageUrl: string
    isBlocked: boolean
    blogName: string
}

export function BlockList() {
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([])
    const [currentPage, setCurrentPage] = useState(1)
    const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!

    // 차단 목록 가져오기
    useEffect(() => {
        const fetchBlockedUsers = async () => {
            try {
                const res = await fetch(`${API_BASE}/api/users/block`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                })

                if (!res.ok) {
                    console.error('차단 목록을 가져오는 데 실패했습니다:', res.status)
                    return
                }

                const data = await res.json()
                setBlockedUsers(
                    data.map((user: any) => ({
                        id: String(user.userId),
                        name: user.username || '알 수 없음',
                        email: user.email || '알 수 없음',
                        role: 'Unknown',
                        imageUrl: user.profileImage || '/default-profile.png',
                        isBlocked: true,
                        blogName: user.blogName || user.username || '알 수 없음',
                    })),
                )
            } catch (error) {
                console.error('API 호출 중 오류 발생:', error)
            }
        }

        fetchBlockedUsers()
    }, [API_BASE])

    // 차단 상태 변경 핸들러
    const handleBlockStatusChange = (userId: string, isBlocked: boolean) => {
        setBlockedUsers((prev) => prev.map((user) => (user.id === userId ? { ...user, isBlocked } : user)))

        // 차단 해제 시 목록에서 제거
        if (!isBlocked) {
            setBlockedUsers((prev) => prev.filter((user) => user.id !== userId))
        }
    }

    // 차단된 사용자 총 수
    const totalBlockedUsers = blockedUsers.length
    // 페이지당 사용자 수
    const itemsPerPage = 5
    // 총 페이지 수
    const totalPages = Math.ceil(totalBlockedUsers / itemsPerPage)

    const currentBlockedUsers = blockedUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page)
        }
    }

    return (
        <div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
                {currentBlockedUsers.length === 0 ? (
                    <div className="flex items-center justify-center p-4 h-[72px]">
                        <p className="text-gray-500">차단 목록이 없습니다.</p>
                    </div>
                ) : (
                    currentBlockedUsers.map((user, idx) => (
                        <div
                            key={`blocked-${user.id}-${idx}`}
                            className={`flex items-center justify-between p-4 bg-white ${
                                idx !== currentBlockedUsers.length - 1 ? 'border-b border-gray-200' : ''
                            }`}
                        >
                            <div className="flex items-center space-x-4">
                                {/* 프로필 이미지 */}
                                <Link
                                    href={`/blog/${user.blogName}`}
                                    className="relative w-12 h-12 rounded-full overflow-hidden"
                                >
                                    <Image
                                        src={user.imageUrl}
                                        alt={`${user.name}의 프로필`}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 48px"
                                        className="object-cover"
                                        priority
                                    />
                                </Link>

                                <Link href={`/blog/${user.blogName}`}>
                                    <h3 className="font-medium text-gray-900 hover:text-[#78B3CE] transition-colors cursor-pointer">
                                        {user.name}
                                    </h3>
                                </Link>
                            </div>

                            {/* 차단 버튼 컴포넌트 */}
                            <BlockButton
                                userId={Number(user.id)}
                                isBlocked={user.isBlocked}
                                variant="button"
                                onBlockChange={(isBlocked) => handleBlockStatusChange(user.id, isBlocked)}
                            />
                        </div>
                    ))
                )}
            </div>

            {/* 페이징 */}
            {totalPages > 1 && (
                <div className="flex justify-center space-x-2 mt-6">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 focus:outline-none"
                        aria-label="이전 페이지"
                    >
                        &lt;
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => {
                        const pageIndex = i + 1
                        return (
                            <button
                                key={`page-button-${pageIndex}`}
                                onClick={() => handlePageChange(pageIndex)}
                                className={`w-10 h-10 flex items-center justify-center rounded-full focus:outline-none ${
                                    currentPage === pageIndex ? 'bg-gray-200 text-gray-700' : 'hover:bg-gray-100'
                                }`}
                                aria-label={`${pageIndex} 페이지`}
                                aria-current={currentPage === pageIndex ? 'page' : undefined}
                            >
                                {pageIndex}
                            </button>
                        )
                    })}

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-full hover:bg-gray-100 disabled:opacity-50 focus:outline-none"
                        aria-label="다음 페이지"
                    >
                        &gt;
                    </button>
                </div>
            )}
        </div>
    )
}
