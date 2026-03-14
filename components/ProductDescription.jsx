import { ArrowRight, Edit3, StarIcon, Trash2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { deleteReview, fetchProductRatings } from "@/lib/features/rating/ratingSlice"
import { useAuth, useUser } from "@clerk/nextjs"
import RatingModal from "./RatingModal"
import toast from "react-hot-toast"

const ProductDescription = ({ product }) => {

    const [selectedTab, setSelectedTab] = useState('Description')
    const dispatch = useDispatch()
    const { productRatings, loading } = useSelector(state => state.rating)
    const { user } = useUser()
    const { getToken } = useAuth()
    const [ratingModal, setRatingModal] = useState(null)

    useEffect(() => {
        if (selectedTab === 'Reviews') {
            dispatch(fetchProductRatings({ productId: product.id }))
        }
    }, [selectedTab, product.id, dispatch])

    const handleDeleteReview = async (id) => {
        if (confirm("Are you sure you want to delete this review?")) {
            try {
                await dispatch(deleteReview({ getToken, id })).unwrap()
                toast.success("Review deleted")
            } catch (error) {
                toast.error(error)
            }
        }
    }

    // Use fetched ratings if available, otherwise fallback to product.rating for initial render
    const displayRatings = productRatings?.length > 0 ? productRatings : (product.rating || [])

    return (
        <div className="my-18 text-sm text-slate-600">

            {/* Tabs */}
            <div className="flex border-b border-slate-200 mb-6 max-w-2xl">
                {['Description', 'Reviews'].map((tab, index) => (
                    <button className={`${tab === selectedTab ? 'border-b-[1.5px] font-semibold' : 'text-slate-400'} px-3 py-2 font-medium`} key={index} onClick={() => setSelectedTab(tab)}>
                        {tab}
                    </button>
                ))}
            </div>

            {/* Description */}
            {selectedTab === "Description" && (
                <p className="max-w-xl leading-relaxed">{product.description}</p>
            )}

            {/* Reviews */}
            {selectedTab === "Reviews" && (
                <div className="flex flex-col gap-3 mt-14 max-w-3xl">
                    {loading && productRatings.length === 0 ? (
                        <p>Loading reviews...</p>
                    ) : displayRatings.length > 0 ? (
                        displayRatings.map((item, index) => (
                            <div key={index} className="flex gap-5 mb-10 group relative">
                                <Image src={item.user?.image || '/placeholder-user.png'} alt="" className="size-10 rounded-full bg-slate-100" width={100} height={100} />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="font-semibold text-slate-800">{item.user?.name || 'Anonymous'}</p>
                                            <div className="flex items-center mb-2" >
                                                {Array(5).fill('').map((_, i) => (
                                                    <StarIcon key={i} size={14} className='text-transparent' fill={item.rating >= i + 1 ? "#00C950" : "#D1D5DB"} />
                                                ))}
                                                <span className="text-xs text-slate-400 ml-2">{new Date(item.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {/* User Actions */}
                                        {user && user.id === item.userId && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setRatingModal({ initialData: item })}
                                                    className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-green-500 transition-colors"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteReview(item.id)}
                                                    className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-sm text-slate-600 leading-relaxed mt-1">{item.review}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-400 italic">No reviews yet for this product.</p>
                    )}
                </div>
            )}

            {/* Rating Modal for Editing */}
            {ratingModal && (
                <RatingModal
                    ratingModal={ratingModal}
                    setRatingModal={setRatingModal}
                />
            )}

            {/* Store Page */}
            <div className="flex items-center gap-3 mt-14 pt-8 border-t border-slate-100">
                <Image src={product.store.logo} alt="" className="size-11 rounded-full ring ring-slate-100" width={100} height={100} />
                <div>
                    <p className="font-medium text-slate-800">Product by {product.store.name}</p>
                    <Link href={`/shop/${product.store.username}`} className="flex items-center gap-1.5 text-green-600 hover:underline"> view store <ArrowRight size={14} /></Link>
                </div>
            </div>
        </div>
    )
}

export default ProductDescription