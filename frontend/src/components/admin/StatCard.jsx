// A coloured counter card (Overview and Orders use the same one, so they are the same size when you switch tabs).
// Phones: compact, two per row, with the label under the icon and number. Wider screens: label beside the number.
// The bottom line is a short note (e.g. "This week: 9") with a small icon. While loading, pass a placeholder as value.
export default function StatCard({ gradient, icon: Icon, value, label, note, noteIcon: NoteIcon, stat }) {
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${gradient} rounded-2xl p-3.5 sm:p-6 text-white shadow-xl`}>
      <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-5 rounded-full translate-y-12 -translate-x-12"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-2 sm:mb-4">
          <div className="w-9 h-9 sm:w-14 sm:h-14 flex-shrink-0 bg-white bg-opacity-30 rounded-lg sm:rounded-xl flex items-center justify-center backdrop-blur-sm shadow-lg">
            <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-white drop-shadow-lg" />
          </div>
          <div className="text-right">
            <div className="text-2xl sm:text-4xl font-bold text-white drop-shadow-lg" data-stat={stat}>{value}</div>
            <div className="hidden sm:block text-white text-base font-semibold drop-shadow-md">{label}</div>
          </div>
        </div>
        <div className="sm:hidden text-white text-sm font-semibold leading-tight drop-shadow-md">{label}</div>
        <div className="flex items-center justify-between gap-2 mt-0.5 sm:mt-0">
          <span className="text-white text-xs sm:text-base font-medium drop-shadow-md">{note}</span>
          <div className="hidden sm:flex items-center text-white">
            <NoteIcon className="w-4 h-4 drop-shadow-lg" />
          </div>
        </div>
      </div>
    </div>
  )
}
