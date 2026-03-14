import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import axios from 'axios'

export const fetchProducts = createAsyncThunk(
    'product/fetchProducts',
    async ({ storeId, page = 1, limit = 20, category, minPrice, maxPrice, rating, inStock, search, ids } = {}, thunkAPI) => {
        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(storeId && { storeId }),
                ...(category && { category }),
                ...(minPrice && { minPrice: minPrice.toString() }),
                ...(maxPrice && { maxPrice: maxPrice.toString() }),
                ...(rating && { rating: rating.toString() }),
                ...(inStock && { inStock: 'true' }),
                ...(search && { search }),
                ...(ids && { ids })
            })

            const { data } = await axios.get(`/api/products?${params.toString()}`)
            return data
        } catch (error) {
            return thunkAPI.rejectWithValue(
                error.response?.data || error.message
            )
        }
    }
)

const productSlice = createSlice({
    name: 'product',
    initialState: {
        list: [],
        totalProducts: 0,
        totalPages: 1,
        currentPage: 1,
        filters: {
            category: '',
            minPrice: '',
            maxPrice: '',
            rating: '',
            inStock: false,
            search: ''
        },
        loading: false,
        error: null
    },
    reducers: {
        setProduct: (state, action) => {
            state.list = action.payload.products
            state.totalProducts = action.payload.totalProducts
            state.totalPages = action.payload.totalPages
            state.currentPage = action.payload.currentPage
        },
        clearProduct: (state) => {
            state.list = []
            state.totalProducts = 0
            state.totalPages = 1
            state.currentPage = 1
        },
        setFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload }
        },
        resetFilters: (state) => {
            state.filters = {
                category: '',
                minPrice: '',
                maxPrice: '',
                rating: '',
                inStock: false,
                search: ''
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProducts.pending, (state) => {
                state.loading = true
            })
            .addCase(fetchProducts.fulfilled, (state, action) => {
                state.loading = false
                state.list = action.payload.products
                state.totalProducts = action.payload.totalProducts
                state.totalPages = action.payload.totalPages
                state.currentPage = action.payload.currentPage
            })
            .addCase(fetchProducts.rejected, (state, action) => {
                state.loading = false
                state.error = action.payload
            })
    }
})

export const { setProduct, clearProduct, setFilters, resetFilters } = productSlice.actions

export default productSlice.reducer