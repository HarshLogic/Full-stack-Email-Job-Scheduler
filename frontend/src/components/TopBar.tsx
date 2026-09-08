import { Search, Filter, RefreshCw } from 'lucide-react';

interface TopBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onRefresh: () => void;
}

export default function TopBar({ searchQuery, setSearchQuery, onRefresh }: TopBarProps) {
  return (
    <div className="flex items-center px-6 py-4 border-b border-blue-200 bg-white">
      <div className="flex-1 max-w-2xl relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search"
          className="w-full pl-10 pr-4 py-2 bg-[#f3f4f6] border-transparent rounded-full text-sm outline-none focus:bg-white focus:border-gray-300 focus:ring-0 transition"
        />
      </div>
      
      <div className="ml-6 flex items-center space-x-4">
        <button className="text-gray-400 hover:text-gray-600 transition">
          <Filter className="w-5 h-5" />
        </button>
        <button onClick={onRefresh} className="text-gray-400 hover:text-gray-600 transition">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
