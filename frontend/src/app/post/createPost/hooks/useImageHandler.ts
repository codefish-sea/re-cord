import { useState, useCallback } from 'react'

/**
 * 에디터에서 이미지 핸들링을 위한 커스텀 훅
 */
export const useImageHandler = (onImageDrop?: (file: File, dataUrl: string) => void) => {
    // 임시 이미지 저장 맵 (URL: File)
    const [tempImages, setTempImages] = useState<Map<string, File>>(new Map())

    // 드롭된 파일 처리
    const handleFileDrop = useCallback(
        async (file: File) => {
            if (!file.type.startsWith('image/')) {
                return
            }

            try {
                // 파일을 Data URL로 변환
                const dataUrl = await readFileAsDataURL(file)

                // 임시 이미지 맵에 추가
                setTempImages((prev) => {
                    const newMap = new Map(prev)
                    newMap.set(dataUrl, file)
                    return newMap
                })

                // onImageDrop 콜백 호출
                if (onImageDrop) {
                    onImageDrop(file, dataUrl)
                }

                return dataUrl
            } catch (error) {
                console.error('이미지 처리 중 오류:', error)
                return null
            }
        },
        [onImageDrop],
    )

    // 이미지 파일을 Data URL로 변환하는 유틸리티 함수
    const readFileAsDataURL = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    resolve(reader.result)
                } else {
                    reject(new Error('Failed to read file as data URL'))
                }
            }
            reader.onerror = () => reject(reader.error)
            reader.readAsDataURL(file)
        })
    }

    return {
        tempImages,
        setTempImages,
        handleFileDrop,
    }
}
