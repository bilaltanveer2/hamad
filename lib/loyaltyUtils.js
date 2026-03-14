/**
 * Loyalty & Discount Utilities
 */

export const MEMBERSHIP_DISCOUNTS = {
    REGULAR: 0,
    PLUS: 5,     // 5% extra discount
    PREMIUM: 10,  // 10% extra discount
};

export const ORDER_VALUE_TIERS = [
    { min: 1000, discount: 1 },  // 1%
    { min: 500, discount: 0.7 }, // 0.7%
];

export const POINT_REDEEM_RATE = 1000; // 1000 points = $1

/**
 * Calculate multi-level discounts
 * @param {number} subtotal - The total price of items before any discounts
 * @param {string} tier - User membership tier (REGULAR, PLUS, PREMIUM)
 * @returns {object} - Breakdown of discounts
 */
export function calculateDiscounts(subtotal, tier = 'REGULAR') {
    let orderValueDiscountPercent = 0;
    for (const tierObj of ORDER_VALUE_TIERS) {
        if (subtotal >= tierObj.min) {
            orderValueDiscountPercent = tierObj.discount;
            break;
        }
    }

    const membershipDiscountPercent = MEMBERSHIP_DISCOUNTS[tier] || 0;

    const orderValueDiscountAmount = (subtotal * orderValueDiscountPercent) / 100;
    const membershipDiscountAmount = (subtotal * membershipDiscountPercent) / 100;

    return {
        orderValueDiscountPercent,
        orderValueDiscountAmount: parseFloat(orderValueDiscountAmount.toFixed(2)),
        membershipDiscountPercent,
        membershipDiscountAmount: parseFloat(membershipDiscountAmount.toFixed(2)),
        totalDiscountAmount: parseFloat((orderValueDiscountAmount + membershipDiscountAmount).toFixed(2))
    };
}

/**
 * Calculate points earned for an order
 * @param {number} total - Final amount paid
 * @returns {number} - Points earned
 */
export function calculatePointsEarned(total) {
    return Math.floor(total * 1000); // 1000 points per $1
}
