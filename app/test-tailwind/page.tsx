export default function TestTailwindPage() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-4xl font-bold text-red-600 bg-yellow-200 p-4 rounded">
          Tailwind Test Page
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-500 text-white p-6 rounded-lg shadow-lg">
            Blue Box
          </div>
          <div className="bg-green-500 text-white p-6 rounded-lg shadow-lg">
            Green Box
          </div>
          <div className="bg-purple-500 text-white p-6 rounded-lg shadow-lg">
            Purple Box
          </div>
        </div>

        <div className="flex gap-4">
          <button className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
            Red Button
          </button>
          <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
            Blue Button
          </button>
        </div>

        <div className="bg-gradient-to-r from-pink-500 to-violet-500 text-white p-8 rounded-xl">
          <p className="text-2xl font-bold">If you see colors and styling, Tailwind is working!</p>
        </div>
      </div>
    </div>
  );
}

