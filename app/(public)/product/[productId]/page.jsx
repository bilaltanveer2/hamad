'use client'
import ProductDescription from "@/components/ProductDescription";
import ProductDetails from "@/components/ProductDetails";
import RecommendationSection from "@/components/RecommendationSection";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

export default function Product() {

    const { productId } = useParams();
    const [product, setProduct] = useState();
    const products = useSelector(state => state.product.list);

    const fetchProduct = async () => {
        try {
            const response = await fetch(`/api/products/${productId}`);
            const data = await response.json();
            if (data.product) {
                setProduct(data.product);
            }
        } catch (error) {
            console.error("Failed to fetch product", error);
        }
    }

    useEffect(() => {
        fetchProduct()
        scrollTo(0, 0)

        // Add to browsing history
        if (productId) {
            const history = JSON.parse(localStorage.getItem('browsingHistory') || '[]')
            const updatedHistory = [productId, ...history.filter(id => id !== productId)].slice(0, 10)
            localStorage.setItem('browsingHistory', JSON.stringify(updatedHistory))
        }
    }, [productId]);

    return (
        <div className="mx-6">
            <div className="max-w-7xl mx-auto">

                {/* Breadcrums */}
                <div className="  text-gray-600 text-sm mt-8 mb-5">
                    Home / Products / {product?.category}
                </div>

                {/* Product Details */}
                {product && (<ProductDetails product={product} />)}

                {/* Description & Reviews */}
                {product && (<ProductDescription product={product} />)}

                {/* AI Recommendations */}
                {product && (<RecommendationSection categoryId={product.category} />)}
            </div>
        </div>
    );
}