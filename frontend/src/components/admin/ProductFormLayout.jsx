import { Link } from 'react-router-dom'

// Small blue heading over a group of fields ("Details", "Price and stock", "Customer", "Piece").
// Fields sit 2 per row from 640px; with `threeWide`, 3 per row on wide screens (1280px and up).
export function FormSection({ title, threeWide = false, children }) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#2474b6]">{title}</h2>
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${threeWide ? 'xl:grid-cols-3' : ''} gap-4`}>{children}</div>
    </section>
  )
}

// The page around the admin product forms:
//   title and subtitle in the same place as the other admin pages, then one card with the photo on the left and
//   the fields on the right (photo on top on phones), and Cancel / Save at the bottom.
//   photo: the picture field; children: the field sections; notice: an optional message above the fields
export default function ProductFormLayout({ title, subtitle, error, notice, photo, saving, savingLabel, submitLabel, onSubmit, children }) {
  return (
    <>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-[1.375rem] leading-tight sm:text-4xl font-bold text-gray-800 sm:mb-2" style={{ letterSpacing: '-0.01em' }}>{title}</h1>
        {subtitle && <p className="text-gray-600 text-sm sm:text-lg break-words">{subtitle}</p>}
      </div>

      <form onSubmit={onSubmit} className="max-w-4xl bg-white rounded-2xl shadow-lg border border-blue-100 p-4 sm:p-6 mb-8">
        {error && (
          <div id="formError" className="mb-5 p-3 rounded-[10px] border border-red-200 bg-red-50 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}
        {notice}
        <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] gap-6">
          <div className="w-full max-w-[14rem] mx-auto sm:mx-0">{photo}</div>
          <div className="min-w-0 space-y-6">
            {children}
            {/* Phones: Save full width with Cancel under it, so long labels always fit */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-1">
              <Link
                to="/admin/inventory"
                className="h-11 px-5 rounded-[10px] border-[1.5px] border-[#d8dce8] bg-white text-[#22306a] font-semibold hover:border-[#22306a] hover:bg-[#f5f6fa] transition-colors flex items-center justify-center"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="h-11 px-6 rounded-[10px] bg-[#22306a] hover:bg-[#1a2550] text-white font-semibold transition-colors disabled:opacity-60"
              >
                {saving && savingLabel ? savingLabel : submitLabel}
              </button>
            </div>
          </div>
        </div>
      </form>
    </>
  )
}
