import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function TransactionForm() {
  const { id } = useParams(); // se existir, estamos editando
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    tipo: 'DESPESA',
    data: new Date().toISOString().split('T')[0],
    observacao: '',
    status: 'CONFIRMADA',
    idCategoria: '',
    idConta: '',
  });

  const [categorias, setCategorias] = useState([]);
  const [contas, setContas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');

  // Carregar categorias, contas e (se editando) a transação
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const [catRes, contaRes] = await Promise.all([
          api.get('/categorias'),
          api.get('/contas'),
        ]);
        setCategorias(catRes.data);
        setContas(contaRes.data);

        // Se estiver editando, carregar dados da transação
        if (isEditing) {
          const transRes = await api.get(`/transacoes/${id}`);
          const t = transRes.data;
          setFormData({
            descricao: t.descricao || '',
            valor: t.valor || '',
            tipo: t.tipo || 'DESPESA',
            data: t.data || '',
            observacao: t.observacao || '',
            status: t.status || 'CONFIRMADA',
            idCategoria: t.idCategoria || t.categoriaId || '',
            idConta: t.idConta || t.contaId || '',
          });
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Erro ao carregar dados. Tente novamente.');
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, [id, isEditing]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validações
    if (!formData.descricao.trim()) {
      setError('A descrição é obrigatória.');
      return;
    }
    if (!formData.valor || Number(formData.valor) <= 0) {
      setError('O valor deve ser maior que zero.');
      return;
    }
    if (!formData.data) {
      setError('A data é obrigatória.');
      return;
    }
    if (!formData.idConta) {
      setError('Selecione uma conta.');
      return;
    }
    if (!formData.idCategoria) {
      setError('Selecione uma categoria.');
      return;
    }

    setLoading(true);

    const payload = {
      ...formData,
      valor: Number(formData.valor),
      idCategoria: formData.idCategoria ? Number(formData.idCategoria) : null,
      idConta: formData.idConta ? Number(formData.idConta) : null,
    };

    try {
      if (isEditing) {
        await api.put(`/transacoes/${id}`, payload);
      } else {
        await api.post('/transacoes', payload);
      }
      navigate('/transacoes');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        'Erro ao salvar transação.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Voltar */}
      <button
        onClick={() => navigate('/transacoes')}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-6 transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Voltar para transações
      </button>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          {isEditing ? 'Editar Transação' : 'Nova Transação'}
        </h2>

        {error && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo *</label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => handleChange('tipo', 'DESPESA')}
                className={`flex-1 py-2.5 px-4 rounded-lg border-2 font-medium text-sm transition-all ${
                  formData.tipo === 'DESPESA'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                Despesa
              </button>
              <button
                type="button"
                onClick={() => handleChange('tipo', 'RECEITA')}
                className={`flex-1 py-2.5 px-4 rounded-lg border-2 font-medium text-sm transition-all ${
                  formData.tipo === 'RECEITA'
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                Receita
              </button>
            </div>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição *</label>
            <input
              type="text"
              value={formData.descricao}
              onChange={(e) => handleChange('descricao', e.target.value)}
              placeholder="Ex: Supermercado, Salário, Aluguel..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Valor e Data */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.valor}
                onChange={(e) => handleChange('valor', e.target.value)}
                placeholder="0,00"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
              <input
                type="date"
                value={formData.data}
                onChange={(e) => handleChange('data', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Categoria e Conta */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                value={formData.idCategoria}
                onChange={(e) => handleChange('idCategoria', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              >
                <option value="">Selecione...</option>
                {categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nome}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conta</label>
              <select
                value={formData.idConta}
                onChange={(e) => handleChange('idConta', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
              >
                <option value="">Selecione...</option>
                {contas.map((conta) => (
                  <option key={conta.id} value={conta.id}>
                    {conta.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Observação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observação (opcional)
            </label>
            <textarea
              value={formData.observacao}
              onChange={(e) => handleChange('observacao', e.target.value)}
              placeholder="Alguma anotação sobre esta transação..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/transacoes')}
              className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Salvando...
                </>
              ) : isEditing ? (
                'Atualizar Transação'
              ) : (
                'Salvar Transação'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
