import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';
import {
  Plus,
  Trash2,
  Pencil,
  ArrowUpRight,
  Search,
  Check,
  FileDown,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  Loader2,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
};

const RECORRENCIA_LABELS = {
  NENHUMA: null,
  DIARIA: 'Diária',
  SEMANAL: 'Semanal',
  MENSAL: 'Mensal',
  ANUAL: 'Anual',
};

export default function Transacoes() {
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Lista e paginação
  const [transacoes, setTransacoes] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const PAGE_SIZE = 20;

  // Dados auxiliares
  const [contas, setContas] = useState([]);
  const [categorias, setCategorias] = useState([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, transacao: null });

  // Filtros
  const [filters, setFilters] = useState({
    tipo: '',
    status: '',
    dataInicio: '',
    dataFim: '',
    categoriaId: '',
    contaId: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  const activeFilterCount = Object.values(appliedFilters).filter(Boolean).length;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Carregar dados auxiliares uma única vez
  useEffect(() => {
    const fetchAux = async () => {
      try {
        const [contasRes, catRes] = await Promise.all([
          api.get('/contas'),
          api.get('/categorias'),
        ]);
        setContas(contasRes.data);
        setCategorias(catRes.data);
      } catch (err) {
        console.error('Erro ao carregar filtros auxiliares:', err);
      }
    };
    fetchAux();
  }, []);

  const fetchTransacoes = async (page = 0, activeFilters = appliedFilters) => {
    setLoading(true);
    setError('');
    try {
      const params = {
        page,
        size: PAGE_SIZE,
        sort: 'data,desc',
      };
      if (activeFilters.tipo) params.tipo = activeFilters.tipo;
      if (activeFilters.status) params.status = activeFilters.status;
      if (activeFilters.dataInicio) params.dataInicio = activeFilters.dataInicio;
      if (activeFilters.dataFim) params.dataFim = activeFilters.dataFim;
      if (activeFilters.categoriaId) params.categoriaId = activeFilters.categoriaId;
      if (activeFilters.contaId) params.contaId = activeFilters.contaId;

      const res = await api.get('/transacoes', { params });
      setTransacoes(res.data.content || []);
      setTotalPages(res.data.totalPages || 0);
      setCurrentPage(res.data.number || 0);
      setTotalElements(res.data.totalElements || 0);
    } catch (err) {
      setError('Erro ao carregar transações.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransacoes(0, appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    fetchTransacoes(0, filters);
  };

  const handleClearFilters = () => {
    const empty = { tipo: '', status: '', dataInicio: '', dataFim: '', categoriaId: '', contaId: '' };
    setFilters(empty);
    setAppliedFilters(empty);
    fetchTransacoes(0, empty);
  };

  const handlePageChange = (newPage) => {
    fetchTransacoes(newPage, appliedFilters);
  };

  const handleExport = async (formato) => {
    setIsExportOpen(false);
    try {
      const response = await api.get(`/relatorios/${formato}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `relatorio-spendfy.${formato}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(`Erro ao gerar o arquivo ${formato.toUpperCase()}.`);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.transacao) return;
    setDeleting(true);
    try {
      await api.delete(`/transacoes/${deleteModal.transacao.id}`);
      setSuccessMsg('Transação excluída com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setDeleteModal({ open: false, transacao: null });
      fetchTransacoes(currentPage, appliedFilters);
    } catch (err) {
      setError('Erro ao excluir transação.');
      setDeleteModal({ open: false, transacao: null });
    } finally {
      setDeleting(false);
    }
  };

  // Filtro de texto local (sobre os dados da página atual)
  const transacoesFiltradas = transacoes.filter((t) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      (t.descricao || '').toLowerCase().includes(term) ||
      (t.nomeCategoria || '').toLowerCase().includes(term) ||
      (t.nomeConta || '').toLowerCase().includes(term)
    );
  });

  const totalReceitas = transacoesFiltradas
    .filter((t) => t.tipo === 'RECEITA')
    .reduce((acc, t) => acc + (t.valor || 0), 0);

  const totalDespesas = transacoesFiltradas
    .filter((t) => t.tipo === 'DESPESA')
    .reduce((acc, t) => acc + (t.valor || 0), 0);

  const saldoTotal = contas.reduce((acc, c) => acc + (c.saldoAtual || 0), 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <ArrowUpRight size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
            <p className="text-sm text-gray-500">Visualize e exporte suas movimentações</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsExportOpen(!isExportOpen)}
              className="flex items-center gap-2 bg-green-600 border border-green-700 text-white px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors font-medium shadow-sm"
            >
              <FileDown size={18} />
              Exportar
              <ChevronDown size={16} className={`transition-transform ${isExportOpen ? 'rotate-180' : ''}`} />
            </button>
            {isExportOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-xl py-2 z-50">
                <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Formatos disponíveis</div>
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                >
                  <FileSpreadsheet size={18} className="text-green-600" />
                  Relatório em CSV
                </button>
                <button
                  onClick={() => handleExport('pdf')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                >
                  <FileText size={18} className="text-red-500" />
                  Relatório em PDF
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/transacoes/nova')}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <Plus size={18} />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-medium uppercase mb-1 tracking-wider">Receitas (página)</p>
          <h2 className="text-xl font-bold text-green-600">{formatCurrency(totalReceitas)}</h2>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-medium uppercase mb-1 tracking-wider">Despesas (página)</p>
          <h2 className="text-xl font-bold text-red-600">{formatCurrency(totalDespesas)}</h2>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
          <p className="text-gray-500 text-xs font-medium uppercase mb-1 tracking-wider">Saldo Total</p>
          <h2 className={`text-xl font-bold ${saldoTotal >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {formatCurrency(saldoTotal)}
          </h2>
        </div>
      </div>

      {/* Mensagens */}
      {successMsg && (
        <div className="mb-4 bg-green-50 text-green-700 p-3 rounded-lg text-sm flex items-center gap-2">
          <Check size={16} /> {successMsg}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-lg text-sm">{error}</div>
      )}

      {/* Barra de busca + filtros */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por descrição, categoria ou conta..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm outline-none"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
            showFilters || activeFilterCount > 0
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter size={16} />
          Filtros
          {activeFilterCount > 0 && (
            <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Painel de filtros */}
      {showFilters && (
        <div className="mb-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
              <select
                value={filters.tipo}
                onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Todos</option>
                <option value="RECEITA">Receita</option>
                <option value="DESPESA">Despesa</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Todos</option>
                <option value="CONFIRMADA">Confirmada</option>
                <option value="PENDENTE">Pendente</option>
                <option value="CANCELADA">Cancelada</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
              <select
                value={filters.categoriaId}
                onChange={(e) => setFilters({ ...filters, categoriaId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Todas</option>
                {categorias.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Conta</label>
              <select
                value={filters.contaId}
                onChange={(e) => setFilters({ ...filters, contaId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Todas</option>
                {contas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data início</label>
              <input
                type="date"
                value={filters.dataInicio}
                onChange={(e) => setFilters({ ...filters, dataInicio: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Data fim</label>
              <input
                type="date"
                value={filters.dataFim}
                onChange={(e) => setFilters({ ...filters, dataFim: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleApplyFilters}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Aplicar filtros
            </button>
            {activeFilterCount > 0 && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center gap-1"
              >
                <X size={14} /> Limpar filtros
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="animate-spin text-blue-600" size={32} />
        </div>
      ) : transacoesFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
          Nenhuma transação encontrada.
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Data</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Descrição</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Categoria / Conta</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Recorrência</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Valor</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {transacoesFiltradas.map((t) => (
                <tr key={t.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-500">{formatDate(t.data)}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    {t.descricao}
                    {t.status === 'PENDENTE' && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded font-medium">
                        Pendente
                      </span>
                    )}
                    {t.status === 'CANCELADA' && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded font-medium">
                        Cancelada
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-700">{t.nomeCategoria}</span>
                      <span className="text-xs text-gray-400 italic">{t.nomeConta}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {t.recorrencia && t.recorrencia !== 'NENHUMA' ? (
                      <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-700 rounded-full font-medium">
                        {RECORRENCIA_LABELS[t.recorrencia] || t.recorrencia}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </td>
                  <td className={`px-6 py-4 text-right font-bold ${t.tipo === 'RECEITA' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.tipo === 'RECEITA' ? '+' : '−'} {formatCurrency(t.valor)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => navigate(`/transacoes/editar/${t.id}`)}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <Pencil size={18} />
                      </button>
                      <button
                        onClick={() => setDeleteModal({ open: true, transacao: t })}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Exibindo página {currentPage + 1} de {totalPages} ({totalElements} registro{totalElements !== 1 ? 's' : ''})
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              const page = Math.max(0, Math.min(currentPage - 2, totalPages - 5)) + i;
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                    page === currentPage
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {page + 1}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.open}
        title="Excluir Transação"
        message={`Deseja excluir a transação "${deleteModal.transacao?.descricao}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ open: false, transacao: null })}
        loading={deleting}
      />
    </div>
  );
}
