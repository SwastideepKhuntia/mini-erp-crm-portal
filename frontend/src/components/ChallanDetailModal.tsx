import React, { useState } from 'react';
import { Modal } from './Modal';
import { SalesChallan } from '../types';
import { useAuth } from '../context/AuthContext';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface ChallanDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  challan: SalesChallan | null;
  onUpdateStatus: (id: string, newStatus: 'DRAFT' | 'CONFIRMED' | 'CANCELLED') => Promise<void>;
}

export const ChallanDetailModal: React.FC<ChallanDetailModalProps> = ({
  isOpen,
  onClose,
  challan,
  onUpdateStatus,
}) => {
  const { canManageChallans } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!challan) return null;

  const handleStatusChange = async (targetStatus: 'DRAFT' | 'CONFIRMED' | 'CANCELLED') => {
    setError('');
    setSubmitting(true);
    try {
      await onUpdateStatus(challan.id, targetStatus);
    } catch (err: any) {
      setError(err.message || 'Status transition failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const grandTotal = challan.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Sales Challan: ${challan.challanNumber}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.4)',
              borderRadius: 'var(--radius-md)',
              color: '#fda4af',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Overview Header Card */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '1rem',
            background: 'var(--bg-surface)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Customer</div>
            <div style={{ fontWeight: 600, color: '#fff' }}>{challan.customer?.name}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{challan.customer?.businessName}</div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Status</div>
            <span className={`badge badge-${challan.status.toLowerCase()}`}>{challan.status}</span>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created Date & By</div>
            <div style={{ fontSize: '0.85rem' }}>{new Date(challan.createdDate).toLocaleDateString()}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {challan.createdBy?.name} ({challan.createdBy?.role})
            </div>
          </div>
        </div>

        {/* Snapshot Product Items Table */}
        <div>
          <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>
            Snapshot Items Captured at Creation
          </h4>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product Name (Snapshot)</th>
                  <th>Unit Price</th>
                  <th>Quantity</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {challan.items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 500, color: '#fff' }}>{item.productName}</div>
                    </td>
                    <td>${item.unitPrice.toFixed(2)}</td>
                    <td style={{ fontWeight: 600 }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--accent-green)' }}>
                      ${(item.unitPrice * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Total Summary */}
        <div
          style={{
            display: 'flex',
            justify: 'space-between',
            alignItems: 'center',
            background: 'rgba(15, 23, 42, 0.8)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Items Quantity: </span>
            <strong style={{ color: '#fff' }}>{challan.totalQuantity} units</strong>
          </div>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Valuation: </span>
            <strong style={{ fontSize: '1.2rem', color: 'var(--accent-green)', marginLeft: '0.4rem' }}>
              ${grandTotal.toFixed(2)}
            </strong>
          </div>
        </div>

        {/* Action Controls for Status Transitions (Sales & Admin) */}
        {canManageChallans && challan.status !== 'CANCELLED' && (
          <div
            style={{
              paddingTop: '1rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justify: 'flex-end',
              gap: '0.75rem',
            }}
          >
            {challan.status === 'DRAFT' && (
              <button
                className="btn btn-success"
                onClick={() => handleStatusChange('CONFIRMED')}
                disabled={submitting}
              >
                <CheckCircle2 size={16} />
                <span>{submitting ? 'Updating...' : 'Confirm Challan (Deduct Stock)'}</span>
              </button>
            )}

            <button
              className="btn btn-danger"
              onClick={() => handleStatusChange('CANCELLED')}
              disabled={submitting}
            >
              <XCircle size={16} />
              <span>{submitting ? 'Updating...' : 'Cancel Challan'}</span>
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};
