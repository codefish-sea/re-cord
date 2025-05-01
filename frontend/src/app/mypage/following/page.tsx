import { SearchBar } from '@/app/mypage/components/SearchBar';
import { FollowerList } from '@/components/follow/FollowerList';

export default function FollowingPage() {
  
  return (
    <div className="bg-gray-50 p-6 rounded-lg">
      <h1 className="text-2xl font-bold mb-6">팔로잉</h1>
      <SearchBar placeholder="팔로잉 검색" />
      <FollowerList />
    </div>
  );
}
