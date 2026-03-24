import { useEffect, useState } from 'react';
import api from '../api/axios';
import {
  Loader2,
  TrendingUp,
  TrendingDown,
  Star,
  Brain,
  BarChart3,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const CLASSIFICACAO_CONFIG = {
  EXCELENTE: { label: 'Excelente', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', barColor: 'bg-green-500' },
  BOM: { label: 'Bom', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', barColor: 'bg-blue-500' },
  REGULAR: { label: 'Regular', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', barColor: 'bg-yellow-400' },
  ATENÇÃO: { label: 'Atenção', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', barColor: 'bg-red-500' },
};

export default function Insights() {
  const [score, setScore] = useState(null);
  const [previsao, setPrevisao] = useState([]);
  const [relatorio, setRelatorio] = useState(null);
  const [loadingScore, setLoadingScore] = useState(true);
  const [loadingPrevisao, setLoadingPrevisao] = useState(true);
  const [loadingRelatorio, setLoadingRelatorio] = useState(true);
  const [errorScore, setErrorScore] = useState('');
  const [errorPrevisao, setErrorPrevisao] = useState('');
  const [errorRelatorio, setErrorRelatorio] = useState('');

  useEffect(() => {
    const fetchScore = async () => {
      try {
        const res = await api.get('/insights/score');
        setScore(res.data);
      } catch (err) {
        setErrorScore('Não foi possível carregar o score financeiro.');
      } finally {
        setLoadingScore(false);
      }
    };

    const fetchPrevisao = async () => {
      try {
        const res = await api.get('/insights/previsao');
        setPrevisao(res.data);
      } catch (err) {
        setErrorPrevisao('Não foi possível carregar a previsão de gastos.');
      } finally {
        setLoadingPrevisao(false);
      }
    };

    const fetchRelatorio = async () => {
      try {
        const res = await api.get('/insights/relatorio-mensal');
        setRelatorio(res.data);
      } catch (err) {
        setErrorRelatorio('Não foi possível carregar o relatório mensal.');
      } finally {
        setLoadingRelatorio(false);
      }
    };

    fetchScore();
    fetchPrevisao();
    fetchRelatorio();
  }, []);

  const config = score ? (CLASSIFICACAO_CONFIG[score.classificacao] || CLASSIFICACAO_CONFIG['REGULAR']) : null;

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Insights Financeiros</h1>
        <p className="text-sm text-gray-500">Análise inteligente das suas finanças do mês atual</p>
      </div>

      {/* ─── Score Financeiro ─────────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Star size={18} className="text-yellow-500" />
          <h2 className="text-lg font-bold text-gray-800">Score Financeiro</h2>
        </div>

        {loadingScore ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 flex justify-center">
            <Loader2 className="animate-spin text-blue-600" size={28} />
          </div>
        ) : errorScore ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">{errorScore}</div>
        ) : score && (
          <div className={`bg-white rounded-xl border ${config.border} shadow-sm p-6`}>
            <div className="flex items-center gap-6 mb-6">
              {/* Gauge visual */}
              <div className={`flex-shrink-0 w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 ${config.border} ${config.bg}`}>
                <span className={`text-3xl font-bold ${config.color}`}>{score.score}</span>
                <span className="text-xs text-gray-500">/ 100</span>
              </div>
              <div>
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${config.bg} ${config.color} border ${config.border} mb-2`}>
                  {config.label}
                </div>
                <div className="w-48 h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${config.barColor}`}
                    style={{ width: `${score.score}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {score.fatoresPositivos?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">
                    Pontos positivos
                  </p>
                  <ul className="space-y-1.5">
                    {score.fatoresPositivos.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <CheckCircle2 size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {score.fatoresNegativos?.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-red-700 uppercase tracking-wider mb-2">
                    Pontos de atenção
                  </p>
                  <ul className="space-y-1.5">
                    {score.fatoresNegativos.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <AlertCircle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ─── Previsão de Gastos ───────────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 size={18} className="text-blue-600" />
          <h2 className="text-lg font-bold text-gray-800">Previsão de Gastos por Categoria</h2>
        </div>

        {loadingPrevisao ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 flex justify-center">
            <Loader2 className="animate-spin text-blue-600" size={28} />
          </div>
        ) : errorPrevisao ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">{errorPrevisao}</div>
        ) : previsao.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
            Dados insuficientes para gerar previsão (necessário histórico de pelo menos 1 mês).
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Categoria</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Média Mensal</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Gasto Atual</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Diferença</th>
                  <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Situação</th>
                </tr>
              </thead>
              <tbody>
                {previsao.map((item) => {
                  const acima = item.diferenca > 0;
                  const abaixo = item.diferenca < 0;
                  return (
                    <tr key={item.idCategoria} className="border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 text-sm">{item.nomeCategoria}</td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600">
                        {formatCurrency(item.mediaMensal)}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-semibold text-gray-800">
                        {formatCurrency(item.gastoAtualMes)}
                      </td>
                      <td className={`px-6 py-4 text-right text-sm font-semibold ${acima ? 'text-red-600' : abaixo ? 'text-green-600' : 'text-gray-500'}`}>
                        {acima ? '+' : ''}{formatCurrency(item.diferenca)}
                      </td>
                      <td className="px-6 py-4">
                        {acima ? (
                          <div className="flex items-center gap-1 text-red-600">
                            <TrendingUp size={14} />
                            <span className="text-xs font-medium">Acima do previsto</span>
                          </div>
                        ) : abaixo ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <TrendingDown size={14} />
                            <span className="text-xs font-medium">Abaixo do previsto</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">No previsto</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─── Relatório Mensal com IA ──────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <Brain size={18} className="text-purple-600" />
          <h2 className="text-lg font-bold text-gray-800">Relatório Mensal com IA</h2>
        </div>

        {loadingRelatorio ? (
          <div className="bg-white rounded-xl border border-gray-200 p-8 flex justify-center">
            <Loader2 className="animate-spin text-blue-600" size={28} />
          </div>
        ) : errorRelatorio ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm">{errorRelatorio}</div>
        ) : relatorio && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
            {/* Resumo IA */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain size={16} className="text-purple-600" />
                <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider">
                  Análise da IA
                </span>
              </div>
              <p className="text-gray-800 text-sm leading-relaxed">{relatorio.resumo}</p>
            </div>

            {/* Destaques */}
            {relatorio.destaques?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Destaques</p>
                <ul className="space-y-1.5">
                  {relatorio.destaques.map((d, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0 mt-2" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Números do mês */}
            <div className="grid grid-cols-3 gap-4 pt-2 border-t border-gray-100">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Receitas</p>
                <p className="font-bold text-green-600">{formatCurrency(relatorio.totalReceitas)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Despesas</p>
                <p className="font-bold text-red-600">{formatCurrency(relatorio.totalDespesas)}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Score</p>
                <p className="font-bold text-blue-600">{relatorio.score} / 100</p>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
