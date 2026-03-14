'use client'
import { assets } from "@/assets/assets"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import Image from "next/image"
import { useState } from "react"
import { toast } from "react-hot-toast"

export default function StoreAddProduct() {

    const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty & Health', 'Toys & Games', 'Sports & Outdoors', 'Books & Media', 'Food & Drink', 'Hobbies & Crafts', 'Others']

    const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null })

    const [productInfo, setProductInfo] = useState({
        name: "",
        description: "",
        mrp: 0,
        price: 0,
        category: "",
    })

    const [variants, setVariants] = useState([]) // { name: "", value: "", price: "", stock: "", image: null }

    const addVariant = () => {
        setVariants([...variants, { name: "", value: "", price: "", stock: "", image: null }])
    }

    const removeVariant = (index) => {
        setVariants(variants.filter((_, i) => i !== index))
    }

    const onVariantChange = (index, field, value) => {
        const updated = [...variants]
        updated[index][field] = value
        setVariants(updated)
    }

    const onVariantImageChange = (index, file) => {
        const updated = [...variants]
        updated[index].image = file
        setVariants(updated)
    }

    const [loading, setLoading] = useState(false)
    const [aiUsed, setAiUsed] = useState(false)

    const { getToken } = useAuth()

    const onChangeHandler = (e) => {
        setProductInfo({ ...productInfo, [e.target.name]: e.target.value })
    }

    const handleImageUpload = async (key, file) => {

        setImages(prev => ({ ...prev, [key]: file }))

        if (key === "1" && file && !aiUsed) {

            const reader = new FileReader()
            reader.readAsDataURL(file)

            reader.onloadend = async () => {

                const base64String = reader.result.split(",")[1]
                const mimeType = file.type

                const token = await getToken()

                try {

                    await toast.promise(

                        axios.post(
                            '/api/store/ai',
                            { base64Image: base64String, mimeType },
                            { headers: { Authorization: `Bearer ${token}` } }
                        ),

                        {
                            loading: "Analyzing image with AI...",
                            success: (res) => {

                                const data = res.data

                                if (data.name && data.description) {

                                    setProductInfo(prev => ({
                                        ...prev,
                                        name: data.name,
                                        description: data.description
                                    }))

                                    setAiUsed(true)

                                    return "AI filled product info 🎉"
                                }

                                return "AI could not analyze the image"
                            },

                            error: (err) => err?.response?.data?.error || err.message
                        }

                    )

                } catch (error) {
                    console.error(error)
                }
            }
        }
    }

    const onSubmitHandler = async (e) => {

        e.preventDefault()

        try {

            if (!images[1] && !images[2] && !images[3] && !images[4]) {
                return toast.error('Please upload at least one image')
            }

            setLoading(true)

            const formData = new FormData()

            formData.append('name', productInfo.name)
            formData.append('description', productInfo.description)
            formData.append('mrp', productInfo.mrp)
            formData.append('price', productInfo.price)
            formData.append('category', productInfo.category)

            Object.keys(images).forEach((key) => {
                if (images[key]) {
                    formData.append('images', images[key])
                }
            })

            // Clean variants to not stringify File objects
            const variantsToStore = variants.map(({ image, ...rest }) => rest)
            formData.append('variants', JSON.stringify(variantsToStore))

            // Append variant images separately
            variants.forEach((v, idx) => {
                if (v.image) {
                    formData.append(`variantImage_${idx}`, v.image)
                }
            })

            const token = await getToken()

            const { data } = await axios.post(
                '/api/store/product',
                formData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            )

            toast.success(data.message)

            setProductInfo({
                name: "",
                description: "",
                mrp: 0,
                price: 0,
                category: "",
            })

            setImages({ 1: null, 2: null, 3: null, 4: null })
            setVariants([])

        } catch (error) {
            toast.error(error?.response?.data?.message || error.message)
        }
        finally {
            setLoading(false)
        }
    }

    return (

        <form onSubmit={onSubmitHandler} className="text-slate-500 mb-28">

            <h1 className="text-2xl">Add New <span className="text-slate-800 font-medium">Products</span></h1>

            <p className="mt-7">Product Images</p>

            <div className="flex gap-3 mt-4">

                {Object.keys(images).map((key) => (

                    <label key={key} htmlFor={`images${key}`}>

                        <Image
                            width={300}
                            height={300}
                            className='h-15 w-auto border border-slate-200 rounded cursor-pointer'
                            src={images[key] ? URL.createObjectURL(images[key]) : assets.upload_area}
                            alt=""
                        />

                        <input
                            type="file"
                            accept='image/*'
                            id={`images${key}`}
                            hidden
                            onChange={(e) => handleImageUpload(key, e.target.files[0])}
                        />

                    </label>
                ))}

            </div>

            <label className="flex flex-col gap-2 my-6">
                Name
                <input
                    type="text"
                    name="name"
                    onChange={onChangeHandler}
                    value={productInfo.name}
                    placeholder="Enter product name"
                    className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded"
                    required
                />
            </label>

            <label className="flex flex-col gap-2 my-6">
                Description
                <textarea
                    name="description"
                    onChange={onChangeHandler}
                    value={productInfo.description}
                    placeholder="Enter product description"
                    rows={5}
                    className="w-full max-w-sm p-2 px-4 outline-none border border-slate-200 rounded resize-none"
                    required
                />
            </label>

            <div className="flex gap-5">

                <label className="flex flex-col gap-2">
                    Actual Price ($)
                    <input
                        type="number"
                        name="mrp"
                        onChange={onChangeHandler}
                        value={productInfo.mrp}
                        className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded"
                        required
                    />
                </label>

                <label className="flex flex-col gap-2">
                    Offer Price ($)
                    <input
                        type="number"
                        name="price"
                        onChange={onChangeHandler}
                        value={productInfo.price}
                        className="w-full max-w-45 p-2 px-4 outline-none border border-slate-200 rounded"
                        required
                    />
                </label>

            </div>

            <select
                onChange={e => setProductInfo({ ...productInfo, category: e.target.value })}
                value={productInfo.category}
                className="w-full max-w-sm p-2 px-4 my-6 outline-none border border-slate-200 rounded"
                required
            >

                <option value="">Select a category</option>

                {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                ))}

            </select>

            {/* Variants Section */}
            <div className="mt-8 mb-10">
                <div className="flex justify-between items-center mb-4 max-w-sm">
                    <p className="font-medium text-slate-800">Product Variants</p>
                    <button
                        type="button"
                        onClick={addVariant}
                        className="text-sm text-green-600 font-medium hover:underline"
                    >
                        + Add Variant
                    </button>
                </div>

                {variants.length > 0 ? (
                    <div className="flex flex-col gap-4 max-w-sm">
                        {variants.map((variant, index) => (
                            <div key={index} className="p-4 border border-slate-200 rounded-lg relative bg-slate-50/50">
                                <button
                                    type="button"
                                    onClick={() => removeVariant(index)}
                                    className="absolute top-2 right-2 text-slate-400 hover:text-red-500"
                                >
                                    Remove
                                </button>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs uppercase tracking-wider">Option Name</span>
                                        <input
                                            placeholder="Color, Size..."
                                            className="p-1 px-2 border border-slate-200 rounded text-sm outline-none"
                                            value={variant.name}
                                            onChange={(e) => onVariantChange(index, 'name', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs uppercase tracking-wider">Option Value</span>
                                        <input
                                            placeholder="Red, XL..."
                                            className="p-1 px-2 border border-slate-200 rounded text-sm outline-none"
                                            value={variant.value}
                                            onChange={(e) => onVariantChange(index, 'value', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs uppercase tracking-wider">Extra Price ($)</span>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            className="p-1 px-2 border border-slate-200 rounded text-sm outline-none"
                                            value={variant.price}
                                            onChange={(e) => onVariantChange(index, 'price', e.target.value)}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-xs uppercase tracking-wider">Stock</span>
                                        <input
                                            type="number"
                                            placeholder="10"
                                            className="p-1 px-2 border border-slate-200 rounded text-sm outline-none"
                                            value={variant.stock}
                                            onChange={(e) => onVariantChange(index, 'stock', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="flex flex-col gap-1 col-span-2 mt-2 border-t pt-2 border-slate-100">
                                        <span className="text-xs uppercase tracking-wider mb-1">Variant Image (Optional)</span>
                                        <div className="flex items-center gap-3">
                                            <label htmlFor={`variantImage${index}`} className="cursor-pointer">
                                                <Image
                                                    width={100}
                                                    height={100}
                                                    className='h-12 w-12 border border-slate-200 rounded object-cover'
                                                    src={variant.image ? URL.createObjectURL(variant.image) : assets.upload_area}
                                                    alt="variant"
                                                />
                                                <input
                                                    type="file"
                                                    accept='image/*'
                                                    id={`variantImage${index}`}
                                                    hidden
                                                    onChange={(e) => onVariantImageChange(index, e.target.files[0])}
                                                />
                                            </label>
                                            {variant.image && (
                                                <button
                                                    type="button"
                                                    onClick={() => onVariantImageChange(index, null)}
                                                    className="text-xs text-red-500 hover:underline"
                                                >
                                                    Remove Image
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm italic text-slate-400">No variants added yet.</p>
                )}
            </div>

            <button
                disabled={loading}
                className="bg-slate-800 text-white px-6 mt-7 py-2 hover:bg-slate-900 rounded transition"
            >
                {loading ? "Adding..." : "Add Product"}
            </button>

        </form>
    )
}