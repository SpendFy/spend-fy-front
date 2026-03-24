import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useEffect, useState, useRef } from 'react';
import api from '../api/axios';
import {
  LayoutDashboard,
  ArrowUpRight,
  Tags,
  Wallet,
  PiggyBank,
  LogOut,
  User as UserIcon,
  TrendingUp,
  Bell,
  X,
} from 'lucide-react';

const TIPO_ALERTA_CONFIG = {
  ORCAMENTO_80_PERCENT: { label: 'Orçamento 80%', color: 'text-orange-600', bg: 'bg-orange-50' },
  ORCAMENTO_ESTOURADO: { label: 'Orçamento excedido', color: 'text-red-600', bg: 'bg-red-50' },
  SALDO_BAIXO: { label: 'Saldo baixo', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  DESPESA_INCOMUM: { label: 'Despesa incomum', color: 'text-purple-600', bg: 'bg-purple-50' },
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const alertDropdownRef = useRef(null);

  const [alertas, setAlertas] = useState([]);
  const [showAlertas, setShowAlertas] = useState(false);
  const [markingRead, setMarkingRead] = useState(new Set());

  const fetchAlertas = async () => {
    try {
      const res = await api.get('/alertas');
      setAlertas(res.data);
    } catch (err) {
      // Falha silenciosa — alertas são opcionais
    }
  };

  useEffect(() => {
    fetchAlertas();
  }, []);

  // Fechar dropdown clicando fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (alertDropdownRef.current && !alertDropdownRef.current.contains(e.target)) {
        setShowAlertas(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarcarLido = async (alertaId) => {
    if (markingRead.has(alertaId)) return;
    setMarkingRead((prev) => new Set([...prev, alertaId]));
    try {
      await api.patch(`/alertas/${alertaId}/lido`);
      setAlertas((prev) => prev.filter((a) => a.id !== alertaId));
    } catch (err) {
      console.warn('Erro ao marcar alerta como lido:', err);
    } finally {
      setMarkingRead((prev) => {
        const next = new Set(prev);
        next.delete(alertaId);
        return next;
      });
    }
  };

  const handleMarcarTodosLidos = async () => {
    const ids = alertas.map((a) => a.id);
    await Promise.allSettled(ids.map((id) => api.patch(`/alertas/${id}/lido`)));
    setAlertas([]);
    setShowAlertas(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/transacoes', name: 'Transações', icon: ArrowUpRight },
    { path: '/categorias', name: 'Categorias', icon: Tags },
    { path: '/contas', name: 'Contas', icon: Wallet },
    { path: '/orcamentos', name: 'Orçamentos', icon: PiggyBank },
    { path: '/insights', name: 'Insights', icon: TrendingUp },
  ];

  const isActive = (path) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const formatAlertTime = (criadoEm) => {
    if (!criadoEm) return '';
    const d = new Date(criadoEm);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-blue-600">SpendFy</h1>

        {/* Botão de alertas */}
        <div className="relative" ref={alertDropdownRef}>
          <button
            onClick={() => setShowAlertas(!showAlertas)}
            className="relative p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Alertas"
          >
            <Bell size={20} />
            {alertas.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                {alertas.length > 9 ? '9+' : alertas.length}
              </span>
            )}
          </button>

          {/* Dropdown de alertas */}
          {showAlertas && (
            <div className="absolute left-0 top-10 w-80 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="font-semibold text-gray-800 text-sm">
                  Alertas {alertas.length > 0 && <span className="text-gray-400">({alertas.length})</span>}
                </span>
                {alertas.length > 0 && (
                  <button
                    onClick={handleMarcarTodosLidos}
                    className="text-xs text-blue-600 hover:underline font-medium"
                  >
                    Marcar todos como lidos
                  </button>
                )}
              </div>

              {alertas.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-400">
                  Nenhum alerta no momento
                </div>
              ) : (
                <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                  {alertas.map((alerta) => {
                    const cfg = TIPO_ALERTA_CONFIG[alerta.tipo] || { label: alerta.tipo, color: 'text-gray-600', bg: 'bg-gray-50' };
                    return (
                      <li key={alerta.id} className={`px-4 py-3 ${cfg.bg} flex items-start gap-2`}>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold uppercase tracking-wider mb-0.5 ${cfg.color}`}>
                            {cfg.label}
                          </p>
                          <p className="text-sm text-gray-700 leading-snug">{alerta.mensagem}</p>
                          <p className="text-xs text-gray-400 mt-1">{formatAlertTime(alerta.criadoEm)}</p>
                        </div>
                        <button
                          onClick={() => handleMarcarLido(alerta.id)}
                          disabled={markingRead.has(alerta.id)}
                          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
                          title="Marcar como lido"
                        >
                          <X size={14} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={20} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="bg-blue-100 p-2 rounded-full text-blue-600">
            <UserIcon size={20} />
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-gray-900 truncate">{user?.nome}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </aside>
  );
}
