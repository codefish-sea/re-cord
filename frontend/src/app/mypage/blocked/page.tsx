
import { SearchBar } from '@/app/mypage/components/SearchBar'
import { BlockList } from '@/components/block/blockList'


export default function BlockedPage() {
    return (
        <div className="bg-gray-50 p-6 rounded-lg">
            <h1 className="text-2xl font-bold mb-6">차단 유저</h1>
            <SearchBar placeholder="차단한 사용자 검색" />
            <BlockList />
        </div>
    )
}
