'use client'

import React, { ReactNode, useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import Quill from 'quill'
import 'quill/dist/quill.snow.css' // 기본 스타일
import { useImageHandler } from '@/app/post/createPost/hooks/useImageHandler'

// 컴포넌트 ref 타입 정의
export interface ContentEditorRef {
    processContentBeforeSubmit: (uploadFunction?: (file: File) => Promise<string>) => Promise<string>
}

interface ContentEditorProps {
    value: string
    onChange: (content: string) => void
    height?: number
    actions?: ReactNode
    plainTextMode?: boolean
    onImageDrop?: (file: File, dataUrl: string) => void
    uploadImageToS3?: (file: File) => Promise<string>
}

const ContentEditor = forwardRef<ContentEditorRef, ContentEditorProps>(
    ({ value, onChange, height = 500, actions, plainTextMode = false, onImageDrop, uploadImageToS3 }, ref) => {
        const quillRef = useRef<Quill | null>(null)
        const editorRef = useRef<HTMLDivElement>(null)
        const [editorContent, setEditorContent] = useState(value || '')

        // 이미지 핸들링 로직을 별도 훅으로 분리
        const { tempImages, setTempImages, handleFileDrop } = useImageHandler(onImageDrop)

        // Quill 에디터 초기화
        useEffect(() => {
            if (editorRef.current && !quillRef.current) {
                const toolbarOptions = plainTextMode
                    ? false
                    : [
                          [{ header: [1, 2, 3, 4, 5, 6, false] }],
                          ['bold', 'italic', 'underline', 'strike'],
                          [{ list: 'ordered' }, { list: 'bullet' }],
                          [{ script: 'sub' }, { script: 'super' }],
                          [{ indent: '-1' }, { indent: '+1' }],
                          [{ direction: 'rtl' }],
                          [{ color: [] }, { background: [] }],
                          [{ align: [] }],
                          ['blockquote', 'code-block'],
                          ['link', 'image', 'video'],
                          ['clean'],
                      ]

                const options = {
                    modules: {
                        toolbar: toolbarOptions,
                        clipboard: {
                            matchVisual: false,
                        },
                    },
                    placeholder: '내용을 입력하세요...',
                    theme: 'snow',
                }

                // Quill 인스턴스 생성
                const quill = new Quill(editorRef.current, options)

                // 초기 컨텐츠 설정
                quill.root.innerHTML = value || ''

                // 변경 이벤트 핸들러 설정
                quill.on('text-change', () => {
                    const content = quill.root.innerHTML
                    setEditorContent(content)
                    onChange(content)
                })

                quillRef.current = quill

                // 이미지 드롭 이벤트 설정
                if (onImageDrop) {
                    const editor = quill.root

                    const handleDrop = async (e: DragEvent) => {
                        e.preventDefault()
                        e.stopPropagation()

                        if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
                            const file = e.dataTransfer.files[0]
                            if (file.type.startsWith('image/')) {
                                const dataUrl = await handleFileDrop(file)
                                if (dataUrl && quill) {
                                    // 커서 위치에 이미지 삽입
                                    const range = quill.getSelection() || { index: quill.getLength(), length: 0 }
                                    quill.insertEmbed(range.index, 'image', dataUrl)
                                }
                            }
                        }
                    }

                    const handleDragOver = (e: DragEvent) => {
                        e.preventDefault()
                        e.stopPropagation()
                    }

                    editor.addEventListener('drop', handleDrop)
                    editor.addEventListener('dragover', handleDragOver)

                    // 클린업 함수
                    return () => {
                        editor.removeEventListener('drop', handleDrop)
                        editor.removeEventListener('dragover', handleDragOver)
                    }
                }
            }
        }, [editorRef, plainTextMode, value, onChange, onImageDrop, handleFileDrop])

        // 컨텐츠가 외부에서 변경되었을 때 에디터 내용 업데이트
        useEffect(() => {
            if (quillRef.current && value !== editorContent && value !== quillRef.current.root.innerHTML) {
                quillRef.current.root.innerHTML = value
            }
        }, [value, editorContent])

        // 게시하기 전 이미지 처리를 위한 함수
        const processContentBeforeSubmit = async (uploadFunction = uploadImageToS3): Promise<string> => {
            if (!uploadFunction || tempImages.size === 0) {
                return editorContent
            }

            // 현재 에디터 내용 가져오기
            let currentContent = editorContent
            const tempImageUrls = Array.from(tempImages.keys())

            try {
                // 모든 임시 이미지를 S3에 업로드하고 URL 치환
                for (const tempUrl of tempImageUrls) {
                    const file = tempImages.get(tempUrl)
                    if (file) {
                        // S3에 업로드하고 URL 받기
                        const s3Url = await uploadFunction(file)
                        // 본문에서 임시 URL을 S3 URL로 치환
                        currentContent = currentContent.replace(
                            new RegExp(tempUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                            s3Url,
                        )
                    }
                }

                // 임시 이미지 맵 초기화
                setTempImages(new Map())

                return currentContent
            } catch (error) {
                console.error('이미지 업로드 중 오류:', error)
                throw new Error('이미지 업로드 중 오류가 발생했습니다.')
            }
        }

        // ref를 통해 외부에서 함수를 호출할 수 있도록 설정
        useImperativeHandle(ref, () => ({
            processContentBeforeSubmit,
        }))

        return (
            <div className="editor-container w-full">
                <div className="quill-container w-full" style={{ height: `${height}px` }}>
                    <div ref={editorRef} className="w-full h-full" />
                </div>

                {/* 버튼 영역 */}
                {actions && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                        <div className="flex justify-end items-center">{actions}</div>
                    </div>
                )}

                <style jsx>{`
                    .editor-container {
                        display: flex;
                        flex-direction: column;
                        width: 100%;
                    }
                    .quill-container {
                        height: ${height}px;
                        width: 100%;
                    }
                    :global(.ql-container) {
                        font-size: 16px;
                        height: calc(${height}px - 42px); /* 툴바 높이를 고려해 조정 */
                        overflow-y: hidden; /* 외부 컨테이너의 스크롤 제거 */
                    }
                    :global(.ql-editor) {
                        min-height: calc(${height}px - 42px);
                        max-height: calc(${height}px - 42px);
                        padding: 1rem;
                        overflow-y: auto; /* 내부 편집기에만 스크롤 적용 */
                    }
                    :global(.ql-toolbar) {
                        border-top-left-radius: 0.375rem;
                        border-top-right-radius: 0.375rem;
                    }
                `}</style>
            </div>
        )
    },
)

// 정적 메서드를 사용하는 대신 유틸리티 함수로 분리
export const processEditorContent = async (
    editorRef: React.RefObject<ContentEditorRef>,
    uploadFunction?: (file: File) => Promise<string>,
): Promise<string | null> => {
    if (editorRef.current) {
        try {
            return await editorRef.current.processContentBeforeSubmit(uploadFunction)
        } catch (error) {
            console.error('콘텐츠 처리 중 오류:', error)
            return null
        }
    }

    return null
}

// 컴포넌트 표시 이름 설정
ContentEditor.displayName = 'ContentEditor'

export default ContentEditor
