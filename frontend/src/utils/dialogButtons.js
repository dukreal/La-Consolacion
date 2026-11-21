// Buttons of the small admin pop-ups (IconModal, Inventory's Confirm Delete): same height, corners and colours
// as the product forms. Hover colours only on devices with a mouse, so a tapped button does not stay tinted on phones.
const base =
  'min-h-11 px-5 py-2 rounded-[10px] font-semibold leading-tight transition-colors duration-200 outline-none focus-visible:ring-4 focus-visible:ring-[#2474b6]/25 disabled:opacity-60'

export const navyButton = `${base} bg-[#22306a] [@media(hover:hover)]:hover:bg-[#1a2550] text-white`
export const dangerButton = `${base} bg-red-600 [@media(hover:hover)]:hover:bg-red-700 text-white`
export const confirmButton = `${base} bg-emerald-600 [@media(hover:hover)]:hover:bg-emerald-700 text-white`
export const cancelButton = `${base} border-[1.5px] border-[#d8dce8] bg-white text-[#22306a] [@media(hover:hover)]:hover:border-[#22306a] [@media(hover:hover)]:hover:bg-[#f5f6fa]`
