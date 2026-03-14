"use client";
import { PlusIcon, SquarePenIcon, XIcon, GiftIcon } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import AddressModal from './AddressModal';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { Protect, useAuth, useUser } from '@clerk/nextjs'
import axios from 'axios';
import { fetchCart } from '@/lib/features/cart/cartSlice';
import { calculateDiscounts, calculatePointsEarned, POINT_REDEEM_RATE } from '@/lib/loyaltyUtils';
import { CoinsIcon } from 'lucide-react';

const OrderSummary = ({ totalPrice, items }) => {

    const { user } = useUser()
    const { getToken } = useAuth()
    const dispatch = useDispatch()

    const [loyaltyData, setLoyaltyData] = useState({ points: 0, tier: 'REGULAR' })
    const [redeemPoints, setRedeemPoints] = useState(false)

    const fetchLoyaltyData = async () => {
        try {
            const token = await getToken()
            const { data } = await axios.get('/api/user/loyalty', {
                headers: { Authorization: `Bearer ${token}` }
            })
            setLoyaltyData({ points: data.loyaltyPoints, tier: data.membershipTier })
        } catch (error) {
            console.error(error)
        }
    }

    useEffect(() => {
        if (user) fetchLoyaltyData()
    }, [user])

    const currency = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '$';
    const router = useRouter();
    const addressList = useSelector(state => state.address.list);

    const [paymentMethod, setPaymentMethod] = useState('COD');
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [couponCodeInput, setCouponCodeInput] = useState('');
    const [coupon, setCoupon] = useState('');

    const discounts = calculateDiscounts(totalPrice, loyaltyData.tier)

    // Tiered Discounted Price
    const tieredDiscountedPrice = totalPrice - discounts.totalDiscountAmount;

    // Coupon Discount calculation (applied on tiered discounted price)
    const couponDiscountAmount = coupon ? (tieredDiscountedPrice * coupon.discount / 100) : 0;

    // Redeemption Amount
    const redemptionAmount = redeemPoints ? (Math.min(loyaltyData.points, tieredDiscountedPrice * POINT_REDEEM_RATE) / POINT_REDEEM_RATE) : 0

    // Shipping Fee
    const shippingFee = user?.publicMetadata?.plan === 'plus' ? 0 : 2;

    // Estimated Points to Earn (Only for Stripe)
    const finalAmountForPoints = parseFloat((tieredDiscountedPrice - couponDiscountAmount - redemptionAmount).toFixed(2));
    const estimatedPoints = calculatePointsEarned(finalAmountForPoints);

    const handleCouponCode = async (event) => {
        event.preventDefault();
        try {
            if (!user) {
                return toast('Please login to proceed')
            }
            const token = await getToken();
            const { data } = await axios.post('/api/coupon', { code: couponCodeInput }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })
            setCoupon(data.coupon)
            toast.success('Coupon Applied')
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }

    }

    const handlePlaceOrder = async (e) => {
        e.preventDefault();
        try {
            if (!user) {
                return toast('Please login to place order')
            }
            if (!selectedAddress) {
                return toast('Please select an address')
            }
            const token = await getToken();


            const orderData = {
                addressId: selectedAddress.id,
                items,
                paymentMethod,
                redeemPoints: redeemPoints ? Math.min(loyaltyData.points, Math.floor(totalPrice * POINT_REDEEM_RATE)) : 0
            }

            if (coupon) {
                orderData.couponCode = coupon.code
            }


            const { data } = await axios.post('/api/orders', orderData, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (paymentMethod === 'STRIPE') {
                window.location.href = data.session.url;
            } else {
                toast.success(data.message)
                router.push('/orders')
                dispatch(fetchCart({ getToken }))

            }
        } catch (error) {
            toast.error(error?.response?.data?.error || error.message)
        }
    }

    return (
        <div className='w-full max-w-lg lg:max-w-[340px] bg-slate-50/30 border border-slate-200 text-slate-500 text-sm rounded-xl p-7'>
            <h2 className='text-xl font-medium text-slate-600'>Payment Summary</h2>
            <p className='text-slate-400 text-xs my-4'>Payment Method</p>
            <div className='flex gap-2 items-center'>
                <input type="radio" id="COD" onChange={() => setPaymentMethod('COD')} checked={paymentMethod === 'COD'} className='accent-gray-500' />
                <label htmlFor="COD" className='cursor-pointer'>COD</label>
            </div>
            <div className='flex gap-2 items-center mt-1'>
                <input type="radio" id="STRIPE" name='payment' onChange={() => setPaymentMethod('STRIPE')} checked={paymentMethod === 'STRIPE'} className='accent-gray-500' />
                <label htmlFor="STRIPE" className='cursor-pointer'>Stripe Payment</label>
            </div>
            <div className='my-4 py-4 border-y border-slate-200 text-slate-400'>
                <p>Address</p>
                {
                    selectedAddress ? (
                        <div className='flex gap-2 items-center'>
                            <p>{selectedAddress.name}, {selectedAddress.city}, {selectedAddress.state}, {selectedAddress.zip}</p>
                            <SquarePenIcon onClick={() => setSelectedAddress(null)} className='cursor-pointer' size={18} />
                        </div>
                    ) : (
                        <div>
                            {
                                addressList.length > 0 && (
                                    <select className='border border-slate-400 p-2 w-full my-3 outline-none rounded' onChange={(e) => setSelectedAddress(addressList[e.target.value])} >
                                        <option value="">Select Address</option>
                                        {
                                            addressList.map((address, index) => (
                                                <option key={index} value={index}>{address.name}, {address.city}, {address.state}, {address.zip}</option>
                                            ))
                                        }
                                    </select>
                                )
                            }
                            <button className='flex items-center gap-1 text-slate-600 mt-1' onClick={() => setShowAddressModal(true)} >Add Address <PlusIcon size={18} /></button>
                        </div>
                    )
                }
            </div>
            {/* Loyalty Points Redemption */}
            {loyaltyData.points > 0 && (
                <div className='bg-indigo-50 border border-indigo-100 p-3 rounded-lg mb-6'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2 text-indigo-700'>
                            <GiftIcon size={18} />
                            <span className='font-medium text-xs'>Redeem Points: {loyaltyData.points}</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={redeemPoints} onChange={() => setRedeemPoints(!redeemPoints)} className="sr-only peer" />
                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                    </div>
                    {redeemPoints && (
                        <p className='text-[10px] text-indigo-500 mt-1'>
                            Redeeming {Math.min(loyaltyData.points, Math.floor(tieredDiscountedPrice * POINT_REDEEM_RATE))} points for {currency}{redemptionAmount} discount.
                        </p>
                    )}
                </div>
            )}

            {/* Estimated Points to Earn for Stripe */}
            {paymentMethod === 'STRIPE' && (
                <div className='flex items-center gap-2 mb-6 px-3 py-2 bg-green-50 border border-green-100 rounded-lg'>
                    <CoinsIcon size={16} className='text-green-600' />
                    <span className='text-xs font-medium text-green-700'>
                        Earn {estimatedPoints.toLocaleString()} points on success
                    </span>
                </div>
            )}

            <div className='pb-4 border-b border-slate-200'>
                <div className='flex justify-between'>
                    <div className='flex flex-col gap-1 text-slate-400'>
                        <p>Subtotal:</p>
                        {discounts.orderValueDiscountAmount > 0 && <p className='text-green-600'>Tiered Discount ({discounts.orderValueDiscountPercent}%):</p>}
                        {discounts.membershipDiscountAmount > 0 && <p className='text-indigo-600'>{loyaltyData.tier} Discount ({discounts.membershipDiscountPercent}%):</p>}
                        {redeemPoints && <p className='text-amber-600'>Points Redeemed:</p>}
                        <p>Shipping:</p>
                        {coupon && <p>Coupon:</p>}
                    </div>
                    <div className='flex flex-col gap-1 font-medium text-right'>
                        <p>{currency}{totalPrice.toLocaleString()}</p>
                        {discounts.orderValueDiscountAmount > 0 && <p className='text-green-600'>-{currency}{discounts.orderValueDiscountAmount}</p>}
                        {discounts.membershipDiscountAmount > 0 && <p className='text-indigo-600'>-{currency}{discounts.membershipDiscountAmount}</p>}
                        {redeemPoints && <p className='text-amber-600'>-{currency}{redemptionAmount}</p>}
                        <p><Protect plan={'plus'} fallback={`${currency}${shippingFee}`}>Free</Protect></p>
                        {coupon && <p>{`-${currency}${couponDiscountAmount.toFixed(2)}`}</p>}
                    </div>
                </div>
                {
                    !coupon ? (
                        <form onSubmit={e => toast.promise(handleCouponCode(e), { loading: 'Checking Coupon...' })} className='flex justify-center gap-3 mt-3'>
                            <input onChange={(e) => setCouponCodeInput(e.target.value)} value={couponCodeInput} type="text" placeholder='Coupon Code' className='border border-slate-400 p-1.5 rounded w-full outline-none' />
                            <button className='bg-slate-600 text-white px-3 rounded hover:bg-slate-800 active:scale-95 transition-all'>Apply</button>
                        </form>
                    ) : (
                        <div className='w-full flex items-center justify-center gap-2 text-xs mt-2'>
                            <p>Code: <span className='font-semibold ml-1'>{coupon.code.toUpperCase()}</span></p>
                            <p>{coupon.description}</p>
                            <XIcon size={18} onClick={() => setCoupon('')} className='hover:text-red-700 transition cursor-pointer' />
                        </div>
                    )
                }
            </div>
            <div className='flex justify-between py-4'>
                <p className='text-slate-800 font-semibold'>Total:</p>

                <p className='font-bold text-slate-900 text-lg'>
                    {currency}{(
                        tieredDiscountedPrice
                        - couponDiscountAmount
                        - redemptionAmount
                        + shippingFee
                    ).toFixed(2)}
                </p>
            </div>
            <button onClick={e => toast.promise(handlePlaceOrder(e), { loading: 'placing Order...' })} className='w-full bg-slate-700 text-white py-2.5 rounded hover:bg-slate-900 active:scale-95 transition-all'>Place Order</button>

            {showAddressModal && <AddressModal setShowAddressModal={setShowAddressModal} />}

        </div>
    )
}

export default OrderSummary