"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { setFilters } from '@/lib/features/product/productSlice';
import { useRouter, useSearchParams } from 'next/navigation';

const SearchBar = () => {
    const dispatch = useDispatch();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { filters, loading } = useSelector(state => state.product);

    const [inputValue, setInputValue] = useState(filters.search || '');

    // Sync input with redux state (for resets/URL sync)
    useEffect(() => {
        setInputValue(filters.search || '');
    }, [filters.search]);

    const handleSearch = useCallback((value) => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
            params.set('search', value);
        } else {
            params.delete('search');
        }
        params.set('page', '1'); // Reset to page 1

        router.push(`/shop?${params.toString()}`);
        dispatch(setFilters({ search: value }));
    }, [dispatch, router, searchParams]);

    // Debounce effect
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (inputValue !== (filters.search || '')) {
                handleSearch(inputValue);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [inputValue, handleSearch, filters.search]);

    const clearSearch = () => {
        setInputValue('');
        handleSearch('');
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto mb-8">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {loading ? (
                        <Loader2 className="h-5 w-5 text-green-500 animate-spin" />
                    ) : (
                        <Search className="h-5 w-5 text-slate-400 group-focus-within:text-green-500 transition-colors" />
                    )}
                </div>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Search products using AI (e.g. 'headphones under 100')..."
                    className="block w-full pl-12 pr-12 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-green-500/20 focus:border-green-500 outline-none transition-all text-slate-700 placeholder:text-slate-400"
                />
                {inputValue && (
                    <button
                        onClick={clearSearch}
                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                )}
            </div>

            <div className="mt-2 flex items-center gap-2 px-1">
                <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Smart Search:</p>
                <div className="flex gap-2 flex-wrap">
                    {['Headphones under $50', 'Rating 4+', 'New Speakers'].map((chip) => (
                        <button
                            key={chip}
                            onClick={() => setInputValue(chip)}
                            className="text-[10px] bg-slate-100 hover:bg-green-50 hover:text-green-600 text-slate-500 py-1 px-2.5 rounded-full transition-colors border border-transparent hover:border-green-200"
                        >
                            {chip}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SearchBar;
