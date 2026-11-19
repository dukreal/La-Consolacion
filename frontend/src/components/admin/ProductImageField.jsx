import { UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'

// The picture box of the admin product forms: a dashed "Click to upload or drag and drop" box,
// and after a picture is chosen, a small preview with a remove (×) button.
//   currentUrl: the saved picture when editing (shown until it is removed or replaced)
//   file / onChange: the newly chosen file (null when none)
//   editable: false for Admins on Edit Product (they only see the picture)
//   variant: 'add' or 'edit' (the old Add and Edit pages had slightly different remove buttons)
export default function ProductImageField({ currentUrl = '', file, onChange, editable = true, required = false, variant = 'add' }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState('')
  const [currentRemoved, setCurrentRemoved] = useState(false)

  // Show the chosen file without uploading it yet (same FileReader way as the old page)
  const pick = (picked) => {
    onChange(picked)
    setPreview('')
    if (!picked) return
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target.result)
    reader.readAsDataURL(picked)
  }

  const shownUrl = preview || (currentRemoved ? '' : currentUrl)

  const remove = () => {
    if (inputRef.current) inputRef.current.value = '' // lets the same file be picked again
    pick(null)
    setCurrentRemoved(true)
  }

  const removeButton =
    variant === 'add' ? (
      <button
        type="button"
        id="removeImageBtn"
        onClick={remove}
        title="Remove image"
        className="absolute top-0 right-0 flex items-center justify-center w-8 h-8 bg-white bg-opacity-80 rounded-full text-xl font-bold leading-none text-gray-700 hover:bg-red-100 hover:text-red-600 transition"
      >
        ×
      </button>
    ) : (
      <button
        type="button"
        id="removeImageBtn"
        onClick={remove}
        title="Remove image"
        className="absolute -top-3 -right-3 w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-full shadow hover:bg-red-600 transition border-2 border-white z-10"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="block">
          <line x1="3" y1="3" x2="9" y2="9" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <line x1="9" y1="3" x2="3" y2="9" stroke="white" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    )

  return (
    <div className="flex flex-col items-center">
      {shownUrl && (
        <div id="imagePreviewContainer" className="relative mb-2">
          <img
            id="imagePreview"
            src={shownUrl}
            alt={variant === 'add' ? 'Preview' : 'Current Image'}
            className={
              variant === 'add'
                ? 'w-32 h-32 object-cover rounded-xl shadow-lg border-2 border-blue-100 bg-white'
                : 'w-32 h-32 object-cover rounded-xl mb-2 shadow'
            }
          />
          {editable && removeButton}
        </div>
      )}
      {/* The file input stays on the page (hidden) so the browser's "required" check still works */}
      {editable && (
        <label
          id="uploadBox"
          className={`w-full flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50 text-gray-600 cursor-pointer transition hover:bg-gray-100 relative ${shownUrl ? 'hidden' : ''}`}
        >
          <span className="text-4xl mb-2">
            <UploadCloud className={`${variant === 'add' ? 'w-12 h-12' : 'w-10 h-10'} mx-auto text-gray-400`} />
          </span>
          <span className="font-medium text-base mb-1">Click to upload or drag and drop</span>
          <span className="text-xs text-gray-400 mb-2">PNG, JPG, GIF up to 10MB</span>
          <input
            ref={inputRef}
            type="file"
            id="itemImage"
            accept="image/*"
            required={required && !file}
            onChange={(e) => pick(e.target.files[0] || null)}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </label>
      )}
      <div style={{ fontSize: 11, color: '#64748b', textAlign: 'left', marginTop: 4 }}>
        For best results, upload a 1x1 (square) image.
      </div>
    </div>
  )
}
