'use client'
import { dummyAdminDashboardData } from "@/assets/assets"
import Loading from "@/components/Loading"
import OrdersAreaChart from "@/components/OrdersAreaChart"
import StoreGrowthChart from "@/components/StoreGrowthChart"
import TopProductsChart from "@/components/TopProductsChart"
import { useAuth } from "@clerk/nextjs"
import axios from "axios"
import { CircleDollarSignIcon, ShoppingBasketIcon, StoreIcon, TagsIcon, UsersIcon, ActivityIcon, CoinsIcon, GiftIcon } from "lucide-react"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"


export default function AdminDashboard() {


    const { getToken } = useAuth()

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$'

    const [loading, setLoading] = useState(true)
    const [dashboardData, setDashboardData] = useState({
        products: 0,
        revenue: 0,
        orders: 0,
        stores: 0,
        activeStores: 0,
        customers: 0,
        loyaltyPoints: 0,
        pointsRedeemed: 0,
        allOrders: [],
        topSellingProducts: [],
        storeGrowth: []
    })

    const dashboardCardsData = [
        { title: 'Total Revenue', value: currency + dashboardData.revenue, icon: CircleDollarSignIcon },
        { title: 'Total Orders', value: dashboardData.orders, icon: TagsIcon },
        { title: 'Active Stores', value: dashboardData.activeStores, icon: ActivityIcon },
        { title: 'Total Customers', value: dashboardData.customers, icon: UsersIcon },
        { title: 'Loyalty Points Issued', value: dashboardData.loyaltyPoints, icon: CoinsIcon },
        { title: 'Points Redeemed', value: dashboardData.pointsRedeemed, icon: GiftIcon },
        { title: 'Total Products', value: dashboardData.products, icon: ShoppingBasketIcon },
        { title: 'Total Stores', value: dashboardData.stores, icon: StoreIcon },
    ]

    const fetchDashboardData = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/admin/dashboard', {
                headers: { Authorization: `Bearer ${token}` }
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
        <div className="text-slate-500 pb-10">
            <h1 className="text-2xl">Admin <span className="text-slate-800 font-medium">Dashboard</span></h1>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 my-10 mt-4">
                {
                    dashboardCardsData.map((card, index) => (
                        <div key={index} className="flex items-center justify-between border border-slate-200 p-4 px-6 rounded-xl hover:shadow-sm transition-shadow bg-white">
                            <div className="flex flex-col gap-1 text-xs">
                                <p className="text-slate-500 uppercase tracking-wider font-semibold">{card.title}</p>
                                <b className="text-2xl font-bold text-slate-800">{card.value}</b>
                            </div>
                            <card.icon size={48} className="p-2.5 text-indigo-600 bg-indigo-50 rounded-xl" />
                        </div>
                    ))
                }
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-10">
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <OrdersAreaChart allOrders={dashboardData.allOrders} />
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                    <TopProductsChart topSellingProducts={dashboardData.topSellingProducts} />
                </div>
                <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
                    <StoreGrowthChart storeGrowth={dashboardData.storeGrowth} />
                </div>
            </div>
        </div>
    )
}