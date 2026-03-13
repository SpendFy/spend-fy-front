import { useState, useEffect } from 'react';
import api from '../api/axios';
import ConfirmModal from '../components/ConfirmModal';
import { Plus, Pencil, Trash2, Wallet, X, Check, Loader2, Landmark, PiggyBank, CreditCard, DollarSign } from 'lucide-react';

const TIPOS_CONTA = [
  { value: 'CORRENTE', label: 'Conta Corrente' },
  { value: 'POUPANCA', label: 'Poupança' },
  { value: 'INVESTIMENTO', label: 'Investimento' },
  { value: 'CARTEIRA', label: 'Carteira' },
  { value: 'OUTROS', label: 'Outros' },
];

export default function Contas() {
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ nome: '', tipo: '', saldoInicial: '' });
  const [formError, setFormError] = useState('');
  const [deleteModal, setDeleteModal] = useState({ open: false, conta: null });

  const fetchContas = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/contas');
      setContas(response.data);
    } catch (err) {
      setError('Erro ao carregar contas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContas();
  }, []);

  const showSuccess = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

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
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nome.trim() || !formData.tipo || formData.saldoInicial === '') {
      setFormError('Preencha todos os campos obrigatórios.');
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
      setFormError(err.response?.data?.message || 'Erro ao salvar conta.');
    } finally {
      setSaving(false);
    }
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
      setError('Erro ao excluir conta. Verifique se há transações vinculadas.');
      setDeleteModal({ open: false, conta: null });
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const getAccountIcon = (tipo) => {
    switch (tipo?.toUpperCase()) {
      case 'CORRENTE': return <Landmark size={20} />;
      case 'POUPANCA': return <PiggyBank size={20} />;
      case 'CARTEIRA': return <Wallet size={20} />;
      default: return <CreditCard size={20} />;
    }
  };

  const saldoTotalContas = contas.reduce((acc, c) => acc + (c.saldoAtual || 0), 0);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
            <Wallet size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Minhas Contas</h1>
            <p className="text-sm text-gray-500">Gerencie seus bancos e carteiras</p>
          </div>
        </div>
        {!showForm && (
          <button
            onClick={handleNewClick}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
          >
            <Plus size={18} /> Nova Conta
          </button>
        )}
      </div>

      {!loading && (
        <div className="mb-8 max-w-sm">
          <div className="bg-blue-600 p-6 rounded-2xl shadow-lg text-white">
            <div className="flex items-center gap-2 mb-2 opacity-80">
              <DollarSign size={18} />
              <span className="text-sm font-medium uppercase tracking-wider">Saldo total em contas</span>
            </div>
            <h2 className="text-3xl font-bold">{formatCurrency(saldoTotalContas)}</h2>
          </div>
        </div>
      )}

      {showForm && (
        <div className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">{editingId ? 'Editar Conta' : 'Nova Conta'}</h2>
            <button onClick={handleCancelForm} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
          </div>
          {formError && <div className="mb-4 bg-red-50 p-3 text-red-700 rounded-lg text-sm">{formError}</div>}
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Nome (Ex: Nubank)"
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
            />
            <select
              className="px-4 py-2 border rounded-lg bg-white"
              value={formData.tipo}
              onChange={(e) => setFormData({...formData, tipo: e.target.value})}
            >
              <option value="">Tipo de Conta...</option>
              {TIPOS_CONTA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="Saldo Inicial (R$)"
              className="px-4 py-2 border rounded-lg"
              value={formData.saldoInicial}
              onChange={(e) => setFormData({...formData, saldoInicial: e.target.value})}
            />
            <div className="md:col-span-3 flex gap-2 justify-end">
              <button type="button" onClick={handleCancelForm} className="px-4 py-2 text-gray-500">Cancelar</button>
              <button type="submit" disabled={saving} className="bg-blue-600 text-white px-6 py-2 rounded-lg flex items-center gap-2">
                {saving ? <Loader2 size={18} className="animate-spin" /> : editingId ? 'Atualizar' : 'Criar Conta'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-blue-600" /></div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-center w-20">Ícone</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Nome / Tipo</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Saldo Inicial</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Saldo Atual</th>
                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {contas.map((conta) => (
                <tr key={conta.id} className="border-b border-gray-50 last:border-none hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="mx-auto w-10 h-10 flex items-center justify-center bg-gray-50 rounded-lg text-gray-500">
                      {getAccountIcon(conta.tipo)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-gray-900">{conta.nome}</p>
                    <p className="text-xs text-gray-400 uppercase tracking-wider">{conta.tipo}</p>
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-500">{formatCurrency(conta.saldoInicial)}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-bold text-lg ${conta.saldoAtual >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                      {formatCurrency(conta.saldoAtual)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEditClick(conta)} className="p-2 text-gray-400 hover:text-blue-600"><Pencil size={18} /></button>
                      <button onClick={() => setDeleteModal({ open: true, conta })} className="p-2 text-gray-400 hover:text-red-600"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteModal.open}
        title="Excluir Conta"
        message={`Deseja excluir "${deleteModal.conta?.nome}"?`}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteModal({ open: false, conta: null })}
        loading={deleting}
      />
    </div>
  );
}