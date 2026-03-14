'use client'
import { Suspense } from "react"
import ProductCard from "@/components/ProductCard"
import { MoveLeftIcon } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSelector } from "react-redux"

import { useDispatch } from "react-redux"
import { fetchProducts, setFilters, resetFilters } from "@/lib/features/product/productSlice"
import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight, Filter, X, Loader2, Search } from "lucide-react"
import { categories } from "@/assets/assets"
import SearchBar from "@/components/SearchBar"

function ShopContent() {

    const searchParams = useSearchParams()
    const router = useRouter()
    const dispatch = useDispatch()

    const { list: products, totalPages, filters } = useSelector(state => state.product)
    const page = parseInt(searchParams.get('page')) || 1

    const [isFilterOpen, setIsFilterOpen] = useState(false)

    // Sync URL params to Redux on mount and URL change
    useEffect(() => {
        const urlFilters = {
            category: searchParams.get('category') || '',
            minPrice: searchParams.get('minPrice') || '',
            maxPrice: searchParams.get('maxPrice') || '',
            rating: searchParams.get('rating') || '',
            inStock: searchParams.get('inStock') === 'true',
            search: searchParams.get('search') || ''
        }
        dispatch(setFilters(urlFilters))
    }, [searchParams, dispatch])

    // Fetch products when filters or page changes
    useEffect(() => {
        dispatch(fetchProducts({ page, ...filters }))
    }, [page, filters, dispatch])

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value }
        updateUrl(newFilters, 1) // Reset to page 1 on filter change
    }

    const updateUrl = (newFilters, newPage) => {
        const params = new URLSearchParams()
        if (newPage > 1) params.set('page', newPage.toString())
        if (newFilters.category) params.set('category', newFilters.category)
        if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice)
        if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice)
        if (newFilters.rating) params.set('rating', newFilters.rating)
        if (newFilters.inStock) params.set('inStock', 'true')
        if (newFilters.search) params.set('search', newFilters.search)

        router.push(`/shop?${params.toString()}`)
    }

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            updateUrl(filters, newPage)
        }
    }

    const handleReset = () => {
        dispatch(resetFilters())
        router.push('/shop')
    }

    return (
        <div className="min-h-[70vh] mx-6">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8 py-8">

                {/* Filter Sidebar */}
                <aside className={`fixed md:relative z-40 bg-white w-64 h-full md:h-auto overflow-y-auto transition-all duration-300 left-0 top-0 p-6 md:p-0 border-r md:border-none ${isFilterOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
                    <div className="flex items-center justify-between mb-6 md:hidden">
                        <h2 className="text-xl font-semibold">Filters</h2>
                        <button onClick={() => setIsFilterOpen(false)}><X size={24} /></button>
                    </div>

                    <div className="space-y-8">
                        {/* Categories */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-4 tracking-wider uppercase">Category</h3>
                            <div className="flex flex-col gap-2">
                                <label className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900">
                                    <input
                                        type="radio"
                                        name="category"
                                        checked={!filters.category}
                                        onChange={() => handleFilterChange('category', '')}
                                        className="accent-green-600"
                                    />
                                    All Categories
                                </label>
                                {categories.map((cat) => (
                                    <label key={cat} className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900 text-sm">
                                        <input
                                            type="radio"
                                            name="category"
                                            checked={filters.category === cat}
                                            onChange={() => handleFilterChange('category', cat)}
                                            className="accent-green-600"
                                        />
                                        {cat}
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Price Range */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-4 tracking-wider uppercase">Price Range</h3>
                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.minPrice}
                                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-green-600"
                                />
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.maxPrice}
                                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                                    className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:border-green-600"
                                />
                            </div>
                        </div>

                        {/* Rating */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-4 tracking-wider uppercase">Rating</h3>
                            <div className="flex flex-col gap-2">
                                {[4, 3, 2, 1].map((star) => (
                                    <label key={star} className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900 text-sm">
                                        <input
                                            type="radio"
                                            name="rating"
                                            checked={parseInt(filters.rating) === star}
                                            onChange={() => handleFilterChange('rating', star.toString())}
                                            className="accent-green-600"
                                        />
                                        {star} Stars & Up
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Availability */}
                        <div>
                            <h3 className="text-sm font-semibold text-slate-900 mb-4 tracking-wider uppercase">Availability</h3>
                            <label className="flex items-center gap-2 cursor-pointer text-slate-600 hover:text-slate-900 text-sm">
                                <input
                                    type="checkbox"
                                    checked={filters.inStock}
                                    onChange={(e) => handleFilterChange('inStock', e.target.checked)}
                                    className="accent-green-600 size-4"
                                />
                                In Stock Only
                            </label>
                        </div>

                        <button
                            onClick={handleReset}
                            className="w-full py-2 border border-slate-300 rounded-md text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Reset All Filters
                        </button>
                    </div>
                </aside>

                {/* Product Section */}
                <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                        <h1 onClick={() => router.push('/shop')} className="text-2xl text-slate-500 flex items-center gap-2 cursor-pointer">
                            {(filters.search || filters.category) && <MoveLeftIcon size={20} />}
                            All <span className="text-slate-700 font-medium">Products</span>
                            {filters.category && <span className="text-lg text-slate-400 font-normal ml-2">({filters.category})</span>}
                        </h1>

                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className="md:hidden flex items-center gap-2 px-4 py-2 border rounded-md text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            <Filter size={18} /> Filters
                        </button>
                    </div>

                    <SearchBar />

                    <div className="relative min-h-[400px]">
                        {/* Loading Overlay */}
                        {useSelector(state => state.product.loading) && products.length > 0 && (
                            <div className="absolute inset-0 bg-white/50 z-10 flex items-start justify-center pt-20 backdrop-blur-[1px] transition-all">
                                <div className="bg-white p-4 rounded-full shadow-lg border border-slate-100 flex items-center gap-3">
                                    <Loader2 className="h-6 w-6 text-green-500 animate-spin" />
                                    <span className="text-sm font-medium text-slate-600">Finding products...</span>
                                </div>
                            </div>
                        )}

                        {products.length > 0 ? (
                            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-16">
                                {products.map((product) => <ProductCard key={product.id} product={product} />)}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-32 text-slate-400 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                                <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                                    <Search className="h-10 w-10 text-slate-200" />
                                </div>
                                <p className="text-xl font-medium text-slate-600">No products found</p>
                                <p className="text-sm">Try adjusting your filters or try a different AI search query</p>
                                <button
                                    onClick={handleReset}
                                    className="mt-6 text-green-600 font-medium hover:underline"
                                >
                                    Clear all filters
                                </button>
                            </div>
                        )}
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mb-32">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1}
                                className="flex items-center gap-1 px-4 py-2 bg-slate-100 rounded-md disabled:opacity-50 hover:bg-slate-200 transition-colors"
                            >
                                <ChevronLeft size={20} /> Previous
                            </button>
                            <span className="text-slate-600 font-medium whitespace-nowrap">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === totalPages}
                                className="flex items-center gap-1 px-4 py-2 bg-slate-100 rounded-md disabled:opacity-50 hover:bg-slate-200 transition-colors"
                            >
                                Next <ChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}


export default function Shop() {
    return (
        <Suspense fallback={<div>Loading shop...</div>}>
            <ShopContent />
        </Suspense>
    );
}