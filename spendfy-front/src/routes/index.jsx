import { Routes, Route, Navigate } from 'react-router-dom';

import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import TransactionForm from '../pages/TransactionForm';
import PrivateRoute from './PrivateRoute';
import Layout from '../components/Layout';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Grupo de Rotas Privadas */}
      <Route element={<PrivateRoute />}>
        <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transacoes/nova" element={<TransactionForm />} />
            <Route path="/categorias" element={<div>Página de Categorias</div>} />
            {/* rotas privadas */}
        </Route>
      </Route>

      {/* Redirecionamento padrão */}
      <Route path="*" element={<Navigate to="/dashboard" />} />

    </Routes>
  );
}