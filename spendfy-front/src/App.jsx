import { Wallet, TrendingUp, ArrowUpRight } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white p-8">
      <header className="flex items-center gap-3 mb-8">
        <Wallet className="text-emerald-500" size={32} />
        <h1 className="text-2xl font-bold tracking-tight">SpendFy</h1>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl">
          <div className="flex justify-between items-start mb-4">
            <span className="text-zinc-400 text-sm">Saldo Total</span>
            <TrendingUp size={20} className="text-emerald-500" />
          </div>
          <h2 className="text-3xl font-bold">R$ 4.500,00</h2>
          <div className="mt-4 flex items-center gap-1 text-xs text-emerald-500">
            <ArrowUpRight size={14} />
            <span>+12% este mês</span>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;