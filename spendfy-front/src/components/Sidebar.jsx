import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  LayoutDashboard, 
  ArrowUpRight, 
  Tags, 
  LogOut, 
  User as UserIcon 
} from 'lucide-react';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/transacoes', name: 'Transações', icon: ArrowUpRight },
    { path: '/categorias', name: 'Categorias', icon: Tags },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-blue-600">SpendFy</h1>
      </div>

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive 
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