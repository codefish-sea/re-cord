'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export default function SignupPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const tempToken = searchParams?.get('token') ?? ''

    const [email, setEmail] = useState('')
    const [bootcamp, setBootcamp] = useState('')
    const [generation, setGeneration] = useState('')
    const [error, setError] = useState('')
    const [isEmailChecking, setIsEmailChecking] = useState(false)
    const [emailCheckMessage, setEmailCheckMessage] = useState('')
    const [isEmailChecked, setIsEmailChecked] = useState(false)
    const [oauthId, setOauthId] = useState('')

    useEffect(() => {
        const verifyToken = async () => {
            if (!tempToken) {
                setError('유효하지 않은 접근입니다.')
                return
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/temp-token/verify`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token: tempToken }),
                })

                if (response.ok) {
                    const data = await response.json()
                    setEmail(data.email || '')
                    setOauthId(data.oauthId || '')

                    if (data.email) {
                        setIsEmailChecked(true)
                        setEmailCheckMessage('이메일이 확인되었습니다.')
                    } else {
                        setIsEmailChecked(false)
                        setEmailCheckMessage('')
                    }
                } else {
                    setError('토큰이 만료되었거나 유효하지 않습니다. 다시 로그인해주세요.')
                }
            } catch (error) {
                setError('토큰 검증 중 오류가 발생했습니다. 다시 로그인해주세요.')
            }
        }

        verifyToken()
    }, [tempToken])

    const checkEmailDuplicate = async () => {
        if (!email) {
            setEmailCheckMessage('이메일을 입력해주세요.')
            return
        }
        setIsEmailChecking(true)
        setEmailCheckMessage('')

        try {
            const response = await fetch(`${API_BASE_URL}/api/auth/check-email?email=${encodeURIComponent(email)}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            const data = await response.text()

            if (response.ok) {
                setEmailCheckMessage(data)
                setIsEmailChecked(true)
            } else {
                setEmailCheckMessage(data)
                setIsEmailChecked(false)
            }
        } catch (error) {
            console.error('이메일 중복 확인 오류:', error)
            setEmailCheckMessage('이메일 중복 확인 중 오류가 발생했습니다.')
            setIsEmailChecked(false)
        } finally {
            setIsEmailChecking(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!email) {
            setError('이메일을 입력해주세요.')
            return
        }

        if (!isEmailChecked) {
            setError('이메일 중복검사를 진행해주세요.')
            return
        }

        if (!bootcamp) {
            setError('부트캠프를 선택해주세요.')
            return
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/oauth2/complete-signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    oauthId,
                    email,
                    bootcamp: bootcamp || null,
                    generation: generation || null,
                }),
            })

            if (response.ok) {
                alert('회원가입이 완료되었습니다')
                router.push('/login')
            } else {
                const error = await response.text()
                console.error('회원가입 오류:', error)
                setError('회원가입 중 오류가 발생했습니다.')
            }
        } catch (error) {
            console.error('회원가입 오류:', error)
            setError('회원가입 중 오류가 발생했습니다.')
        }
    }

    return (
        <div className="flex-1 flex justify-center items-center bg-gray-50 py-6">
            <div className="w-full max-w-[500px] p-8 bg-white rounded-lg shadow-sm relative">
                <h1 className="text-3xl font-bold text-center mb-8 text-[#111827]">추가 정보 입력</h1>
                <p className="text-center text-gray-500 mb-8">회고록 서비스 이용을 위해 추가 정보를 입력해주세요.</p>

                {error && <div className="mb-4 p-2 text-sm text-red-600 bg-red-50 rounded-md">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="relative">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                            이메일 <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-3">
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value)
                                    setIsEmailChecked(false)
                                    setEmailCheckMessage('')
                                }}
                                required
                                className="flex-1 h-[50px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 focus:placeholder-transparent text-black"
                                placeholder="이메일 주소"
                            />
                            <button
                                type="button"
                                onClick={checkEmailDuplicate}
                                disabled={isEmailChecking}
                                className="px-6 py-2 text-sm font-medium text-white rounded-md whitespace-nowrap"
                                style={{
                                    background:
                                        'linear-gradient(0deg, rgba(0, 0, 0, 0.001), rgba(0, 0, 0, 0.001)), #78B3CE',
                                    border: '1px solid rgba(0, 0, 0, 0)',
                                    opacity: isEmailChecking ? 0.7 : 1,
                                }}
                            >
                                {isEmailChecking ? '확인 중...' : '중복확인'}
                            </button>
                        </div>
                        {emailCheckMessage && (
                            <p className={`mt-1 text-sm ${isEmailChecked ? 'text-green-600' : 'text-red-600'}`}>
                                {emailCheckMessage}
                            </p>
                        )}
                    </div>

                    <div className="relative">
                        <label htmlFor="bootcamp" className="block text-sm font-medium text-gray-700 mb-1">
                            부트캠프 <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                id="bootcamp"
                                value={bootcamp}
                                onChange={(e) => setBootcamp(e.target.value)}
                                required
                                className="w-full h-[50px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 focus:placeholder-transparent text-black appearance-none bg-white pr-10"
                            >
                                <option value="" className="text-gray-400">
                                    부트캠프를 선택해주세요
                                </option>
                                <option value="멋쟁이 사자처럼">멋쟁이 사자처럼</option>
                                <option value="SSAFY">SSAFY</option>
                                <option value="우아한 테크코스">우아한 테크코스</option>
                                <option value="항해 99">항해 99</option>
                                <option value="네이버 부스트캠프">네이버 부스트캠프</option>
                                <option value="스파르타">스파르타</option>
                                <option value="프로그래머스 데브코스">프로그래머스 데브코스</option>
                                <option value="한화시스템 BEYOND SW캠프">한화시스템 BEYOND SW캠프</option>
                                <option value="그 외">그 외</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <label htmlFor="generation" className="block text-sm font-medium text-gray-700 mb-1">
                            과정/기수 (선택)
                        </label>
                        <input
                            id="generation"
                            type="text"
                            value={generation}
                            onChange={(e) => setGeneration(e.target.value)}
                            className="w-full h-[50px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 focus:placeholder-transparent text-black"
                            placeholder="자바 백엔드/13기"
                        />
                    </div>

                    <div className="mt-6">
                        <button
                            type="submit"
                            className="w-full h-[38px] flex justify-center items-center px-4 py-2 rounded-[8px] text-white shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]"
                            style={{
                                background:
                                    'linear-gradient(0deg, rgba(0, 0, 0, 0.001), rgba(0, 0, 0, 0.001)), #78B3CE',
                                border: '1px solid rgba(0, 0, 0, 0)',
                            }}
                        >
                            가입 완료
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
