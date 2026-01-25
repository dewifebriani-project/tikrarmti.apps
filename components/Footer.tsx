export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-6 border-t border-green-900/20">
      <div className="container mx-auto px-3 md:px-4 lg:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <p className="text-sm md:text-base text-center md:text-left">
            © 2025 Markaz Tikrar Indonesia. Hak Cipta Dilindungi Undang-undang
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Powered by</span>
            <span className="text-sm md:text-base font-semibold text-green-400">Amana Digital</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
