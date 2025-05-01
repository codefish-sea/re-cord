'use client'

import { useState, useEffect } from 'react'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

interface PostResponseDto {
    id: number
    title: string
    content: string
    username: string
    categoryName: string
    views: number
    likes: number
    createdAt: string
    imageUrls?: string[]
    blogName?: string
}

interface AuthorDto {
    id: number
    username: string
    email: string
    profileImage?: string
    bio?: string
    blogName?: string
}

interface UserIdResponseDto {
    userId: number
}

// userId 또는 blogName으로 최신 게시글 조회 가능하도록 수정
export const useLatestPost = (userIdOrBlogname: number | string, initialAuthor?: AuthorDto | null) => {
    const [post, setPost] = useState<PostResponseDto | null>(null)
    const [author, setAuthor] = useState<AuthorDto | null>(initialAuthor || null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [userId, setUserId] = useState<number | null>(typeof userIdOrBlogname === 'number' ? userIdOrBlogname : null)
    const [blogName, setBlogName] = useState<string | null>(
        typeof userIdOrBlogname === 'string' ? userIdOrBlogname : null,
    )
    const [apiCalled, setApiCalled] = useState(false)

    // 초기 로딩 상태 설정 - blogName이 있으면 로딩 중 상태 유지
    useEffect(() => {
        if (typeof userIdOrBlogname === 'string' && userIdOrBlogname) {
            // 블로그 이름이 제공된 경우 ID를 조회하는 동안 로딩 상태 유지
            setIsLoading(true)
        } else if (typeof userIdOrBlogname === 'number' && userIdOrBlogname <= 0) {
            // 유효하지 않은 ID가 직접 제공된 경우
            setIsLoading(false)
            setError('유효하지 않은 사용자 ID입니다.')
        }
    }, [userIdOrBlogname])

    // blogName으로 userId 조회하는 함수
    useEffect(() => {
        const fetchUserIdByBlogName = async () => {
            // blogName이 없거나 이미 userId가 있으면 실행하지 않음
            if (!blogName || userId !== null) {
                return
            }

            try {
                console.log(`API 호출 시작: ${API_BASE_URL}/api/auth/by-blogName/${blogName}`)

                // 타임아웃 설정 (5초)
                const timeoutId = setTimeout(() => {
                    console.log('API 호출 타임아웃')
                    setError('서버 응답이 없습니다. 백엔드 서버가 실행 중인지 확인해 주세요.')
                    setIsLoading(false)
                }, 5000)

                const response = await fetch(`${API_BASE_URL}/api/auth/by-blogName/${blogName}`)

                // 타임아웃 취소
                clearTimeout(timeoutId)

                if (!response.ok) {
                    throw new Error(`블로그를 찾을 수 없습니다 (상태: ${response.status})`)
                }

                const data: UserIdResponseDto = await response.json()
                console.log('useLatestPost: 사용자 ID 조회 성공:', data.userId)
                setUserId(data.userId)
                setError(null)
            } catch (err) {
                console.error('블로그 조회 오류:', err)
                setError(err instanceof Error ? err.message : '블로그를 불러오는 중 오류가 발생했습니다')
            } finally {
                setApiCalled(true)
            }
        }

        fetchUserIdByBlogName()
    }, [blogName, userId])

    // userId로 최신 게시글과 사용자 정보 조회
    useEffect(() => {
        const fetchLatestPost = async () => {
            // userId가 유효하지 않으면 API 호출을 하지 않음
            if (!userId) {
                // userId가 없는데 blogName도 없는 경우에만 오류 표시
                if (!blogName) {
                    setIsLoading(false)
                    setError('유효하지 않은 사용자 ID입니다.')
                }
                return
            }

            // userId가 0이면 API 호출하지 않음 (아직 실제 ID가 설정되지 않은 상태)
            if (userId === 0) {
                setIsLoading(false)
                // blogName이 있다면 ID 조회 중이므로 에러 메시지를 표시하지 않음
                if (!blogName) {
                    setError('유효하지 않은 사용자 ID입니다.')
                }
                return
            }

            try {
                setIsLoading(true)

                // 이미 author 정보가 있다면 사용자 정보를 다시 가져오지 않음
                if (!author) {
                    try {
                        // 1. 사용자 정보 가져오기 (공개 API 엔드포인트 사용)
                        const userResponse = await fetch(`${API_BASE_URL}/api/auth/public/${userId}`, {
                            credentials: 'include',
                        })

                        // 공개 엔드포인트가 없거나 401 오류가 발생한 경우 기존 엔드포인트 시도
                        if (userResponse.status === 404 || userResponse.status === 401) {
                            console.log('공개 API 엔드포인트를 사용할 수 없습니다. 대체 엔드포인트 사용을 시도합니다.')
                            const fallbackResponse = await fetch(`${API_BASE_URL}/api/auth/${userId}`, {
                                credentials: 'include',
                            })

                            if (!fallbackResponse.ok) {
                                // 대체 엔드포인트도 실패하면 최소한의 정보로 진행 (오류 방지)
                                console.warn(`사용자 정보 조회 실패: ${fallbackResponse.status}`)
                                setAuthor({
                                    id: userId,
                                    username: blogName || `사용자 ${userId}`,
                                    email: '',
                                    blogName: blogName || undefined,
                                })
                            } else {
                                const userData = await fallbackResponse.json()
                                setAuthor(userData)
                            }
                        } else if (!userResponse.ok) {
                            throw new Error(`사용자 정보를 불러오는데 실패했습니다. 상태 코드: ${userResponse.status}`)
                        } else {
                            const userData = await userResponse.json()
                            setAuthor(userData)
                        }
                    } catch (userError) {
                        console.error('사용자 정보 로딩 오류:', userError)
                        // 사용자 정보를 가져오지 못하더라도 게시글은 계속 시도
                        setAuthor({
                            id: userId,
                            username: blogName || `사용자 ${userId}`,
                            email: '',
                            blogName: blogName || undefined,
                        })
                    }
                }

                // 2. 해당 사용자의 최신 게시글 가져오기
                const postResponse = await fetch(`${API_BASE_URL}/api/posts/public/latest/${userId}`, {
                    credentials: 'include',
                })

                if (!postResponse.ok) {
                    if (postResponse.status === 404) {
                        // 게시글이 없는 경우는 오류가 아님
                        setPost(null)
                    } else {
                        const errorText = await postResponse.text()
                        console.error('게시글 API 응답:', errorText)
                        throw new Error(`최신 게시글을 불러오는데 실패했습니다. 상태 코드: ${postResponse.status}`)
                    }
                } else {
                    try {
                        const postData = await postResponse.json()
                        setPost(postData)
                    } catch (jsonError) {
                        console.error('게시글 데이터 JSON 파싱 오류:', jsonError)
                        throw new Error('게시글 응답을 처리하는데 실패했습니다. 서버가 실행 중인지 확인해주세요.')
                    }
                }
            } catch (err) {
                console.error('데이터 로딩 오류:', err)
                setError(err instanceof Error ? err.message : '에러가 발생했습니다.')
            } finally {
                setIsLoading(false)
                setApiCalled(true)
            }
        }

        fetchLatestPost()
    }, [userId, author, blogName])

    // 개발 디버깅을 위한 상태 출력
    useEffect(() => {
        console.log('useLatestPost 상태:', {
            isLoading,
            error,
            userId,
            blogName,
            apiCalled,
            hasPost: !!post,
            hasAuthor: !!author,
        })
    }, [isLoading, error, userId, blogName, apiCalled, post, author])

    return { post, author, isLoading, error, apiCalled }
}
