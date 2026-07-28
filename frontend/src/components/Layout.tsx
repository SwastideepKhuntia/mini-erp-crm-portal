import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, Package, FileText, LogOut, Shield } from 'lucide-react';

interface LayoutProps {
  activeTab: 'customers' | 'products' | 'challans';
  setActiveTab: (tab: 'customers' | 'products' | 'challans') => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const { user, logout } = useAuth();

  const getRoleBadgeClass = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'badge-admin';
      case 'SALES': return 'badge-sales';
      case 'WAREHOUSE': return 'badge-warehouse';
      case 'ACCOUNTS': return 'badge-accounts';
      default: return '';
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">E</div>
          <div>
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>ERP Portal</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Operations Suite</span>
          </div>
        </div>

        <nav style={{ flex: 1 }}>
          <div
            className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
            onClick={() => setActiveTab('customers')}
          >
            <Users size={18} />
            <span>Customer CRM</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            <Package size={18} />
            <span>Inventory & Products</span>
          </div>

          <div
            className={`nav-item ${activeTab === 'challans' ? 'active' : ''}`}
            onClick={() => setActiveTab('challans')}
          >
            <FileText size={18} />
            <span>Sales Challans</span>
          </div>
        </nav>

        {/* User Info Footer in Sidebar */}
        <div
          style={{
            paddingTop: '1rem',
            borderTop: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#fff', truncate: true }}>
              {user?.name}
            </div>
            <span className={`badge ${getRoleBadgeClass(user?.role)}`} style={{ marginTop: '0.2rem' }}>
              {user?.role}
            </span>
          </div>
          <button
            onClick={logout}
            className="btn btn-secondary btn-sm"
            title="Logout"
            style={{ padding: '0.4rem' }}
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Shield size={18} color="var(--primary)" />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Active Session Role: <strong style={{ color: '#fff' }}>{user?.role}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{user?.email}</span>
          </div>
        </header>

        <div className="page-body">{children}</div>
      </main>
    </div>
  );
};
