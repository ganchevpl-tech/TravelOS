// src/components/TravelOS/pricing.ts

export interface MarketFees {
  local: number;
  europe: number;
  asia: number;
}

// Първоначални такси (тези, които GM панелът Shield ще променя)
export let marketFees: MarketFees = {
  local: 15,   // Балкани (БГ, Румъния)
  europe: 40,  // ЕС / UK
  asia: 90     // Азия / ОАЕ
};

export const updateMarketFees = (newFees: MarketFees) => {
  marketFees = { ...newFees };
};

// Официални данъчни лимити за нощувка (Наредба за командировки)
// Тези цифри AI използва, за да каже "✅ 100% Tax Deductible"
export const statutoryLimits: Record<string, number> = {
  BG: 60,  // България
  RO: 125, // Румъния (за Букурещ)
  DE: 150, // Германия (за Мюнхен)
  INTL: 100 // Всичко останало
};

/**
 * ГЛАВНАТА ЦЕНОВА МАШИНА
 */
export function calculatePricing(
  vendorCost: number, 
  destinationCode: string, 
  compPrice: number, // Цената в Booking.com
  role: 'CEO' | 'Manager' | 'Specialist' = 'Manager'
) {
  // 1. Определяме региона (OTP е Букурещ - слагаме го в Local)
  const isLocal = ['SOF', 'VAR', 'BOJ', 'OTP'].includes(destinationCode.toUpperCase());
  const fee = isLocal ? marketFees.local : marketFees.europe;

  // 2. Логика "Best Price Guaranteed" (Винаги с €2 по-евтино от Booking)
  const targetPrice = compPrice - 2;

  // 3. ПРОВЕРКА ЗА ДАНЪЧНО СЪОТВЕТСТВИЕ (Compliance)
  // Изчисляваме лимита спрямо ролята (CEO-то има право на по-скъпи хотели)
  const countryCode = destinationCode === 'OTP' ? 'RO' : 'INTL';
  const baseLimit = statutoryLimits[countryCode];
  
  const roleMultiplier = role === 'CEO' ? 2 : role === 'Manager' ? 1.5 : 1;
  const totalTaxLimit = baseLimit * roleMultiplier;

  const isTaxCompliant = targetPrice <= totalTaxLimit;

  return {
    finalPrice: targetPrice,
    margin: targetPrice - vendorCost,
    isTaxCompliant,
    taxLimit: totalTaxLimit,
    savingsVsBooking: compPrice - targetPrice,
    appliedFee: fee
  };
}
