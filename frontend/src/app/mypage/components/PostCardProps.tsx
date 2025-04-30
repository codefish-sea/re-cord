import Link from 'next/link'

interface PostCardProps {
    post: {
        id: number
        userId: number
        title: string
        content: string
        createdAt: string
        views: number
        likes: number
    }
    showEditDelete?: boolean
    onDelete?: () => void
}

export default function PostCard({ post, showEditDelete, onDelete }: PostCardProps) {
    console.log('PostCard received post:', post) // ✅ 이거로 확인

    const API_FRONT_URL = process.env.NEXT_PUBLIC_FRONT_BASE_URL

    const mypostlink = () => {
        window.location.href = `${API_FRONT_URL}/post/postDetail/${post.userId}/${post.id}`
    }

    return (
        <div className="bg-white p-4 rounded shadow">
            <div className="flex items-start">
                <div className="flex-1 pr-6">
                    <div
                        onClick={mypostlink}
                        className="text-lg font-semibold mb-2 text-black hover:underline hover:text-blue-600 transition-colors cursor-pointer"
                    >
                        {post.title}
                    </div>
                    <div className="flex items-center mt-2 gap-6">
                        <span className="text-xs text-gray-400 w-[88px] inline-block">
                            {new Date(post.createdAt).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}
                        </span>
                        <div className="flex items-center gap-2">
                            {/* 조회수(눈) */}
                            <svg
                                className="w-4 h-4 text-gray-500"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                            </svg>
                            <span className="text-xs text-gray-700">{post.views}</span>
                            {/* 좋아요(하트) */}
                            <svg
                                className="w-4 h-4 text-[#F96E2A] ml-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                />
                            </svg>
                            <span className="text-xs text-gray-700">{post.likes}</span>
                        </div>
                    </div>
                </div>
                {/* {showEditDelete && (
                    <div className="flex gap-4">
                        <Link
                            href={`/edit-post/${post.id}`}
                            className="bg-[#78B3CE] text-white hover:opacity-90 py-1 px-3 rounded transition-colors font-medium"
                        >
                            수정
                        </Link>
                        <button
                            className="bg-[#F96E2A] text-white hover:opacity-90 py-1 px-3 rounded transition-colors font-medium"
                            onClick={onDelete}
                        >
                            삭제
                        </button>
                    </div>
                )} */}
            </div>
        </div>
    )
}
