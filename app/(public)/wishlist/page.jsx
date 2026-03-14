'use client'
import ProductCard from "@/components/ProductCard";
import PageTitle from "@/components/PageTitle";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export default function WishlistPage() {
    const { list: products, loading } = useSelector(state => state.wishlist);
    const { user, isLoaded } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && !user) {
            router.push('/');
        }
    }, [user, isLoaded, router]);

    if (!user) return null;

    return (
        <div className="min-h-screen mx-6 text-slate-800">
            <div className="max-w-7xl mx-auto ">
                {/* Title */}
                <PageTitle heading="My Wishlist" text="items you've saved for later" linkText="Shop more" />

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <p className="text-slate-400">Loading wishlist...</p>
                    </div>
                ) : products.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-32">
                        {products.map((product) => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-400">
                        <h1 className="text-2xl sm:text-4xl font-semibold mb-4">Your wishlist is empty</h1>
                        <button
                            onClick={() => router.push('/shop')}
                            className="px-8 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition"
                        >
                            Explore Products
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
