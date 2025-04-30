'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AuthorProfile from '@/components/post/AuthorProfile'
import CategoryMenu from '@/components/post/CategoryMenu'
import Statistics from '@/components/post/Statistics'
import SearchBar from '@/components/post/SearchBar'
import AuthorOtherPosts from '@/components/post/AuthorOtherPosts'
import PostComments from '@/components/comment/commentSection'
import Banner from '@/components/post/Banner'
import PostContent from '@/components/post/PostContent'
import { useGlobalLoginUser } from '@/app/stores/auth/loginUser'

interface Post {
  id: number
  title: string
  content: string
  categoryName: string | null
  categoryId?: number
  username: string | null
  userId: number
  views: number
  likes: number
  status: string | null
  updateStatus: string | null
  createdAt: string | null
  updatedAt: string | null
  imageUrls: string[]
  authorId?: number
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL!

// 🚩 게시글 데이터 가져오는 커스텀 훅
const usePostData = (postId: string) => {
  const [post, setPost] = useState<Post | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/posts/public/${postId}`, {
          credentials: 'include',
        })
        if (res.status === 403) {
          throw new Error('BLOCKED')
        }
        if (!res.ok) {
          if (res.status === 404) throw new Error('NOT_FOUND')
          if (res.status === 500) throw new Error('SERVER_ERROR')
          throw new Error('LOAD_ERROR')
        }
        const data = await res.json()
        setPost(data)
      } catch (e: any) {
        setError(e.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchPost()
  }, [postId])

  return { post, isLoading, error }
}

const PostDetail: React.FC = () => {
  const params = useParams()
  const router = useRouter()
  const postId = params.postId as string
  const userId = params.userId as string
  const { post, isLoading, error } = usePostData(postId)
  const { loginUser } = useGlobalLoginUser()

  // 🚩 이 플래그로 alert 한 번만 띄우기
  const [handledBlocked, setHandledBlocked] = useState(false)

  // 🚩 BLOCKED 에러가 나면 한 번만 alert → back
  useEffect(() => {
    if (error === 'BLOCKED' && !handledBlocked) {
      setHandledBlocked(true)
      alert('사용할 수 없는 게시물입니다')
      router.back()
    }
  }, [error, handledBlocked, router])

  // 🚩 BLOCKED 상태일 땐 일단 아무것도 렌더링하지 않음
  if (error === 'BLOCKED') {
    return null
  }

  if (isLoading) {
    return <div>게시글 로딩 중...</div>
  }

  if (error) {
    const msg =
      error === 'NOT_FOUND'
        ? '게시글을 찾을 수 없습니다.'
        : error === 'SERVER_ERROR'
        ? '서버 오류가 발생했습니다.'
        : '알 수 없는 오류가 발생했습니다.'
    return <div>에러: {msg}</div>
  }

  if (!post) {
    return <div>게시글이 없습니다.</div>
  }

  return (
    <div className="min-h-screen bg-white">
      <Banner />
      <div className="h-6" />

      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row">
        {/* 좌측 사이드바 */}
        <div className="w-full md:w-56 md:mr-8">
          <AuthorProfile userId={Number(userId)} />
          <SearchBar />
          <CategoryMenu userId={Number(userId)} />
          {userId != null && <Statistics userId={Number(userId)} />}
        </div>

        {/* 메인 콘텐츠 영역 */}
        <div className="flex-1 mt-6 md:mt-0">
          <PostContent
            post={{
              ...post,
              userId: Number(userId),
              categoryId: post.categoryId || 1,
              imageUrls: post.imageUrls || [],
            }}
            loginUserId={loginUser?.id}
          />

          <PostComments postId={Number(postId)} />
          <AuthorOtherPosts authorId={Number(userId)} />
        </div>
      </div>
    </div>
  )
}

export default PostDetail
