'use client'
import { dummyStoreDashboardData } from "@/assets/assets"
import Loading from "@/components/Loading"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { CircleDollarSignIcon, ShoppingBasketIcon, StarIcon, TagsIcon } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts'
import { UsersIcon } from "lucide-react"

export default function Dashboard() {
    const { getToken } = useAuth()

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const router = useRouter()

    const [loading, setLoading] = useState(true)
    const [dashboardData, setDashboardData] = useState({
        totalProducts: 0,
        totalEarnings: 0,
        totalOrders: 0,
        uniqueCustomers: 0,
        ratings: [],
        salesTrend: [],
        topProducts: []
    })

    const dashboardCardsData = [
        { title: 'Total Products', value: dashboardData.totalProducts, icon: ShoppingBasketIcon },
        { title: 'Total Earnings', value: currency + dashboardData.totalEarnings.toLocaleString(), icon: CircleDollarSignIcon },
        { title: 'Total Orders', value: dashboardData.totalOrders, icon: TagsIcon },
        { title: 'Unique Customers', value: dashboardData.uniqueCustomers, icon: UsersIcon },
    ]

    const fetchDashboardData = async () => {

        try {
            const token = await getToken()
            const { data } = await axios.get('/api/store/dashboard', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            setDashboardData(data.dashboardData)
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
        setLoading(false)
    }

    useEffect(() => {
        fetchDashboardData()
    }, [])

    if (loading) return <Loading />

    return (
        <div className=" text-slate-500 mb-28">
            <h1 className="text-2xl">Seller <span className="text-slate-800 font-medium">Dashboard</span></h1>

            <div className="flex flex-wrap gap-5 my-10 mt-4">
                {
                    dashboardCardsData.map((card, index) => (
                        <div key={index} className="flex-1 min-w-64 flex items-center gap-11 border border-slate-200 p-5 rounded-lg bg-white shadow-sm">
                            <div className="flex flex-col gap-1 text-xs uppercase tracking-wider font-semibold">
                                <p className="text-slate-400">{card.title}</p>
                                <b className="text-2xl font-bold text-slate-800">{card.value}</b>
                            </div>
                            <card.icon size={44} className=" p-2.5 text-slate-500 bg-slate-50 rounded-full ml-auto" />
                        </div>
                    ))
                }
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* Sales Trend Chart */}
                <div className="border border-slate-200 p-6 rounded-lg bg-white shadow-sm">
                    <h3 className="text-slate-800 font-semibold mb-6 flex items-center gap-2">
                        <CircleDollarSignIcon size={18} className="text-slate-400" />
                        Sales Trend (Last 7 Days)
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={dashboardData.salesTrend}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748B' }} dy={10} />
                                <YAxis yAxisId="left" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748B' }} />
                                <YAxis yAxisId="right" orientation="right" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748B' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ stroke: '#94A3B8', strokeWidth: 1 }}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="revenue"
                                    name="Revenue ($)"
                                    stroke="#00C950"
                                    strokeWidth={3}
                                    dot={{ fill: '#00C950', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Line
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="orders"
                                    name="Orders"
                                    stroke="#94A3B8"
                                    strokeWidth={3}
                                    dot={{ fill: '#94A3B8', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                                <Line
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="cumulativeCustomers"
                                    name="Total Customers"
                                    stroke="#6366F1"
                                    strokeWidth={3}
                                    dot={{ fill: '#6366F1', strokeWidth: 2, r: 4 }}
                                    activeDot={{ r: 6, strokeWidth: 0 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Best Selling Products Chart */}
                <div className="border border-slate-200 p-6 rounded-lg bg-white shadow-sm">
                    <h3 className="text-slate-800 font-semibold mb-6 flex items-center gap-2">
                        <ShoppingBasketIcon size={18} className="text-slate-400" />
                        Top Performing Products
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dashboardData.topProducts} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                                <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} hide />
                                <YAxis dataKey="name" type="category" fontSize={10} width={120} tickLine={false} axisLine={false} tick={{ fill: '#64748B' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="sales" fill="#1E293B" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <h2 className="text-xl font-semibold text-slate-800 mb-5">Latest Reviews & Ratings</h2>

            <div className="mt-5">
                {
                    dashboardData.ratings.map((review, index) => (
                        <div key={index} className="flex max-sm:flex-col gap-5 sm:items-center justify-between py-6 border-b border-slate-200 text-sm text-slate-600 max-w-4xl">
                            <div>
                                <div className="flex gap-3">
                                    <Image src={review.user.image} alt="" className="w-10 aspect-square rounded-full" width={100} height={100} />
                                    <div>
                                        <p className="font-medium">{review.user.name}</p>
                                        <p className="font-light text-slate-500">{new Date(review.createdAt).toDateString()}</p>
                                    </div>
                                </div>
                                <p className="mt-3 text-slate-500 max-w-xs leading-6">{review.review}</p>
                            </div>
                            <div className="flex flex-col justify-between gap-6 sm:items-end">
                                <div className="flex flex-col sm:items-end">
                                    <p className="text-slate-400">{review.product?.category}</p>
                                    <p className="font-medium">{review.product?.name}</p>
                                    <div className='flex items-center'>
                                        {Array(5).fill('').map((_, index) => (
                                            <StarIcon key={index} size={17} className='text-transparent mt-0.5' fill={review.rating >= index + 1 ? "#00C950" : "#D1D5DB"} />
                                        ))}
                                    </div>
                                </div>
                                <button onClick={() => router.push(`/product/${review.product.id}`)} className="bg-slate-100 px-5 py-2 hover:bg-slate-200 rounded transition-all">View Product</button>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}