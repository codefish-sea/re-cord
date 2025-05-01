'use client'

import { useEffect, useState } from 'react'
import { LoginUserContext, useLoginUser } from './stores/auth/loginUser'
import Footer from '@/components/layout/Footer'
import Header from '@/components/layout/Header'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const [isMounted, setIsMounted] = useState(false)
    const { loginUser, setLoginUser, isLoginUserPending, setNoLoginUser, isLogin, logout, logoutAndHome } =
        useLoginUser()

    // 전역관리를 위한 Store 등록
    const loginUserContextValue = {
        loginUser,
        setLoginUser,
        isLoginUserPending,
        setNoLoginUser,
        isLogin,
        logout,
        logoutAndHome,
    }

    useEffect(() => {
        setIsMounted(true)

        fetch(`${API_BASE_URL}/api/auth/me`, {
            credentials: 'include',
        })
            .then(async (response) => {
                const contentType = response.headers.get('content-type')

                if (response.ok && contentType?.includes('application/json')) {
                    const data = await response.json()
                    setLoginUser(data)
                } else {
                    setNoLoginUser()
                    console.log('⚠️ 로그인되지 않은 사용자')
                }
            })
            .catch((error) => {
                console.error('❌ 사용자 정보 불러오기 실패:', error)
                setNoLoginUser()
            })
    }, [])

    // SSR mismatch 방지
    if (!isMounted || isLoginUserPending) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="text-2xl font-bold">로딩중...</div>
            </div>
        )
    }

    return (
        <LoginUserContext.Provider
            value={{
                loginUser,
                setLoginUser,
                isLoginUserPending,
                // setNoLoginUser,
                isLogin,
                logout,
                logoutAndHome,
            }}
        >
            <main className="flex flex-col min-h-screen">
                <Header />
                {children}
                <Footer />
            </main>
        </LoginUserContext.Provider>
    )
}
