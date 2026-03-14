'use client'
import Counter from "@/components/Counter";
import RecommendationSection from "@/components/RecommendationSection";
import OrderSummary from "@/components/OrderSummary";
import PageTitle from "@/components/PageTitle";
import { deleteItemFromCart } from "@/lib/features/cart/cartSlice";
import { fetchProducts } from "@/lib/features/product/productSlice";
import { Trash2Icon } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

export default function Cart() {

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';

    const { cartItems } = useSelector(state => state.cart);
    const products = useSelector(state => state.product.list);

    const dispatch = useDispatch();

    const [cartArray, setCartArray] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);

    const createCartArray = () => {
        setTotalPrice(0);
        const cartArray = [];
        for (const [key, item] of Object.entries(cartItems)) {
            const product = products.find(p => p.id === item.productId);

            if (product) {
                // selectedVariants is an object like { Color: variantObj, Size: variantObj }
                const variantAdjustment = Object.values(item.selectedVariants || {}).reduce(
                    (acc, v) => acc + (v.price || 0), 0
                )
                const itemPrice = product.price + variantAdjustment

                cartArray.push({
                    ...product,
                    variantIds: item.variantIds,
                    selectedVariants: item.selectedVariants,
                    quantity: item.quantity,
                    totalPrice: itemPrice * item.quantity,
                    displayPrice: itemPrice
                });
                setTotalPrice(prev => prev + itemPrice * item.quantity);
            }
        }
        setCartArray(cartArray);
    }

    const handleDeleteItemFromCart = (productId, variantIds) => {
        dispatch(deleteItemFromCart({ productId, variantIds }))
    }

    const fetchMissingProducts = async () => {
        const missingIds = Object.values(cartItems)
            .map(item => item.productId)
            .filter(id => !products.find(p => p.id === id));

        if (missingIds.length > 0) {
            dispatch(fetchProducts({ ids: missingIds.join(','), limit: 100 }));
        }
    }

    useEffect(() => {
        if (Object.keys(cartItems).length > 0) {
            fetchMissingProducts();
        }
    }, [cartItems]);

    useEffect(() => {
        if (products.length > 0) {
            createCartArray();
        }
    }, [cartItems, products]);

    return cartArray.length > 0 ? (
        <div className="min-h-screen mx-6 text-slate-800">

            <div className="max-w-7xl mx-auto ">
                {/* Title */}
                <PageTitle heading="My Cart" text="items in your cart" linkText="Add more" />

                <div className="flex items-start justify-between gap-5 max-lg:flex-col">

                    <table className="w-full max-w-4xl text-slate-600 table-auto">
                        <thead>
                            <tr className="max-sm:text-sm">
                                <th className="text-left">Product</th>
                                <th>Quantity</th>
                                <th>Total Price</th>
                                <th className="max-md:hidden">Remove</th>
                            </tr>
                        </thead>
                        <tbody>
                            {
                                cartArray.map((item, index) => (
                                    <tr key={index} className="space-x-2">
                                        <td className="flex gap-3 my-4">
                                            <div className="flex gap-3 items-center justify-center bg-slate-100 size-18 rounded-md">
                                                <Image src={item.images[0]} className="h-14 w-auto" alt="" width={45} height={45} />
                                            </div>
                                            <div>
                                                <p className="max-sm:text-sm">{item.name}</p>
                                                {item.selectedVariants && Object.values(item.selectedVariants).map(v => (
                                                    <p key={v.id} className="text-xs text-slate-500">{v.name}: {v.value}</p>
                                                ))}
                                                <p className="text-xs text-slate-400">{item.category}</p>
                                                <p className="font-medium">{currency}{item.displayPrice}</p>
                                            </div>
                                        </td>
                                        <td className="text-center">
                                            <Counter productId={item.id} variantIds={item.variantIds} />
                                        </td>
                                        <td className="text-center">{currency}{item.totalPrice.toLocaleString()}</td>
                                        <td className="text-center max-md:hidden">
                                            <button onClick={() => handleDeleteItemFromCart(item.id, item.variantIds)} className=" text-red-500 hover:bg-red-50 p-2.5 rounded-full active:scale-95 transition-all">
                                                <Trash2Icon size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                    <OrderSummary totalPrice={totalPrice} items={cartArray} />
                </div>

                {/* AI Recommendations */}
                <RecommendationSection />
            </div>
        </div>
    ) : (
        <div className="min-h-[80vh] mx-6 flex items-center justify-center text-slate-400">
            <h1 className="text-2xl sm:text-4xl font-semibold">Your cart is empty</h1>
        </div>
    )
}