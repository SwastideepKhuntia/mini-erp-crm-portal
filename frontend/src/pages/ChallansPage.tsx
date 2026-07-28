import React, { useState, useEffect } from 'react';
import { SalesChallan } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ChallanModal } from '../components/ChallanModal';
import { ChallanDetailModal } from '../components/ChallanDetailModal';
import { Search, Plus, Eye, Filter } from 'lucide-react';

export const ChallansPage: React.FC = () => {
  const { canManageChallans } = useAuth();
  const [challans, setChallans] = useState<SalesChallan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<SalesChallan | null>(null);

  const fetchChallans = async () => {
    setLoading(true);
    try {
      const res = await api.getSalesChallans({
        search: search || undefined,
        status: statusFilter || undefined,
      });
      setChallans(res.data);
    } catch (err) {
      console.error('Failed to load sales challans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallans();
  }, [search, statusFilter]);

  const handleCreateChallan = async (data: {
    customerId: string;
    items: Array<{ productId: string; quantity: number }>;
    status?: string;
  }) => {
    await api.createSalesChallan(data);
    fetchChallans();
  };

  const handleViewDetail = async (c: SalesChallan) => {
    try {
      const res = await api.getSalesChallanById(c.id);
      setSelectedChallan(res.data);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error('Failed to load challan detail:', err);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: 'DRAFT' | 'CONFIRMED' | 'CANCELLED') => {
    await api.updateChallanStatus(id, newStatus);
    const updated = await api.getSalesChallanById(id);
    setSelectedChallan(updated.data);
    fetchChallans();
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem' }}>Sales Challan Operations</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Generate delivery challans, capture product price snapshots, and track inventory deductions.
          </p>
        </div>

        {canManageChallans && (
          <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={18} />
            <span>Create Sales Challan</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-dark)',
              }}
            />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '2.4rem' }}
              placeholder="Search by Challan Number or Customer Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              className="form-control"
              style={{ width: '170px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Challans Table */}
      <div className="glass-panel table-container">
        <table>
          <thead>
            <tr>
              <th>Challan #</th>
              <th>Customer</th>
              <th>Total Qty</th>
              <th>Status</th>
              <th>Created Date / By</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading sales challans...
                </td>
              </tr>
            ) : challans.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No Sales Challan records found.
                </td>
              </tr>
            ) : (
              challans.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>
                      {c.challanNumber}
                    </div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{c.customer?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {c.customer?.businessName}
                    </div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600 }}>{c.totalQuantity} items</span>
                  </td>
                  <td>
                    <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                  </td>
                  <td>
                    <div>{new Date(c.createdDate).toLocaleDateString()}</div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      by {c.createdBy?.name} ({c.createdBy?.role})
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleViewDetail(c)}
                      title="View Challan Detail & Snapshots"
                    >
                      <Eye size={14} />
                      <span>View Detail</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      <ChallanModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateChallan}
      />

      {/* Detail & Status Action Modal */}
      <ChallanDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        challan={selectedChallan}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};
