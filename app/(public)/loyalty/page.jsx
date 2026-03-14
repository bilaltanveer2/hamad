'use client'
import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { useAuth, useUser } from '@clerk/nextjs'
import { GiftIcon, HistoryIcon, StarIcon, TrophyIcon } from 'lucide-react'
import Loading from '@/components/Loading'
import PageTitle from '@/components/PageTitle'

const LoyaltyPage = () => {
    const { user } = useUser()
    const { getToken } = useAuth()
    const [loading, setLoading] = useState(true)
    const [loyaltyData, setLoyaltyData] = useState({ points: 0, tier: 'REGULAR', history: [] })

    const fetchLoyaltyData = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/user/loyalty', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setLoyaltyData(data)
        } catch (error) {
            console.error(error)
        }
        setLoading(false)
    }

    useEffect(() => {
        if (user) fetchLoyaltyData()
    }, [user])

    if (loading) return <Loading />

    const tierColors = {
        REGULAR: 'text-slate-500 bg-slate-100',
        PLUS: 'text-indigo-600 bg-indigo-100',
        PREMIUM: 'text-amber-600 bg-amber-100'
    }

    return (
        <div className='px-6 my-10 max-w-4xl mx-auto'>
            <PageTitle title="My Loyalty Program" />

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6 my-10'>
                {/* Balance Card */}
                <div className='bg-white border border-slate-200 p-8 rounded-2xl shadow-sm flex items-center justify-between'>
                    <div>
                        <p className='text-slate-500 text-sm font-medium uppercase tracking-wider'>Current Balance</p>
                        <h2 className='text-4xl font-bold text-slate-800 mt-2'>{loyaltyData.points} Points</h2>
                        <p className='text-xs text-slate-400 mt-1'>100 points = $1.00 USD</p>
                    </div>
                    <div className='p-4 bg-indigo-50 rounded-2xl'>
                        <TrophyIcon className='text-indigo-600' size={48} />
                    </div>
                </div>

                {/* Tier Card */}
                <div className='bg-white border border-slate-200 p-8 rounded-2xl shadow-sm flex items-center justify-between'>
                    <div>
                        <p className='text-slate-500 text-sm font-medium uppercase tracking-wider'>Membership Tier</p>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold mt-2 ${tierColors[loyaltyData.tier]}`}>
                            {loyaltyData.tier}
                        </div>
                        <p className='text-xs text-slate-400 mt-2'>
                            {loyaltyData.tier === 'PREMIUM' ? 'Enjoy max benefits!' : 'Shop more to upgrade!'}
                        </p>
                    </div>
                    <div className='p-4 bg-amber-50 rounded-2xl'>
                        <StarIcon className='text-amber-600' size={48} />
                    </div>
                </div>
            </div>

            {/* History Section */}
            <div className='bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden'>
                <div className='p-6 border-b border-slate-100 flex items-center gap-2'>
                    <HistoryIcon className='text-slate-400' size={20} />
                    <h3 className='font-semibold text-slate-800 tracking-tight'>Transaction History</h3>
                </div>

                <div className='divide-y divide-slate-100'>
                    {loyaltyData.history.length > 0 ? (
                        loyaltyData.history.map((tx) => (
                            <div key={tx.id} className='p-6 flex items-center justify-between hover:bg-slate-50/50 transition'>
                                <div>
                                    <p className='font-medium text-slate-800'>{tx.description}</p>
                                    <p className='text-xs text-slate-400 mt-1'>{new Date(tx.createdAt).toLocaleDateString()} • {new Date(tx.createdAt).toLocaleTimeString()}</p>
                                </div>
                                <div className={`font-bold ${tx.type === 'EARNED' ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.type === 'EARNED' ? '+' : '-'}{tx.amount} Pts
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className='p-12 text-center text-slate-400'>
                            <GiftIcon size={48} className='mx-auto mb-4 opacity-20' />
                            <p>No transactions yet. Start shopping to earn points!</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default LoyaltyPage
