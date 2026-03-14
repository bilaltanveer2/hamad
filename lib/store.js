import { configureStore } from '@reduxjs/toolkit'
import addressReducer from './features/address/addressSlice'
import cartReducer from './features/cart/cartSlice'
import productReducer from './features/product/productSlice'
import ratingReducer from './features/rating/ratingSlice'
import wishlistReducer from './features/wishlist/wishlistSlice'

export const makeStore = () => {
    return configureStore({
        reducer: {
            address: addressReducer,
            cart: cartReducer,
            product: productReducer,
            rating: ratingReducer,
            wishlist: wishlistReducer,
        },
    })
}