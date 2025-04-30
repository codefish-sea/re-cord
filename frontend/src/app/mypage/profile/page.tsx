'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
const API_FRONT_URL = process.env.NEXT_PUBLIC_FRONT_BASE_URL
const bootcampOptions = [
    '멋쟁이 사자처럼',
    'SSAFY',
    '우아한 테크코스',
    '항해 99',
    '네이버 부스트캠프',
    '스파르타',
    '프로그래머스 데브코스',
    '한화시스템 BEYOND SW캠프',
    '그 외',
]
export default function ProfilePage() {
    const [profileImage, setProfileImage] = useState<string | null>(null)
    const [userData, setUserData] = useState({
        username: '',
        email: '',
        bootcamp: '',
        generation: '',
        profileImageUrl: '',
        introduction: '', // <- null 말고 빈 문자열
    })

    // 기본 프로필 이미지 URL
    const defaultProfileImageUrl = '/default-profile.png'

    // // 쿠키에서 액세스 토큰 가져오기
    // const getAccessTokenFromCookie = () => {
    //     const cookies = document.cookie.split(';')
    //     for (let cookie of cookies) {
    //         const [name, value] = cookie.trim().split('=')
    //         if (name === 'accessToken') {
    //             return value
    //         }
    //     }
    //     return null
    // }

    // 유저 데이터 API에서 받아오기
    useEffect(() => {
        // const accessToken = getAccessTokenFromCookie()

        fetch(`${API_BASE_URL}/api/mypage/users`, {
            headers: {
                'Content-Type': 'application/json',
                // Authorization: `Bearer ${accessToken}`,
            },
            credentials: 'include',
        })
            .then((res) => res.json())
            .then((data) => {
                setUserData(data)
                // 유저가 프로필 이미지를 가지고 있으면 그 URL을 사용
                if (data.profileImageUrl) {
                    setProfileImage(data.profileImageUrl)
                } else {
                    // 프로필 이미지가 없으면 기본 프로필 사용
                    setProfileImage(defaultProfileImageUrl)
                }
            })
            .catch((err) => {
                console.error('API 호출 실패:', err)
                setProfileImage(defaultProfileImageUrl) // 기본 이미지로
            })
    }, [])

    // 이미지 변경 처리
    // 길이가 너무 길어서 적용이 안됨, 추후 S3 필요
    // const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    //     const file = e.target.files?.[0]
    //     if (file) {
    //         if (file.size > 2 * 1024 * 1024) {
    //             alert('파일 크기는 2MB를 초과할 수 없습니다.')
    //             return
    //         }
    //         const reader = new FileReader()
    //         reader.onloadend = () => {
    //             setProfileImage(reader.result as string)
    //         }
    //         reader.readAsDataURL(file)
    //     }
    // }
    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (file.size > 2 * 1024 * 1024) {
            alert('파일 크기는 2MB를 초과할 수 없습니다.')
            return
        }
        const formData = new FormData()
        formData.append('file', file)

        try {
            const response = await fetch(`${API_BASE_URL}/api/mypage/me/profile-image`, {
                method: 'PUT',
                body: formData,
                credentials: 'include', // 꼭 있어야 쿠키 보내짐
            })

            if (!response.ok) {
                throw new Error('프로필 이미지 업로드 실패')
            }

            const uploadedUrl = await response.text()
            
            // URL 처리 로직 추가 - 배포 환경에서의 URL 형식 처리
            let formattedUrl = uploadedUrl
            if (uploadedUrl && !uploadedUrl.startsWith('http') && 
                uploadedUrl !== '/profile.jpg' && uploadedUrl !== '/default-profile.png') {
                // 상대 경로인 경우 API_BASE_URL과 결합
                formattedUrl = uploadedUrl.startsWith('/') 
                    ? `${API_BASE_URL}${uploadedUrl}` 
                    : `${API_BASE_URL}/${uploadedUrl}`
            }
            
            setProfileImage(formattedUrl)

            // 유저 데이터에도 바로 넣어주자 (저장할 때 같이 보내기 위해)
            setUserData((prev) => ({
                ...prev,
                profileImageUrl: formattedUrl,
            }))
            
            console.log('이미지 업로드 성공:', formattedUrl)
        } catch (err) {
            console.error('이미지 업로드 에러:', err)
            alert('이미지 업로드에 실패했습니다.')
        }
    }

    // 데이터 저장 처리
    const handleSave = () => {
        // const accessToken = getAccessTokenFromCookie()

        // 수정된 데이터 저장 로직
        fetch(`${API_BASE_URL}/api/mypage/updateUsers`, {
            method: 'PUT',
            body: JSON.stringify({
                username: userData.username,
                email: userData.email,
                bootcamp: userData.bootcamp,
                generation: userData.generation,
                profileImageUrl: profileImage,
                introduction: userData.introduction,
            }),
            headers: {
                'Content-Type': 'application/json',
                // Authorization: `Bearer ${accessToken}`,
            },
            credentials: 'include',
        }).then(async (res) => {
            const text = await res.text()
            if (!text) {
                // 응답 본문이 비어있으면 기본 메시지 띄움
                alert('저장 성공 (서버 응답 없음)')
                return
            }

            try {
                const updatedData = JSON.parse(text)
                setUserData(updatedData)
                alert('저장되었습니다.')
            } catch (err) {
                console.error('JSON 파싱 에러:', err)
                alert('응답을 처리할 수 없습니다.')
            }
        })
    }
    const handleDeleteAccount = () => {
        window.location.href = `${API_FRONT_URL}/withdraw`
    }

    return (
        <div className="bg-white rounded-lg shadow-sm p-8">
            <h1 className="text-2xl font-bold mb-8 text-gray-900">마이페이지</h1>

            <div className="mb-10">
                <h2 className="text-xl font-semibold mb-6 text-gray-900">계정 설정</h2>

                <div className="space-y-6">
                    <div>
                        <p className="text-base font-medium text-gray-800 mb-2">프로필 사진</p>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded overflow-hidden bg-gray-100 flex items-center justify-center">
                                <img
                                    src={profileImage || defaultProfileImageUrl}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <label className="px-4 py-2 bg-white border border-gray-300 rounded cursor-pointer hover:bg-gray-50 text-sm font-medium text-gray-800">
                                사진 변경
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/jpeg, image/png"
                                    onChange={handleImageChange}
                                />
                            </label>
                            <p className="text-sm text-gray-700">JPG, PNG 파일 (최대 2MB)</p>
                        </div>
                    </div>
                    {/* 다른 입력 필드들 */}
                    <div>
                        <label className="block text-base font-medium text-gray-800 mb-2">이메일</label>
                        <input
                            type="email"
                            className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 text-gray-500 cursor-not-allowed"
                            value={userData.email}
                            disabled
                        />
                    </div>

                    <div>
                        <label className="block text-base font-medium text-gray-800 mb-2">닉네임</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
                            value={userData.username}
                            onChange={(e) => setUserData({ ...userData, username: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-base font-medium text-gray-800 mb-2">부트캠프</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
                            value={userData.bootcamp}
                            onChange={(e) => setUserData({ ...userData, bootcamp: e.target.value })}
                        >
                            <option value="">선택하세요</option>
                            {bootcampOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-base font-medium text-gray-800 mb-2">과정/기수</label>
                        <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-800"
                            value={userData.generation}
                            onChange={(e) => setUserData({ ...userData, generation: e.target.value })}
                            placeholder="멋쟁이사자처럼/13기"
                        />
                    </div>
                    <div>
                        <label className="block text-base font-medium text-gray-800 mb-2">자기소개</label>
                        <textarea
                            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 min-h-[100px] text-gray-800"
                            value={userData.introduction || ''}
                            onChange={(e) => setUserData({ ...userData, introduction: e.target.value })}
                        />
                    </div>

                    <div className="flex justify-between pt-4">
                        <button
                            onClick={handleDeleteAccount}
                            className="px-4 py-2 bg-[#F96E2A] text-white rounded hover:bg-[#e65c15] font-medium"
                        >
                            회원 탈퇴
                        </button>

                        <div className="flex space-x-2">
                            <button className="px-4 py-2 border border-gray-300 rounded text-gray-800 font-medium hover:bg-gray-50">
                                취소
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-4 py-2 bg-[#78B3CE] text-white rounded hover:bg-[#5A8BA6] font-medium"
                            >
                                저장하기
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
