"use client";

import { Search, X } from "lucide-react";

interface SearchFilterProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  resultCount?: number;
  totalCount?: number;
}

export default function SearchFilter({
  value,
  onChange,
  placeholder = "Search strains...",
  resultCount,
  totalCount,
}: SearchFilterProps) {
  return (
    <div className="glass rounded-full flex items-center gap-3 px-4 py-2.5 focus-within:ring-2 focus-within:ring-brand-400/40 transition-shadow">
      <Search className="h-4 w-4 text-brand-400" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 outline-none"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="rounded-full p-1 text-white/40 transition-colors hover:bg-white/10 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      {resultCount !== undefined && totalCount !== undefined && (
        <span className="text-xs text-white/40">
          {resultCount}/{totalCount}
        </span>
      )}
    </div>
  );
}
