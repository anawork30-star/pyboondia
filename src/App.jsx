import React from 'react';

function App() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Barra de Navegación */}
      <nav className="bg-white shadow-md p-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-extrabold text-emerald-600">Parfit</h1>
          <button className="bg-emerald-600 text-white px-5 py-2 rounded-md font-semibold hover:bg-emerald-700 transition">
            Admin Login
          </button>
        </div>
      </nav>

      {/* Encabezado Principal */}
      <header className="bg-emerald-600 text-white text-center py-20 px-4">
        <h2 className="text-4xl md:text-5xl font-extrabold mb-4">Bienvenido a aiduoficial.com</h2>
        <p className="text-xl max-w-2xl mx-auto">
          Tu plataforma de comercio electrónico. El catálogo dinámico y la pasarela de pagos están listos para configurarse.
        </p>
      </header>

      {/* Catálogo de Productos */}
      <main className="max-w-6xl mx-auto p-6 mt-8">
        <h3 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-2">Catálogo de Productos</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Producto 1 */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition">
            <div className="h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center text-gray-400 font-medium">
              [Imagen del Producto]
            </div>
            <h4 className="font-bold text-lg text-gray-800">Producto de Prueba 1</h4>
            <p className="text-emerald-600 font-bold text-xl my-3">$25.000 COP</p>
            <button className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition">
              Pagar con Mercado Pago
            </button>
          </div>

          {/* Producto 2 */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition">
            <div className="h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center text-gray-400 font-medium">
              [Imagen del Producto]
            </div>
            <h4 className="font-bold text-lg text-gray-800">Producto de Prueba 2</h4>
            <p className="text-emerald-600 font-bold text-xl my-3">$35.000 COP</p>
            <button className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition">
              Pagar con Mercado Pago
            </button>
          </div>

          {/* Producto 3 */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition">
            <div className="h-48 bg-gray-200 rounded-lg mb-4 flex items-center justify-center text-gray-400 font-medium">
              [Imagen del Producto]
            </div>
            <h4 className="font-bold text-lg text-gray-800">Producto de Prueba 3</h4>
            <p className="text-emerald-600 font-bold text-xl my-3">$15.000 COP</p>
            <button className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition">
              Pagar con Mercado Pago
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;