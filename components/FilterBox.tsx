import { Filter } from "lucide-react";

export const FilterBotton = () => {
  return (
    <button className='flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-slate-200 hover:bg-slate-50'>
      <Filter size={18} />
      <span>Filter</span>
    </button>
  );
};
