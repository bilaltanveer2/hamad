'use client'

import { addToCart } from "@/lib/features/cart/cartSlice";
import { StarIcon, TagIcon, EarthIcon, CreditCardIcon, UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import Counter from "./Counter";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";

const ProductDetails = ({ product }) => {

    const productId = product.id;
    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';

    const { productRatings } = useSelector(state => state.rating);
    const cart = useSelector(state => state.cart.cartItems);
    const dispatch = useDispatch();

    const router = useRouter()

    const [mainImage, setMainImage] = useState(product.images[0]);
    const [selectedVariant, setSelectedVariant] = useState({}) // { Color: variantObj, Size: variantObj }

    const addToCartHandler = () => {
        const variantTypeCount = new Set(product.variants?.map(v => v.name)).size
        if (Object.keys(selectedVariant).length < variantTypeCount) {
            return toast.error("Please select all options")
        }

        const variantIds = Object.values(selectedVariant).map(v => v.id)

        dispatch(addToCart({
            productId,
            variantIds,
            selectedVariants: selectedVariant
        }))
        toast.success("Added to cart")
    }

    // Helper to generate key for Redux state
    const getCartKey = (vIds = []) => {
        const variantKey = vIds.length > 0 ? vIds.sort().join('_') : 'no-variant'
        return `${productId}_${variantKey}`
    }

    // Group variants by name
    const variantGroups = product.variants?.reduce((acc, v) => {
        if (!acc[v.name]) acc[v.name] = []
        acc[v.name].push(v)
        return acc
    }, {}) || {}

    // Calculate dynamic price
    const variantAdjustment = Object.values(selectedVariant).reduce((acc, v) => acc + (v.price || 0), 0)
    const currentPrice = product.price + variantAdjustment
    const currentMrp = product.mrp + variantAdjustment

    // Use latest product-specific ratings if they match the current product
    const currentRatings = (productRatings?.length > 0 && productRatings[0].productId === product.id)
        ? productRatings
        : (product.rating || []);

    const averageRating = currentRatings.length > 0
        ? currentRatings.reduce((acc, item) => acc + item.rating, 0) / currentRatings.length
        : 0;

    const reviewCount = currentRatings.length;
    return (
        <div className="flex max-lg:flex-col gap-12">
            <div className="flex max-sm:flex-col-reverse gap-3">
                <div className="flex sm:flex-col gap-3">
                    {product.images.map((image, index) => (
                        <div key={index} onClick={() => setMainImage(product.images[index])} className="bg-slate-100 flex items-center justify-center size-26 rounded-lg group cursor-pointer">
                            <Image src={image} className="group-hover:scale-103 group-active:scale-95 transition" alt="" width={45} height={45} />
                        </div>
                    ))}
                </div>
                <div className="flex justify-center items-center h-100 sm:size-113 bg-slate-100 rounded-lg ">
                    <Image src={mainImage} alt="" width={250} height={250} />
                </div>
            </div>
            <div className="flex-1">
                <h1 className="text-3xl font-semibold text-slate-800">{product.name}</h1>
                <div className='flex items-center mt-2'>
                    {Array(5).fill('').map((_, index) => (
                        <StarIcon key={index} size={14} className='text-transparent mt-0.5' fill={averageRating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                    ))}
                    <p className="text-sm ml-3 text-slate-500">{reviewCount} Reviews</p>
                </div>
                <div className="flex items-start my-6 gap-3 text-2xl font-semibold text-slate-800">
                    <p> {currency}{currentPrice.toLocaleString()} </p>
                    <p className="text-xl text-slate-500 line-through">{currency}{currentMrp.toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                    <TagIcon size={14} />
                    <p>Save {((currentMrp - currentPrice) / currentMrp * 100).toFixed(0)}% right now</p>
                </div>

                {/* Variants Selection */}
                {Object.keys(variantGroups).length > 0 && (
                    <div className="mt-8 flex flex-col gap-6">
                        {Object.entries(variantGroups).map(([name, variants]) => (
                            <div key={name}>
                                <p className="text-sm font-medium text-slate-800 mb-3 uppercase tracking-wider">{name}</p>
                                <div className="flex flex-wrap gap-3">
                                    {variants.map(variant => (
                                        <button
                                            key={variant.id}
                                            onClick={() => {
                                                setSelectedVariant(prev => ({ ...prev, [name]: variant }))
                                                if (variant.image) {
                                                    setMainImage(variant.image)
                                                }
                                            }}
                                            className={`px-4 py-2 text-sm border rounded-md transition-all flex items-center gap-2 ${selectedVariant[name]?.id === variant.id
                                                ? 'bg-slate-800 text-white border-slate-800'
                                                : 'text-slate-600 border-slate-200 hover:border-slate-800'
                                                }`}
                                        >
                                            {variant.image && <div className="size-2 rounded-full bg-green-500" title="Has unique image" />}
                                            {variant.value}
                                            {variant.price > 0 && <span className="ml-1 text-[10px] text-green-600 font-bold">+{currency}{variant.price}</span>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                <div className="flex items-end gap-5 mt-10">
                    {(() => {
                        const variantIds = Object.values(selectedVariant).map(v => v.id)
                        const key = getCartKey(variantIds)

                        return cart[key] ? (
                            <div className="flex flex-col gap-3">
                                <p className="text-lg text-slate-800 font-semibold">Quantity</p>
                                <Counter productId={productId} variantIds={variantIds} />
                            </div>
                        ) : null
                    })()}

                    <button
                        onClick={() => {
                            const variantIds = Object.values(selectedVariant).map(v => v.id)
                            const key = getCartKey(variantIds)
                            if (!cart[key]) {
                                addToCartHandler()
                            } else {
                                router.push('/cart')
                            }
                        }}
                        className="bg-slate-800 text-white px-10 py-3 text-sm font-medium rounded hover:bg-slate-900 active:scale-95 transition"
                    >
                        {(() => {
                            const variantIds = Object.values(selectedVariant).map(v => v.id)
                            const key = getCartKey(variantIds)
                            return !cart[key] ? 'Add to Cart' : 'View Cart'
                        })()}
                    </button>
                </div>
                <hr className="border-gray-300 my-5" />
                <div className="flex flex-col gap-4 text-slate-500">
                    <p className="flex gap-3"> <EarthIcon className="text-slate-400" /> Free shipping worldwide </p>
                    <p className="flex gap-3"> <CreditCardIcon className="text-slate-400" /> 100% Secured Payment </p>
                    <p className="flex gap-3"> <UserIcon className="text-slate-400" /> Trusted by top brands </p>
                </div>

            </div>
        </div>
    )
}

export default ProductDetails