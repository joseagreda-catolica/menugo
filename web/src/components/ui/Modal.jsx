export default function Modal({ isOpen, onClose, titulo, children }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-lg">
      <div className="bg-white rounded-lg max-w-md w-full p-xl shadow-xl relative">
        <div className="flex justify-between items-center mb-md border-b pb-sm">
          <h3 className="text-lg font-bold text-gray-800">{titulo}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  )
}