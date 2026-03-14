'use client'
import Banner from "@/components/Banner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useDispatch, useSelector } from "react-redux";
import { fetchProducts } from "@/lib/features/product/productSlice";
import { fetchCart, uploadCart } from "@/lib/features/cart/cartSlice";
import { fetchAddress } from "@/lib/features/address/addressSlice";
import { useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { fetchUserRatings } from "@/lib/features/rating/ratingSlice";
import { fetchWishlist } from "@/lib/features/wishlist/wishlistSlice";


export default function PublicLayout({ children }) {

    const dispatch = useDispatch()
    const { user } = useUser()
    const { getToken } = useAuth()
    const { cartItems } = useSelector((state) => state.cart)

    // Product fetching is now handled by the Shop page to support filters and pagination.
    // Individual product details and cart also handle their own fetching logic where necessary.
    useEffect(() => {
        dispatch(fetchProducts())
    }, [])

    useEffect(() => {
        if (user) {
            dispatch(fetchCart())
            // pass getToken so fetchAddress can call the secured API
            dispatch(fetchAddress(getToken))
            dispatch(fetchUserRatings({ getToken }))
            dispatch(fetchWishlist())
        }
    }, [user])

    useEffect(() => {
        if (user) {
            dispatch(uploadCart())
        }
    }, [cartItems])



    return (
        <>
            <Banner />
            <Navbar />
            {children}
            <Footer />
        </>
    );
}
