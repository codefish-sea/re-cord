'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useGlobalLoginUser } from '../../app/stores/auth/loginUser'
import { FollowButton } from '@/components/follow/FollowButton'

interface AuthorStats {
    followers: number
    following: number
    posts: number
}
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface Author {
    id: number
    username: string
    email: string
    bootcamp: string
    generation: number
    introduction: string
    profileImageUrl: string
    provider: string
    role: string
    blogname: string // 추가: DB에서 가져오는 blogname 필드
    stats: AuthorStats
}

interface AuthorProfileProps {
    userId?: number // 옵션: 특정 사용자 ID를 직접 전달받을 수 있음
}

const AuthorProfile: React.FC<AuthorProfileProps> = ({ userId }) => {
    const params = useParams()
    const { loginUser, isLogin } = useGlobalLoginUser()
    const [author, setAuthor] = useState<Author | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [hasFollowed, setHasFollowed] = useState(false)
    const [followLoading, setFollowLoading] = useState(false)
    // 프로필 이미지 URL 상태 추가
    const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)

    // URL에서 사용자 ID를 가져오거나 전달받은 userId 또는 로그인한 사용자 ID를 사용
    const targetUserId = userId || (params.id ? Number(params.id) : isLogin ? loginUser.id : null)

    // 프로필 이미지를 가져오는 함수
    const fetchProfileImage = async (userId: number) => {
        try {
            const userProfileResponse = await fetch(`${API_BASE_URL}/api/auth/public/${userId}/profile-image`, {
                credentials: 'include',
            })

            if (!userProfileResponse.ok) {
                console.log(`프로필 이미지 로드 실패: ${userProfileResponse.status}`)
                setProfileImageUrl('/default-profile.png')
                return
            }

            const imageUrl = await userProfileResponse.text()

            // 유효하지 않은 URL인 경우 기본 이미지 사용
            if (!imageUrl || imageUrl.trim() === '' || imageUrl.trim() === 'null') {
                setProfileImageUrl('/default-profile.png')
                return
            }

            // URL 포맷에 따른 처리
            if (imageUrl.startsWith('http')) {
                // 이미 절대 URL인 경우 그대로 사용
                setProfileImageUrl(imageUrl)
            } else if (imageUrl === '/profile.jpg' || imageUrl === '/default-profile.png') {
                // 기본 프로필 이미지인 경우
                setProfileImageUrl(imageUrl)
            } else {
                // 백엔드 URL과 결합하여 사용
                const formattedUrl = imageUrl.startsWith('/')
                    ? `${API_BASE_URL}${imageUrl}`
                    : `${API_BASE_URL}/${imageUrl}`
                setProfileImageUrl(formattedUrl)
            }
        } catch (error) {
            console.error('프로필 이미지 로드 오류:', error)
            setProfileImageUrl('/default-profile.png')
        }
    }

    // 사용자 데이터 가져오기
    const fetchUserData = async (userId: number) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/public/${userId}`, {
            method: 'GET',
            credentials: 'include',
        })

        if (!response.ok) {
            if (response.status === 401) {
                console.warn('인증 토큰이 만료되었거나 유효하지 않습니다.')
            }
            throw new Error(`사용자 정보를 불러오는 데 실패했습니다. 상태 코드: ${response.status}`)
        }

        const userData = await response.json()
        console.log('사용자 데이터 로드 성공:', userData)
        return userData
    }

    // 사용자 통계 정보 가져오기
    const fetchUserStats = async (userId: number) => {
        // 기본 통계 정보
        const defaultStats = { followers: 0, following: 0, posts: 0 }

        try {
            const resCounts = await fetch(`${API_BASE_URL}/api/users/${userId}/counts`, { credentials: 'include' })

            if (resCounts.ok) {
                const { followerCount, followingCount } = await resCounts.json()
                return {
                    followers: followerCount,
                    following: followingCount,
                    posts: defaultStats.posts, // 필요 시 게시글 수도 업데이트
                }
            }

            return defaultStats
        } catch (statsErr) {
            console.warn('통계 정보 로드 실패 (기본값 사용):', statsErr)
            return defaultStats
        }
    }

    // 팔로우 상태 확인하기
    const checkFollowStatus = async (userId: number) => {
        try {
            const resFollow = await fetch(`${API_BASE_URL}/api/users/follow`, {
                credentials: 'include',
            })

            if (resFollow.ok) {
                const list: Array<{ userId: number }> = await resFollow.json()
                setHasFollowed(list.some((u) => u.userId === userId))
            }
        } catch (error) {
            console.error('팔로우 상태 확인 오류:', error)
        }
    }

    // 사용자 정보를 가져오는 함수
    const fetchUserProfile = async () => {
        // 조회 대상 사용자 ID 확인 및 없으면 반환
        if (!targetUserId) {
            setIsLoading(false)
            return
        }

        try {
            setIsLoading(true)

            // 사용자 정보 가져오기
            const userData = await fetchUserData(targetUserId)

            // 통계 정보 가져오기
            const stats = await fetchUserStats(targetUserId)

            // 사용자 정보 설정
            setAuthor({
                ...userData,
                stats,
                profileImageUrl: userData.profileImageUrl || '/profile.png',
                role: userData.bootcamp || '개발자',
                // blogname이 없을 경우 username을 사용
                blogname: userData.blogname || userData.username,
            })

            // 로그인 사용자라면 팔로우 상태 체크
            if (isLogin && loginUser.id !== targetUserId) {
                await checkFollowStatus(targetUserId)
            }

            // 디버깅: 사용자 정보 및 로그인 상태 로깅
            console.log('로그인 상태:', isLogin)
            console.log('로그인 사용자 ID:', loginUser.id)
            console.log('타겟 사용자 ID:', targetUserId)
            console.log('팔로우 상태:', hasFollowed)
        } catch (e: any) {
            console.error('사용자 정보 로드 오류:', e)
            setError(e.message)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUserProfile()
    }, [targetUserId, isLogin, loginUser.id])

    // 사용자 정보를 불러온 후 프로필 이미지 가져오기
    useEffect(() => {
        if (targetUserId) {
            fetchProfileImage(targetUserId)
        }
    }, [targetUserId])

    if (isLoading) {
        return <div className="bg-white rounded-lg shadow-sm p-6 mb-6">프로필 로딩 중...</div>
    }

    if (error || !author) {
        // 로그인하지 않은 경우 로그인 바를 표시
        if (!isLogin) {
            return (
                <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full overflow-hidden mb-3 bg-gray-100 flex items-center justify-center">
                            <img
                                src="/default-profile.png"
                                alt="기본 프로필"
                                className="w-10 h-10 object-cover opacity-50"
                            />
                        </div>
                        <p className="text-gray-500 mb-4 text-sm">로그인이 필요한 서비스입니다</p>
                        <Link
                            href="/login"
                            className="w-full py-2 bg-[#78B3CE] text-white rounded-md text-sm font-medium hover:bg-[#A8D5E5] transition-colors cursor-pointer !rounded-button whitespace-nowrap flex justify-center items-center"
                        >
                            로그인 하러 가기
                        </Link>
                        <Link
                            href="/signup"
                            className="w-full py-2 mt-2 border border-[#78B3CE] text-[#78B3CE] rounded-md text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer !rounded-button whitespace-nowrap flex justify-center items-center"
                        >
                            회원가입 하기
                        </Link>
                    </div>
                </div>
            )
        }

        // 다른 에러인 경우 기존 에러 메시지 표시
        return (
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                <p className="text-red-500">{error || '사용자 정보를 불러올 수 없습니다.'}</p>
            </div>
        )
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full overflow-hidden mb-3">
                    <img
                        src={profileImageUrl || '/default-profile.png'}
                        alt={`${author.username}의 프로필`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            // 이미지 로드 실패 시 기본 이미지로 대체
                            e.currentTarget.onerror = null
                            e.currentTarget.src = '/default-profile.png'
                        }}
                    />
                </div>
                <Link
                    href={isLogin && loginUser.id === author.id ? '/myBlog' : `/Blog/${author.blogname}`}
                    className="font-bold text-gray-800 hover:text-blue-600 cursor-pointer"
                >
                    {author.username}
                </Link>
                <p className="text-xs text-gray-500 mt-1">{author.role}</p>
                <div className="flex justify-between w-full mt-4 text-xs text-gray-600">
                    <div className="text-center">
                        <div className="font-bold">{author.stats.followers}</div>
                        <div>팔로워</div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold">{author.stats.following}</div>
                        <div>팔로잉</div>
                    </div>
                    <div className="text-center">
                        <div className="font-bold">{author.stats.posts}</div>
                        <div>게시글</div>
                    </div>
                </div>

                <div className="w-full mt-4 border-t border-gray-200 pt-4">
                    {/* 현재 사용자가 글 작성자인 경우: 글 작성하기 버튼 */}
                    {isLogin && loginUser.id === author.id ? (
                        <Link
                            href="/post/createPost"
                            className="w-full py-2 bg-[#78B3CE] text-white rounded-md text-sm font-medium hover:bg-[#A8D5E5] transition-colors cursor-pointer !rounded-button whitespace-nowrap flex justify-center items-center"
                        >
                            글 작성하기
                        </Link>
                    ) : /* 현재 사용자가 로그인 상태이고 글 작성자가 아닌 경우: 팔로우/언팔로우 버튼 */
                    isLogin && loginUser.id !== author.id ? (
                        <FollowButton
                            variant="fullWidth"
                            userId={author.id.toString()}
                            initialHasFollowed={hasFollowed}
                            onFollowStatusChange={(newStatus) => {
                                // 부모 컴포넌트 state 업데이트
                                setHasFollowed(newStatus)
                                setAuthor((prev) =>
                                    prev
                                        ? {
                                              ...prev,
                                              stats: {
                                                  ...prev.stats,
                                                  followers: prev.stats.followers + (newStatus ? 1 : -1),
                                              },
                                          }
                                        : prev,
                                )
                                // 디버깅용 로그 추가
                                console.log('팔로우 상태 변경:', newStatus)
                            }}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    )
}

export default AuthorProfile
