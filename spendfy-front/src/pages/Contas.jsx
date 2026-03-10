import { useState, useEffect } from 'react';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, Pencil, Trash2, Wallet, X, Check, Loader2 } from 'lucide-react';

const TIPOS_CONTA = [
  { value: 'CORRENTE', label: 'Conta Corrente' },
  { value: 'POUPANCA', label: 'Poupança' },
  { value: 'INVESTIMENTO', label: 'Investimento' },
  { value: 'CARTEIRA', label: 'Carteira' },
  { value: 'OUTROS', label: 'Outros' },
];

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

export default function Contas() {
  // ─── Estado ──────────────────────────────────────────────────
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Formulário
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nome: '', tipo: '', saldoInicial: '' });
  const [formError, setFormError] = useState('');

  // Modal de exclusão
  const [deleteModal, setDeleteModal] = useState({ open: false, conta: null });

  // ─── Fetch contas ─────────────────────────────────────────────
  const fetchContas = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/contas');
      setContas(response.data);
    } catch (err) {
      setError('Erro ao carregar contas. Tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContas();
  }, []);

  // ─── Mensagem temporária ──────────────────────────────────────
  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // ─── Form handlers ────────────────────────────────────────────
  const handleNewClick = () => {
    setEditingId(null);
    setFormData({ nome: '', tipo: '', saldoInicial: '' });
    setFormError('');
    setShowForm(true);
  };

  const handleEditClick = (conta) => {
    setEditingId(conta.id);
    setFormData({
      nome: conta.nome,
      tipo: conta.tipo || '',
      saldoInicial: conta.saldoInicial ?? '',
    });
    setFormError('');
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ nome: '', tipo: '', saldoInicial: '' });
    setFormError('');
  };

  // ─── Salvar ───────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.nome.trim()) {
      setFormError('O nome da conta é obrigatório.');
      return;
    }
    if (formData.nome.trim().length < 2) {
      setFormError('O nome deve ter pelo menos 2 caracteres.');
      return;
    }
    if (!formData.tipo) {
      setFormError('Selecione o tipo da conta.');
      return;
    }
    if (formData.saldoInicial === '' || formData.saldoInicial === null) {
      setFormError('O saldo inicial é obrigatório.');
      return;
    }
    if (Number(formData.saldoInicial) < 0) {
      setFormError('O saldo inicial não pode ser negativo.');
      return;
    }

    setSaving(true);
    const payload = {
      nome: formData.nome.trim(),
      tipo: formData.tipo,
      saldoInicial: Number(formData.saldoInicial),
    };

    try {
      if (editingId) {
        await api.put(`/contas/${editingId}`, payload);
        showSuccess('Conta atualizada com sucesso!');
      } else {
        await api.post('/contas', payload);
        showSuccess('Conta criada com sucesso!');
      }
      handleCancelForm();
      fetchContas();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Erro ao salvar conta.';
      setFormError(msg);
    } finally {
      setSaving(false);
    }
  };

  // ─── Exclusão ─────────────────────────────────────────────────
  const handleDeleteClick = (conta) => {
    setDeleteModal({ open: true, conta });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.conta) return;
    setDeleting(true);
    try {
      await api.delete(`/contas/${deleteModal.conta.id}`);
      showSuccess('Conta excluída com sucesso!');
      setDeleteModal({ open: false, conta: null });
      fetchContas();
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Erro ao excluir conta. Ela pode estar vinculada a transações.';
      setError(msg);
      setDeleteModal({ open: false, conta: null });
    } finally {
      setDeleting(false);
    }
  };

  // ─── Saldo total ──────────────────────────────────────────────
  const saldoTotal = contas.reduce((acc, c) => acc + Number(c.saldoInicial || 0), 0);

  // ─── Render ───────────────────────────────────────────────────
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <Wallet size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Contas</h1>
            <p className="text-sm text-gray-500">Gerencie suas contas bancárias e carteiras</p>
          </div>
        </div>
        <button
          onClick={handleNewClick}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={18} />
          Nova Conta
        </button>
      </div>

      {/* Card saldo total */}
      {!loading && contas.length > 0 && (
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5 inline-flex items-center gap-4">
          <div className="p-2.5 bg-blue-100 rounded-full text-blue-600">
            <Wallet size={20} />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Saldo total em contas
            </p>
            <p className="text-xl font-bold text-blue-600">{formatCurrency(saldoTotal)}</p>
          </div>
        </div>
      )}

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
              {editingId ? 'Editar Conta' : 'Nova Conta'}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da conta *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: Nubank, Bradesco, Carteira..."
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  autoFocus
                />
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                >
                  <option value="">Selecione...</option>
                  {TIPOS_CONTA.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Saldo inicial */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saldo inicial (R$) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.saldoInicial}
                  onChange={(e) => setFormData({ ...formData, saldoInicial: e.target.value })}
                  placeholder="0,00"
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
                  'Criar Conta'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── Lista de contas ────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : contas.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-gray-100 rounded-full">
              <Wallet size={32} className="text-gray-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Nenhuma conta cadastrada</h3>
          <p className="text-sm text-gray-500 mb-4">
            Cadastre suas contas para organizar melhor suas transações.
          </p>
          <button
            onClick={handleNewClick}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <Plus size={16} />
            Criar primeira conta
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Nome</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Tipo</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">
                  Saldo Inicial
                </th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {contas.map((conta) => (
                <tr
                  key={conta.id}
                  className="border-b border-gray-50 last:border-none hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-6 py-4 font-medium text-gray-900">{conta.nome}</td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                      {TIPOS_CONTA.find((t) => t.value === conta.tipo)?.label || conta.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold text-gray-800">
                    {formatCurrency(conta.saldoInicial)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEditClick(conta)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(conta)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && contas.length > 0 && (
        <p className="mt-4 text-sm text-gray-500">
          {contas.length} conta{contas.length !== 1 ? 's' : ''} cadastrada
          {contas.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Modal de exclusão */}
      <ConfirmModal
        isOpen={deleteModal.open}
        title="Excluir Conta"
        message={`Tem certeza que deseja excluir a conta "${deleteModal.conta?.nome}"? Transações vinculadas a ela podem ser afetadas. Esta ação não pode ser desfeita.`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ open: false, conta: null })}
        loading={deleting}
      />
    </div>
  );
}
