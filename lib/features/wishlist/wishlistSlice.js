import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

// ================= FETCH WISHLIST =================
export const fetchWishlist = createAsyncThunk(
    'wishlist/fetchWishlist',
    async (_, thunkAPI) => {
        try {
            const { data } = await axios.get('/api/wishlist')
            return data.products
        } catch (error) {
            return thunkAPI.rejectWithValue(
                error.response?.data || error.message
            )
        }
    }
)

// ================= ADD TO WISHLIST =================
export const addToWishlist = createAsyncThunk(
    'wishlist/addToWishlist',
    async ({ productId }, thunkAPI) => {
        try {
            const { data } = await axios.post('/api/wishlist', { productId })
            // Fetch everything again to keep state in sync with product objects
            thunkAPI.dispatch(fetchWishlist())
            return data
        } catch (error) {
            return thunkAPI.rejectWithValue(
                error.response?.data || error.message
            )
        }
    }
)

// ================= REMOVE FROM WISHLIST =================
export const removeFromWishlist = createAsyncThunk(
    'wishlist/removeFromWishlist',
    async ({ productId }, thunkAPI) => {
        try {
            const { data } = await axios.delete(`/api/wishlist/${productId}`)
            return { productId, ...data }
        } catch (error) {
            return thunkAPI.rejectWithValue(
                error.response?.data || error.message
            )
        }
    }
)

// ================= SLICE =================
const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState: {
        list: [],
        loading: false,
        error: null
    },
    reducers: {
        clearWishlist: (state) => {
            state.list = []
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWishlist.pending, (state) => {
                state.loading = true
            })
            .addCase(fetchWishlist.fulfilled, (state, action) => {
                state.loading = false
                state.list = action.payload
            })
            .addCase(fetchWishlist.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
            .addCase(removeFromWishlist.fulfilled, (state, action) => {
                state.list = state.list.filter(item => item.id !== action.payload.productId)
            })
    }
})

export const { clearWishlist } = wishlistSlice.actions

export default wishlistSlice.reducer
