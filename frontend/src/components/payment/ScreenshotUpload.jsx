import { useEffect, useMemo, useRef, useState } from 'react'

// "Upload Payment Screenshot": click or drag a picture, see a preview, remove it with the x.
export default function ScreenshotUpload({ file, onChange }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  // A temporary address for the chosen picture, so it can be shown as a preview
  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file])
  // ...freed again when the picture changes or the page closes
  useEffect(() => () => previewUrl && URL.revokeObjectURL(previewUrl), [previewUrl])

  const choose = (picked) => {
    if (picked && picked.type.startsWith('image/')) onChange(picked)
  }

  const remove = () => {
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Upload Payment Screenshot</label>
      <div
        id="fileUpload"
        className={`file-upload-area rounded-lg p-6 text-center cursor-pointer${dragging ? ' dragover' : ''}`}
        onClick={() => inputRef.current?.click()}
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
        <input
          ref={inputRef}
          type="file"
          id="fileInput"
          accept="image/*"
          className="hidden"
          onChange={(e) => choose(e.target.files?.[0])}
        />
        <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          ></path>
        </svg>
        <p className="text-sm text-gray-600 mb-1">Click to upload or drag and drop</p>
        <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
      </div>

      {file && previewUrl && (
        <div id="filePreview" className="mt-3">
          <div className="image-preview">
            <img
              id="previewImage"
              src={previewUrl}
              alt="Payment screenshot preview"
              className="w-32 h-32 object-cover rounded-lg border"
            />
            <button type="button" className="remove-btn" id="removeBtn" onClick={remove} aria-label="Remove screenshot">
              ×
            </button>
          </div>
          <p id="fileName" className="text-sm text-gray-600 mt-1">
            {file.name}
          </p>
        </div>
      )}
    </div>
  )
}
