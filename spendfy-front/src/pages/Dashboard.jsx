import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, TrendingUp, PiggyBank, Loader2 } from 'lucide-react';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
};

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [transacoesRecentes, setTransacoesRecentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const [dashRes, transRes] = await Promise.all([
          api.get('/dashboard'),
          api.get('/transacoes', { params: { size: 10, sort: 'data,desc' } }),
        ]);
        setDashboard(dashRes.data);
        setTransacoesRecentes(transRes.data.content || []);
      } catch (err) {
        console.error('Erro ao carregar dashboard:', err);
        setError('Erro ao carregar dados do dashboard.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Resumo Financeiro</h1>
        <p className="text-sm text-gray-500">Visão geral do mês atual</p>
      </div>

      {/* Cards resumo do mês */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Saldo Total (contas)</p>
              <h2 className={`text-xl font-bold ${(dashboard?.saldoTotal ?? 0) >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                {formatCurrency(dashboard?.saldoTotal)}
              </h2>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full text-green-600">
              <ArrowUpCircle size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Receitas do Mês</p>
              <h2 className="text-xl font-bold text-green-600">
                {formatCurrency(dashboard?.totalReceitasMes)}
              </h2>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-full text-red-600">
              <ArrowDownCircle size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Despesas do Mês</p>
              <h2 className="text-xl font-bold text-red-600">
                {formatCurrency(dashboard?.totalDespesasMes)}
              </h2>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Top Categorias */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={18} className="text-blue-600" />
            <h3 className="font-bold text-gray-800">Top Categorias do Mês</h3>
          </div>
          {dashboard?.topCategorias?.length > 0 ? (
            <div className="space-y-3">
              {dashboard.topCategorias.map((cat) => (
                <div key={cat.idCategoria}>
                  <div className="flex justify-between text-sm mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full inline-block flex-shrink-0"
                        style={{ backgroundColor: cat.cor || '#6b7280' }}
                      />
                      <span className="font-medium text-gray-700">{cat.nome}</span>
                    </div>
                    <span className="text-gray-500 text-xs">
                      {formatCurrency(cat.total)} ({(cat.percentualDoTotal ?? 0).toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(cat.percentualDoTotal ?? 0, 100)}%`,
                        backgroundColor: cat.cor || '#6b7280',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              Nenhuma despesa registrada este mês.
            </p>
          )}
        </div>

        {/* Orçamentos Ativos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PiggyBank size={18} className="text-blue-600" />
              <h3 className="font-bold text-gray-800">Orçamentos Ativos</h3>
            </div>
            <Link to="/orcamentos" className="text-xs text-blue-600 hover:underline">
              Ver todos
            </Link>
          </div>
          {dashboard?.orcamentosAtivos?.length > 0 ? (
            <div className="space-y-4">
              {dashboard.orcamentosAtivos.map((orc) => {
                const pct = orc.valorLimite > 0
                  ? Math.min((orc.valorGasto / orc.valorLimite) * 100, 100)
                  : 0;
                const estourado = orc.valorGasto > orc.valorLimite;
                return (
                  <div key={orc.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{orc.nomeCategoria}</span>
                      <span className={`text-xs ${estourado ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                        {formatCurrency(orc.valorGasto)} / {formatCurrency(orc.valorLimite)}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${estourado ? 'bg-red-500' : pct >= 80 ? 'bg-orange-400' : 'bg-green-500'}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {pct.toFixed(0)}% utilizado
                      {estourado && <span className="text-red-600 font-semibold ml-1">— Excedido!</span>}
                    </p>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-400 text-center py-6">
              Nenhum orçamento ativo no momento.{' '}
              <Link to="/orcamentos" className="text-blue-500 hover:underline">Criar orçamento</Link>
            </p>
          )}
        </div>
      </div>

      {/* Últimas Movimentações */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800">Últimas Movimentações</h3>
          <Link to="/transacoes" className="text-xs text-blue-600 hover:underline">
            Ver todas
          </Link>
        </div>
        {transacoesRecentes.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm">
            Nenhuma transação registrada.
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Descrição</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Categoria</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Valor</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Data</th>
              </tr>
            </thead>
            <tbody>
              {transacoesRecentes.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-gray-800 text-sm">{t.descricao || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">
                      {t.nomeCategoria || '—'}
                    </span>
                  </td>
                  <td className={`px-6 py-4 font-bold text-sm ${t.tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.tipo === 'RECEITA' ? '+' : '−'} {formatCurrency(t.valor)}
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{formatDate(t.data)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
