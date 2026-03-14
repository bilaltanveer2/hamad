import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

let debounceTimer = null

// ================= UPLOAD CART =================
export const uploadCart = createAsyncThunk(
    'cart/uploadCart',
    async (_, thunkAPI) => {
        try {
            clearTimeout(debounceTimer)

            return await new Promise((resolve, reject) => {
                debounceTimer = setTimeout(async () => {
                    try {
                        const { cartItems } = thunkAPI.getState().cart

                        const { data } = await axios.post('/api/cart', { cartItems })

                        resolve(data)
                    } catch (error) {
                        reject(error.response?.data || error.message)
                    }
                }, 1000)
            })

        } catch (error) {
            return thunkAPI.rejectWithValue(
                error.response?.data || error.message
            )
        }
    }
)


// ================= FETCH CART =================
export const fetchCart = createAsyncThunk(
    'cart/fetchCart',
    async (_, thunkAPI) => {
        try {
            const { data } = await axios.get('/api/cart')
            return data
        } catch (error) {
            return thunkAPI.rejectWithValue(
                error.response?.data || error.message
            )
        }
    }
)


// ================= SLICE =================
const cartSlice = createSlice({
    name: 'cart',
    initialState: {
        total: 0,
        cartItems: {},
        loading: false
    },
    reducers: {
        addToCart: (state, action) => {
            const { productId, variantIds = [], selectedVariants = {} } = action.payload
            const variantKey = variantIds.length > 0 ? variantIds.sort().join('_') : 'no-variant'
            const key = `${productId}_${variantKey}`

            if (state.cartItems[key]) {
                state.cartItems[key].quantity++
            } else {
                state.cartItems[key] = {
                    productId,
                    variantIds,
                    selectedVariants, // Store full variant objects for UI convenience
                    quantity: 1
                }
            }

            state.total += 1
        },

        removeFromCart: (state, action) => {
            const { productId, variantIds = [] } = action.payload
            const variantKey = variantIds.length > 0 ? variantIds.sort().join('_') : 'no-variant'
            const key = `${productId}_${variantKey}`

            if (state.cartItems[key]) {
                state.cartItems[key].quantity--

                if (state.cartItems[key].quantity === 0) {
                    delete state.cartItems[key]
                }

                state.total -= 1
            }
        },

        deleteItemFromCart: (state, action) => {
            const { productId, variantIds = [] } = action.payload
            const variantKey = variantIds.length > 0 ? variantIds.sort().join('_') : 'no-variant'
            const key = `${productId}_${variantKey}`

            if (state.cartItems[key]) {
                state.total -= state.cartItems[key].quantity
                delete state.cartItems[key]
            }
        },

        clearCart: (state) => {
            state.cartItems = {}
            state.total = 0
        }
    },

    extraReducers: (builder) => {
        builder
            .addCase(fetchCart.pending, (state) => {
                state.loading = true
            })

            .addCase(fetchCart.fulfilled, (state, action) => {
                state.loading = false
                state.cartItems = action.payload.cart || {}

                state.total = Object.values(state.cartItems).reduce(
                    (acc, item) => acc + (item.quantity || 0),
                    0
                )
            })

            .addCase(uploadCart.fulfilled, (state, action) => {
                if (action.payload?.cart) {
                    state.cartItems = action.payload.cart
                    state.total = Object.values(action.payload.cart).reduce(
                        (acc, item) => acc + (item.quantity || 0),
                        0
                    )
                }
            })
    }
})

export const {
    addToCart,
    removeFromCart,
    clearCart,
    deleteItemFromCart
} = cartSlice.actions

export default cartSlice.reducer