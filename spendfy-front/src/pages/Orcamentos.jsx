import { useState, useEffect } from 'react';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, Pencil, Trash2, PiggyBank, X, Check, Loader2, CalendarRange } from 'lucide-react';

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
};

export default function Orcamentos() {
  // ─── Estado ──────────────────────────────────────────────────
  const [orcamentos, setOrcamentos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Formulário
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    valorLimite: '',
    dataInicio: '',
    dataFim: '',
    idCategoria: '',
  });
  const [formError, setFormError] = useState('');

  // Modal de exclusão
  const [deleteModal, setDeleteModal] = useState({ open: false, orcamento: null });

  // ─── Fetch ────────────────────────────────────────────────────
  const fetchOrcamentos = async () => {
    setLoading(true);
    setError('');
    try {
      const [orcRes, catRes] = await Promise.all([
        api.get('/orcamentos'),
        api.get('/categorias'),
      ]);
      setOrcamentos(orcRes.data);
      setCategorias(catRes.data);
    } catch (err) {
      setError('Erro ao carregar orçamentos. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrcamentos();
  }, []);

  // ─── Mensagem temporária ──────────────────────────────────────
  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ─── Form handlers ────────────────────────────────────────────
  const handleNewClick = () => {
    setEditingId(null);
    setFormData({ valorLimite: '', dataInicio: '', dataFim: '', idCategoria: '' });
    setFormError('');
    setShowForm(true);
  };

  const handleEditClick = (orc) => {
    setEditingId(orc.id);
    setFormData({
      valorLimite: orc.valorLimite ?? '',
      dataInicio: orc.dataInicio || '',
      dataFim: orc.dataFim || '',
      idCategoria: orc.idCategoria ?? '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ valorLimite: '', dataInicio: '', dataFim: '', idCategoria: '' });
    setFormError('');
  };

  // ─── Salvar ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.valorLimite || Number(formData.valorLimite) <= 0) {
      setFormError('O valor limite deve ser maior que zero.');
      return;
    }
    if (!formData.dataInicio) {
      setFormError('A data de início é obrigatória.');
      return;
    }
    if (!formData.dataFim) {
      setFormError('A data de fim é obrigatória.');
      return;
    }
    if (formData.dataFim < formData.dataInicio) {
      setFormError('A data de fim deve ser posterior à data de início.');
      return;
    }
    if (!formData.idCategoria) {
      setFormError('Selecione uma categoria.');
      return;
    }

    setSaving(true);
    const payload = {
      valorLimite: Number(formData.valorLimite),
      dataInicio: formData.dataInicio,
      dataFim: formData.dataFim,
      idCategoria: Number(formData.idCategoria),
    };

    try {
      if (editingId) {
        await api.put(`/orcamentos/${editingId}`, payload);
        showSuccess('Orçamento atualizado com sucesso!');
      } else {
        await api.post('/orcamentos', payload);
        showSuccess('Orçamento criado com sucesso!');
      }
      handleCancelForm();
      fetchOrcamentos();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Erro ao salvar orçamento.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ─── Exclusão ─────────────────────────────────────────────────
  const handleDeleteClick = (orc) => {
    setDeleteModal({ open: true, orcamento: orc });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.orcamento) return;
    setDeleting(true);
    try {
      await api.delete(`/orcamentos/${deleteModal.orcamento.id}`);
      showSuccess('Orçamento excluído com sucesso!');
      setDeleteModal({ open: false, orcamento: null });
      fetchOrcamentos();
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao excluir orçamento.';
      setError(msg);
      setDeleteModal({ open: false, orcamento: null });
    } finally {
      setDeleting(false);
    }
  };

  // ─── Status do período ────────────────────────────────────────
  const getPeriodoStatus = (dataInicio, dataFim) => {
    const hoje = new Date().toISOString().split('T')[0];
    if (hoje < dataInicio) return { label: 'Futuro', cls: 'bg-blue-50 text-blue-700' };
    if (hoje > dataFim) return { label: 'Encerrado', cls: 'bg-gray-100 text-gray-600' };
    return { label: 'Ativo', cls: 'bg-green-50 text-green-700' };
  };

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <PiggyBank size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orçamentos</h1>
            <p className="text-sm text-gray-500">
              Defina limites de gastos por categoria e período
            </p>
          </div>
        </div>
        <button
          onClick={handleNewClick}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={18} />
          Novo Orçamento
        </button>
      </div>

      {/* Mensagem de sucesso */}
      {successMsg && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
          <Check size={16} />
          {successMsg}
        </div>
      )}

      {/* Mensagem de erro global */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* ─── Formulário ────────────────────────────────────────── */}
      {showForm && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Editar Orçamento' : 'Novo Orçamento'}
            </h2>
            <button
              onClick={handleCancelForm}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {formError && (
            <div className="mb-4 bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 text-sm">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {/* Categoria */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria *
                </label>
                <select
                  value={formData.idCategoria}
                  onChange={(e) => setFormData({ ...formData, idCategoria: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                  autoFocus
                >
                  <option value="">Selecione uma categoria...</option>
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Valor limite */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor limite (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.valorLimite}
                  onChange={(e) => setFormData({ ...formData, valorLimite: e.target.value })}
                  placeholder="0,00"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              {/* Data de início */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de início *
                </label>
                <input
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) => setFormData({ ...formData, dataInicio: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>

              {/* Data de fim */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de fim *
                </label>
                <input
                  type="date"
                  value={formData.dataFim}
                  onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Salvando...
                  </>
                ) : editingId ? (
                  'Atualizar'
                ) : (
                  'Criar Orçamento'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Lista de orçamentos ────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : orcamentos.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <PiggyBank size={32} className="text-gray-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            Nenhum orçamento cadastrado
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Crie orçamentos para controlar seus gastos por categoria.
          </p>
          <button
            onClick={handleNewClick}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <Plus size={16} />
            Criar primeiro orçamento
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Categoria</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Período</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">
                  Valor Limite
                </th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {orcamentos.map((orc) => {
                const status = getPeriodoStatus(orc.dataInicio, orc.dataFim);
                return (
                  <tr
                    key={orc.id}
                    className="border-b border-gray-50 last:border-none hover:bg-gray-50/50 transition-colors"
                  >
                    {/* Categoria */}
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {orc.nomeCategoria || '—'}
                    </td>

                    {/* Período */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-sm text-gray-600">
                        <CalendarRange size={14} className="text-gray-400" />
                        {formatDate(orc.dataInicio)} — {formatDate(orc.dataFim)}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full ${status.cls}`}
                      >
                        {status.label}
                      </span>
                    </td>

                    {/* Valor limite */}
                    <td className="px-6 py-4 text-right font-semibold text-gray-800">
                      {formatCurrency(orc.valorLimite)}
                    </td>

                    {/* Ações */}
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditClick(orc)}
                          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(orc)}
                          className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {!loading && orcamentos.length > 0 && (
        <p className="mt-4 text-sm text-gray-500">
          {orcamentos.length} orçamento{orcamentos.length !== 1 ? 's' : ''} cadastrado
          {orcamentos.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Modal de exclusão */}
      <ConfirmModal
        isOpen={deleteModal.open}
        title="Excluir Orçamento"
        message={`Tem certeza que deseja excluir o orçamento de "${deleteModal.orcamento?.nomeCategoria || 'esta categoria'}" no valor de ${formatCurrency(deleteModal.orcamento?.valorLimite)}? Esta ação não pode ser desfeita.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ open: false, orcamento: null })}
        loading={deleting}
      />
    </div>
  );
}
