import { UploadCloud } from 'lucide-react'
import { useRef, useState } from 'react'

// The photo of the admin product forms: a square "Upload photo" box, and once there is a picture, a square
// preview with Replace and Remove under it.
//   currentUrl: the saved picture when editing (shown until it is removed or replaced)
//   file / onChange: the newly chosen file (null when none)
//   editable: false for Admins on Edit Premade (they only see the picture)
//   required: Add Premade needs a picture
//   variant: 'add' or 'edit' (only changes the picture's alt text, as before)
export default function ProductImageField({ currentUrl = '', file, onChange, editable = true, required = false, variant = 'add' }) {
  const inputRef = useRef(null)
  const [preview, setPreview] = useState('')
  const [currentRemoved, setCurrentRemoved] = useState(false)

  // Show the chosen file without uploading it yet (same FileReader way as before)
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

  // Replace / Remove. Their hover colour only applies with a mouse, so a tap on a phone leaves no tint behind.
  const smallButton =
    'flex-1 h-9 rounded-lg border-[1.5px] border-[#d8dce8] bg-white text-sm font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#2474b6]/40'

  return (
    <div>
      {shownUrl && (
        <div id="imagePreviewContainer">
          <img
            id="imagePreview"
            src={shownUrl}
            alt={variant === 'add' ? 'Preview' : 'Current Image'}
            className="w-full aspect-square object-cover rounded-xl border border-gray-100 bg-[#f5f7fb]"
          />
          {editable && (
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => inputRef.current?.click()} className={`${smallButton} text-[#22306a] [@media(hover:hover)]:hover:border-[#22306a] [@media(hover:hover)]:hover:bg-[#f5f6fa]`}>
                Replace
              </button>
              <button type="button" id="removeImageBtn" onClick={remove} title="Remove image" className={`${smallButton} text-red-600 [@media(hover:hover)]:hover:border-red-300 [@media(hover:hover)]:hover:bg-red-50`}>
                Remove
              </button>
            </div>
          )}
        </div>
      )}
      {/* The file input stays on the page (hidden while a picture shows) so Replace and the browser's "required" check work */}
      {editable && (
        <label
          id="uploadBox"
          className={`relative w-full aspect-square flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-[#b9c3d6] bg-[#f8fafc] p-4 text-center cursor-pointer transition-colors hover:border-[#2474b6] hover:bg-[#f2f7fd] ${
            shownUrl ? 'hidden' : ''
          }`}
        >
          <UploadCloud className="w-9 h-9 text-[#2474b6] mb-1" />
          <span className="font-semibold text-[#22306a]">Upload photo</span>
          <span className="text-xs text-gray-500">or drag and drop</span>
          <span className="text-xs text-gray-400">PNG, JPG, GIF up to 10MB</span>
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
      <p className="mt-2 text-xs text-gray-500 text-center sm:text-left">For best results, upload a 1x1 (square) image.</p>
    </div>
  )
}
