import { useEffect, useMemo, useRef, useState } from 'react'

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif']

// "Upload Payment Screenshot": click or drag a picture. Once one is chosen, the box is replaced by
// a small preview row with the file name and an x to remove it (so the form stays short).
export default function ScreenshotUpload({ file, onChange, invalid = false }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  // A temporary address for the chosen picture, so it can be shown as a preview
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file])
  // ...freed again when the picture changes or the page closes
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl])

  // Only the types the server accepts for payment screenshots (payment.php), same as the hint below
  const choose = (picked) => {
    if (picked && ALLOWED_TYPES.includes(picked.type)) onChange(picked)
  }

  const remove = () => {
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <span className="pay-label">Upload Payment Screenshot</span>
      <input
        ref={inputRef}
        type="file"
        id="fileInput"
        accept={ALLOWED_TYPES.join(',')}
        className="hidden"
        onChange={(e) => choose(e.target.files?.[0])}
      />

      {file && previewUrl ? (
        <div id="filePreview" className="flex items-center gap-3 p-2.5 pr-3 rounded-[10px] border-[1.5px] border-[#e0e3eb] bg-[#f7f8fc]">
          <img
            id="previewImage"
            src={previewUrl}
            alt="Payment screenshot preview"
            className="w-12 h-12 flex-shrink-0 object-cover rounded-lg border border-[#e0e3eb] bg-white"
          />
          <div className="flex-1 min-w-0">
            <p id="fileName" className="text-sm font-medium text-[#22306a] truncate">
              {file.name}
            </p>
          </div>
          <button
            type="button"
            id="removeBtn"
            onClick={remove}
            aria-label="Remove screenshot"
            className="w-8 h-8 flex-shrink-0 rounded-full flex items-center justify-center text-[#5b6478] hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <i className="bx bx-x text-xl" aria-hidden="true"></i>
          </button>
        </div>
      ) : (
        <div
          id="fileUpload"
          role="button"
          tabIndex={0}
          className={`file-upload-area px-4 py-5 text-center cursor-pointer${dragging ? ' dragover' : ''}${invalid ? ' !border-red-500' : ''}`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              inputRef.current?.click()
            }
          }}
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            choose(e.dataTransfer.files?.[0])
          }}
        >
          <i className="bx bx-cloud-upload text-3xl text-[#8a93a8]" aria-hidden="true"></i>
          <p className="text-sm text-[#22306a] font-medium mt-1">Click to upload or drag and drop</p>
          <p className="text-xs pay-muted mt-0.5">PNG, JPG, GIF up to 10MB</p>
        </div>
      )}
    </div>
  )
}
