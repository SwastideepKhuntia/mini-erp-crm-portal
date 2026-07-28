import React, { useState, useEffect } from 'react';
import { Customer } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CustomerModal } from '../components/CustomerModal';
import { CustomerDetailModal } from '../components/CustomerDetailModal';
import { Search, Plus, Eye, Edit, Filter } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const { canManageCustomers } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.getCustomers({
        search: search || undefined,
        status: statusFilter || undefined,
        customerType: typeFilter || undefined,
      });
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter, typeFilter]);

  const handleCreateOrUpdate = async (data: Partial<Customer>) => {
    if (selectedCustomer) {
      await api.updateCustomer(selectedCustomer.id, data);
    } else {
      await api.createCustomer(data);
    }
    fetchCustomers();
  };

  const handleOpenDetail = async (customer: Customer) => {
    try {
      const res = await api.getCustomerById(customer.id);
      setDetailCustomer(res.data);
      setIsDetailModalOpen(true);
    } catch (err) {
      console.error('Failed to load customer details:', err);
    }
  };

  const handleAddFollowUp = async (note: string, followUpDate?: string) => {
    if (!detailCustomer) return;
    await api.addFollowUpNote(detailCustomer.id, { note, followUpDate });
    const updated = await api.getCustomerById(detailCustomer.id);
    setDetailCustomer(updated.data);
    fetchCustomers();
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem' }}>Customer CRM</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Manage lead relationships, client profiles, and follow-up activities.
          </p>
        </div>

        {canManageCustomers && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedCustomer(null);
              setIsModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span>Add Customer</span>
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
              placeholder="Search by name, business, email, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} color="var(--text-muted)" />
            <select
              className="form-control"
              style={{ width: '150px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="LEAD">Lead</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              className="form-control"
              style={{ width: '160px' }}
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="RETAIL">Retail</option>
              <option value="WHOLESALE">Wholesale</option>
              <option value="DISTRIBUTOR">Distributor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="glass-panel table-container">
        <table>
          <thead>
            <tr>
              <th>Customer / Business</th>
              <th>Contact Info</th>
              <th>Type</th>
              <th>Status</th>
              <th>Follow-up Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading customer records...
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No customer records found matching filter criteria.
                </td>
              </tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{c.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.businessName}</div>
                  </td>
                  <td>
                    <div>{c.mobileNumber}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.email}</div>
                  </td>
                  <td>
                    <span className="badge badge-sales">{c.customerType}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${c.status.toLowerCase()}`}>{c.status}</span>
                  </td>
                  <td>
                    {c.followUpDate ? (
                      <span style={{ color: 'var(--accent-amber)', fontSize: '0.85rem' }}>
                        {new Date(c.followUpDate).toLocaleDateString()}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dark)', fontSize: '0.85rem' }}>None</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleOpenDetail(c)}
                        title="View Profile & Notes"
                      >
                        <Eye size={14} />
                      </button>

                      {canManageCustomers && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setSelectedCustomer(c);
                            setIsModalOpen(true);
                          }}
                          title="Edit Customer"
                        >
                          <Edit size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        customer={selectedCustomer}
      />

      {/* Detail View Modal */}
      <CustomerDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        customer={detailCustomer}
        onAddFollowUp={handleAddFollowUp}
      />
    </div>
  );
};
