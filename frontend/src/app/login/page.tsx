'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const router = useRouter()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
    const FRONT_BASE_URL = process.env.NEXT_PUBLIC_FRONT_BASE_URL
    const socialLoginForKakaoUrl = `${API_BASE_URL}/oauth2/authorization/kakao`
    const socialLoginForGithubUrl = `${API_BASE_URL}/oauth2/authorization/github`

    const redirectUrlAfterSocialLogin = `${FRONT_BASE_URL}/home`

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
                credentials: 'include', // 쿠키를 주고받기 위해 필요
            })

            if (response.ok) {
                // 로그인 성공 시 홈페이지로 이동
                window.location.href = '/'
            } else {
                const data = await response.json()
                setError(data.message || '로그인에 실패했습니다.')
            }
        } catch (err) {
            setError('회원정보가 일치하지 않습니다.')
            console.error('Login error:', err)
        }
    }

    return (
        <div className="flex-1 flex justify-center items-center bg-gray-50 py-6">
            <div className="w-full max-w-[500px] p-8 bg-white rounded-lg shadow-sm relative">
                <h1
                    className="text-[32px] font-extrabold text-center mb-[60px] mt-[36px] text-[#111827]"
                    style={{ fontFeatureSettings: '"kern" on' }}
                >
                    환영합니다
                </h1>
                <p className="text-gray-500 text-center text-sm mb-8">회고록 서비스를 이용하시려면 로그인해주세요.</p>

                {error && <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <input
                            type="email"
                            placeholder="이메일 주소"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full h-[50px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 focus:placeholder-transparent text-black"
                            required
                        />
                        <span
                            className="absolute left-[12px] top-[15px] w-[68px] h-[20px] text-[14px] leading-[20px] text-[#6B7280]"
                            style={{ fontFeatureSettings: '"kern" on' }}
                        ></span>
                    </div>
                    <div className="relative">
                        <input
                            type="password"
                            placeholder="비밀번호"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-[50px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 focus:placeholder-transparent text-black"
                            required
                        />
                        <span
                            className="absolute left-[12px] top-[15px] w-[68px] h-[20px] text-[14px] leading-[20px] text-[#6B7280]"
                            style={{ fontFeatureSettings: '"kern" on' }}
                        ></span>
                    </div>
                    <div>
                        <button
                            type="submit"
                            className="w-full h-[38px] flex justify-center items-center px-4 py-2 rounded-[8px] text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                            style={{
                                background:
                                    'linear-gradient(0deg, rgba(0, 0, 0, 0.001), rgba(0, 0, 0, 0.001)), #78B3CE',
                                border: '1px solid rgba(0, 0, 0, 0)',
                            }}
                        >
                            로그인
                        </button>
                    </div>
                </form>

                <div className="mt-8">
                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-2 bg-white text-gray-500">또는</span>
                        </div>
                    </div>

                    <div className="mt-6 space-y-3">
                        <a
                            href={`${socialLoginForKakaoUrl}?redirectUrl=${redirectUrlAfterSocialLogin}`}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-[#391B1B] bg-[#FEE500] hover:bg-[#FEE500]/90"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#391B1B">
                                <path
                                    fillRule="evenodd"
                                    d="M11.976 2.25c-6.075 0-11 3.826-11 8.544 0 2.981 1.982 5.592 4.956 7.072l-1.003 3.595a.75.75 0 001.075.831l4.29-2.85c.546.054 1.106.09 1.682.09 6.075 0 11-3.826 11-8.544s-4.925-8.544-11-8.544z"
                                />
                            </svg>
                            카카오톡으로 로그인
                        </a>
                        <a
                            href={`${socialLoginForGithubUrl}?redirectUrl=${redirectUrlAfterSocialLogin}`}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-white bg-black hover:bg-gray-900"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                            </svg>
                            GitHub로 로그인
                        </a>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <span className="text-gray-600">아직 회원이 아니신가요? </span>
                    <Link href="/signup" className="text-[#78B3CE] hover:text-[#5a9ab8] font-medium">
                        회원가입
                    </Link>
                </div>
            </div>
        </div>
    )
}
