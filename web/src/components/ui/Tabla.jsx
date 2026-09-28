export default function Tabla({ columnas, datos }) {
  return (
    <div className="overflow-x-auto border border-gray-200 rounded-sm">
      <table className="w-full text-left text-sm text-gray-600">
        <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
          <tr>
            {columnas.map((col, idx) => (
              <th key={idx} className="p-md">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {datos.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              {Object.values(row).map((val, i) => (
                <td key={i} className="p-md">{val}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}