// Full-screen "Loading..." shown while the order is prepared for the payment page.
export default function LoadingOverlay() {
  return (
    <div id="loadingOverlay" className="fixed inset-0 bg-white/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center animate-fade-in">
        {/* Simple Spinner */}
        <div className="mb-8 flex justify-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-900 rounded-full animate-spin-slow"></div>
        </div>
        {/* Loading Text */}
        <p className="text-gray-600 font-medium animate-pulse-slow text-lg">Loading...</p>
      </div>
    </div>
  )
}
