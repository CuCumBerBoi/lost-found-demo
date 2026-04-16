import { Search } from "lucide-react";

export const SearchBar = () => {
  return (
    <div className='flex items-center gap-2.5 px-4 py-2.5 bg-gradient-to-r from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all duration-200 group'>
      <Search size={16} className='text-indigo-500 shrink-0 group-hover:text-indigo-600 transition-colors' />
      <input
        type='text'
        placeholder='ค้นหา...'
        className='outline-none flex-1 bg-transparent text-slate-700 placeholder:text-slate-400 text-sm font-medium'
      />
    </div>
  );
};
