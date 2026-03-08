import { useState, useEffect } from 'react';
import api from '../api/axios';

export default function TransactionForm() {
  const [formData, setFormData] = useState({
    descricao: '', valor: '', tipo: 'DESPESA', data: '', categoriaId: '', contaId: ''
  });
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    api.get('/categorias').then(res => setCategorias(res.data));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/transacoes', formData);
      alert('Transação salva com sucesso!');
    } catch (err) {
      alert('Erro ao salvar transação');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-white p-8 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">Nova Transação</h2>
      <input 
        type="text" placeholder="Descrição" 
        className="w-full mb-4 p-2 border rounded"
        onChange={(e) => setFormData({...formData, descricao: e.target.value})}
      />
      <input 
        type="number" placeholder="Valor" 
        className="w-full mb-4 p-2 border rounded"
        onChange={(e) => setFormData({...formData, valor: e.target.value})}
      />
      <select 
        className="w-full mb-4 p-2 border rounded"
        onChange={(e) => setFormData({...formData, categoriaId: e.target.value})}
      >
        <option value="">Selecione a Categoria</option>
        {categorias.map(cat => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}
      </select>
      <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
        Salvar Lançamento
      </button>
    </form>
  );
}