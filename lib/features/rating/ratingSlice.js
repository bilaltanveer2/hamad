import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

export const fetchUserRatings = createAsyncThunk('rating/fetchUserRatings',
    async ({ getToken }, thunkAPI) => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/rating', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            return data ? data.ratings : []
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.message)
        }
    }
)

export const fetchProductRatings = createAsyncThunk('rating/fetchProductRatings',
    async ({ productId }, thunkAPI) => {
        try {
            const { data } = await axios.get(`/api/rating?productId=${productId}`)
            return data.ratings
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.message)
        }
    }
)

export const addReview = createAsyncThunk('rating/addReview',
    async ({ getToken, orderId, productId, rating, review }, thunkAPI) => {
        try {
            const token = await getToken()
            const { data } = await axios.post('/api/rating', { orderId, productId, rating, review }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            return data.rating
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.message)
        }
    }
)

export const updateReview = createAsyncThunk('rating/updateReview',
    async ({ getToken, id, rating, review }, thunkAPI) => {
        try {
            const token = await getToken()
            const { data } = await axios.put(`/api/rating/${id}`, { rating, review }, {
                headers: { Authorization: `Bearer ${token}` }
            })
            return data.rating
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.message)
        }
    }
)

export const deleteReview = createAsyncThunk('rating/deleteReview',
    async ({ getToken, id }, thunkAPI) => {
        try {
            const token = await getToken()
            await axios.delete(`/api/rating/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            return id
        } catch (error) {
            return thunkAPI.rejectWithValue(error.response?.data?.error || error.message)
        }
    }
)

const ratingSlice = createSlice({
    name: 'rating',
    initialState: {
        ratings: [], // User's own ratings
        productRatings: [], // Ratings for current product page
        loading: false,
    },
    reducers: {
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchUserRatings.fulfilled, (state, action) => {
                state.ratings = action.payload;
            })
            .addCase(fetchProductRatings.pending, (state) => {
                state.loading = true
            })
            .addCase(fetchProductRatings.fulfilled, (state, action) => {
                state.loading = false
                state.productRatings = action.payload;
            })
            .addCase(fetchProductRatings.rejected, (state) => {
                state.loading = false
            })
            .addCase(addReview.fulfilled, (state, action) => {
                state.productRatings.unshift(action.payload)
                state.ratings.push(action.payload)
            })
            .addCase(updateReview.fulfilled, (state, action) => {
                const index = state.productRatings.findIndex(r => r.id === action.payload.id)
                if (index !== -1) state.productRatings[index] = { ...state.productRatings[index], ...action.payload }

                const userIndex = state.ratings.findIndex(r => r.id === action.payload.id)
                if (userIndex !== -1) state.ratings[userIndex] = { ...state.ratings[userIndex], ...action.payload }
            })
            .addCase(deleteReview.fulfilled, (state, action) => {
                state.productRatings = state.productRatings.filter(r => r.id !== action.payload)
                state.ratings = state.ratings.filter(r => r.id !== action.payload)
            })
    }
})

export default ratingSlice.reducer