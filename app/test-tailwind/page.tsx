export default function TestTailwindPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <div className="flex flex-col items-center justify-center max-w-4xl w-full space-y-8 text-center">
        <h1 className="text-4xl font-bold text-red-600 bg-yellow-200 p-4 rounded shadow">
          Tailwind Test Page
        </h1>

        <div className="flex flex-wrap justify-center gap-6 w-full">
          <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg w-64">
            Blue Box
          </div>
          <div className="bg-green-500 text-white p-6 rounded-lg shadow-lg w-64">
            Green Box
          </div>
          <div className="bg-purple-500 text-white p-6 rounded-lg shadow-lg w-64">
            Purple Box
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <button className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
            Red Button
          </button>
          <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Blue Button
          </button>
        </div>

        <div className="bg-gradient-to-r from-pink-500 to-violet-500 text-white p-8 rounded-xl shadow-lg max-w-xl">
          <p className="text-2xl font-bold">
            If you see colors and styling, Tailwind is working!
          </p>
        </div>
      </div>
    </div>
  );
}
