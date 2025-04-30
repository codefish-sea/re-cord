'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface SearchBarProps {
    showSearchButton?: boolean
}

const SearchBar: React.FC<SearchBarProps> = ({ showSearchButton = false }) => {
    const [searchTerm, setSearchTerm] = useState('')
    const router = useRouter()
    const pathname = usePathname()

    // 홈 페이지인지 확인
    const isHomePage = pathname === '/' || pathname === '/home'

    // 검색 버튼 표시 여부: props로 받은 값 또는 홈 페이지인 경우
    const shouldShowSearchButton = showSearchButton || isHomePage

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!searchTerm.trim()) return

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/posts/public/search?keyword=${encodeURIComponent(searchTerm)}&page=0&size=10`,
                {
                    // 헤더 없이 쿠키만 사용
                    credentials: 'include', // 쿠키 기반 인증을 위해 사용
                },
            )

            if (!response.ok) {
                throw new Error('검색 중 오류가 발생했습니다.')
            }

            // 검색 결과 페이지로 이동
            router.push(`/post/searchList?keyword=${encodeURIComponent(searchTerm)}`)
        } catch (error) {
            console.error('검색 오류:', error)
            alert('검색 중 오류가 발생했습니다.')
        }
    }

    return (
        <div className="w-full mb-6">
            <form onSubmit={handleSearch} className="flex flex-row items-center">
                <div className="flex-grow">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="검색어를 입력하세요"
                        className={`w-full px-4 py-2 ${
                            shouldShowSearchButton ? 'rounded-l-md' : 'rounded-md'
                        } border border-gray-200 focus:outline-none focus:border-blue-400 text-sm text-gray-700 bg-white h-10`}
                    />
                </div>
                {shouldShowSearchButton && (
                    <button
                        type="submit"
                        className="px-4 py-2 bg-[#78B3CE] text-white rounded-r-md hover:bg-[#5A8BA6] transition-colors h-10 flex items-center justify-center whitespace-nowrap"
                    >
                        검색
                    </button>
                )}
            </form>
        </div>
    )
}

export default SearchBar
