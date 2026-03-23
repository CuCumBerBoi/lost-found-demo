import { Search } from "lucide-react";

export const SearchBar = () => {
  return (
    <div className='flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200'>
      <Search size={18} />
      <input
        type='text'
        placeholder='Search...'
        className='outline-none flex-1'
      />
    </div>
  );
};
