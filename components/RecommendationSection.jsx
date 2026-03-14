'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useSelector } from 'react-redux'
import ProductCard from './ProductCard'
import { SparklesIcon } from 'lucide-react'

const RecommendationSection = ({ categoryId }) => {
    const [recommendations, setRecommendations] = useState([])
    const [loading, setLoading] = useState(false)
    const { cartItems } = useSelector(state => state.cart)

    const fetchRecommendations = async () => {
        setLoading(true)
        try {
            const history = JSON.parse(localStorage.getItem('browsingHistory') || '[]')
            const { data } = await axios.post('/api/recommendations', {
                history,
                categoryId,
                cartItems
            })
            setRecommendations(data.recommendations || [])
        } catch (error) {
            console.error("Failed to fetch recommendations", error)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchRecommendations()
    }, [categoryId, Object.keys(cartItems).length])

    if (!loading && recommendations.length === 0) return null

    return (
        <div className='px-6 my-20 max-w-6xl mx-auto'>
            <div className='flex items-center gap-2 mb-8'>
                <SparklesIcon className='text-indigo-600' size={24} />
                <h2 className='text-2xl font-semibold text-slate-800 tracking-tight'>Recommended For You</h2>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'>
                {loading ? (
                    Array(5).fill(0).map((_, i) => (
                        <div key={i} className='animate-pulse bg-slate-100 h-60 rounded-lg'></div>
                    ))
                ) : (
                    recommendations.map((product) => (
                        <div key={product.id} className='relative group'>
                            <ProductCard product={product} />
                            {product.reason && (
                                <div className='absolute -bottom-2 left-0 right-0 bg-indigo-600 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition duration-300 pointer-events-none text-center z-10'>
                                    {product.reason}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    )
}

export default RecommendationSection
