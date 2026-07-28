import React, { useState } from 'react';
import { Modal } from './Modal';
import { Customer } from '../types';
import { MessageSquare, Calendar, User as UserIcon, Send } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  onAddFollowUp: (note: string, followUpDate?: string) => Promise<void>;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  onAddFollowUp,
}) => {
  const { canManageCustomers } = useAuth();
  const [newNote, setNewNote] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!customer) return null;

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setError('');
    setSubmitting(true);
    try {
      await onAddFollowUp(newNote, nextFollowUpDate || undefined);
      setNewNote('');
      setNextFollowUpDate('');
    } catch (err: any) {
      setError(err.message || 'Failed to add note.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Customer Profile: ${customer.name}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Detail Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            background: 'var(--bg-surface)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Business Name</div>
            <div style={{ fontWeight: 600, color: '#fff' }}>{customer.businessName}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contact Info</div>
            <div style={{ fontSize: '0.9rem' }}>{customer.mobileNumber}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{customer.email}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer Type</div>
            <span className="badge badge-sales">{customer.customerType}</span>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</div>
            <span className={`badge badge-${customer.status.toLowerCase()}`}>{customer.status}</span>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GST Number</div>
            <div style={{ fontSize: '0.85rem' }}>{customer.gstNumber || 'N/A'}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Follow-up Date</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--accent-amber)' }}>
              {customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : 'None scheduled'}
            </div>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Address</div>
            <div style={{ fontSize: '0.85rem' }}>{customer.address}</div>
          </div>
        </div>

        {/* Add Follow-Up Note Form (Sales & Admin) */}
        {canManageCustomers && (
          <form
            onSubmit={handleAddNote}
            style={{
              background: 'rgba(99, 102, 241, 0.08)',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <MessageSquare size={16} color="var(--primary)" />
              <span>Add CRM Follow-up Note</span>
            </h4>

            {error && (
              <div style={{ color: '#fda4af', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{error}</div>
            )}

            <div className="form-group" style={{ marginBottom: '0.75rem' }}>
              <textarea
                className="form-control"
                rows={2}
                placeholder="Enter follow-up call notes, customer requirements, or action items..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Calendar size={16} color="var(--text-muted)" />
                <input
                  type="date"
                  className="form-control"
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.825rem' }}
                  value={nextFollowUpDate}
                  onChange={(e) => setNextFollowUpDate(e.target.value)}
                  placeholder="Set Next Follow-up"
                />
              </div>

              <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                <Send size={14} />
                <span>{submitting ? 'Saving...' : 'Add Note'}</span>
              </button>
            </div>
          </form>
        )}

        {/* Follow-ups Timeline */}
        <div>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>
            Follow-up History ({customer.followUps?.length || 0})
          </h4>

          {customer.followUps && customer.followUps.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '240px', overflowY: 'auto' }}>
              {customer.followUps.map((f) => (
                <div
                  key={f.id}
                  style={{
                    background: 'var(--bg-surface)',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ fontSize: '0.875rem', color: '#fff', marginBottom: '0.35rem' }}>{f.note}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <UserIcon size={12} /> {f.createdBy?.name || 'System User'} ({f.createdBy?.role})
                    </span>
                    <span>{new Date(f.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No follow-up notes recorded yet.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
