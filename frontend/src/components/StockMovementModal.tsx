import React, { useState } from 'react';
import { Modal } from './Modal';
import { Product, StockMovementType } from '../types';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSubmit: (productId: string, data: { quantityChanged: number; movementType: 'IN' | 'OUT'; reason: string }) => Promise<void>;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  product,
  onSubmit,
}) => {
  const [movementType, setMovementType] = useState<StockMovementType>('IN');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(product.id, {
        quantityChanged: Number(quantity),
        movementType,
        reason,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to record stock movement.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Stock Movement Log: ${product.name}`}>
      {error && (
        <div
          style={{
            padding: '0.65rem 0.9rem',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            borderRadius: 'var(--radius-sm)',
            color: '#fda4af',
            fontSize: '0.85rem',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          background: 'var(--bg-surface)',
          padding: '0.85rem 1rem',
          borderRadius: 'var(--radius-md)',
          marginBottom: '1.25rem',
          border: '1px solid var(--border-color)',
          display: 'flex',
          justify-content: 'space-between',
        }}
      >
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU Code</span>
          <div style={{ fontWeight: 600, color: '#fff' }}>{product.sku}</div>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Warehouse Stock</span>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
            {product.currentStock} units
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Movement Direction *</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <button
              type="button"
              className={`btn ${movementType === 'IN' ? 'btn-success' : 'btn-secondary'}`}
              onClick={() => setMovementType('IN')}
              style={{ justifyContent: 'center' }}
            >
              <ArrowDownLeft size={16} />
              <span>Stock IN (Add)</span>
            </button>

            <button
              type="button"
              className={`btn ${movementType === 'OUT' ? 'btn-danger' : 'btn-secondary'}`}
              onClick={() => setMovementType('OUT')}
              style={{ justifyContent: 'center' }}
            >
              <ArrowUpRight size={16} />
              <span>Stock OUT (Deduct)</span>
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>Quantity Changed *</label>
          <input
            type="number"
            min="1"
            className="form-control"
            value={quantity}
            onChange={(e) => setQuantity(parseInt(e.target.value, 10) || 1)}
            required
          />
        </div>

        <div className="form-group">
          <label>Reason / Source Note *</label>
          <textarea
            className="form-control"
            rows={3}
            placeholder="e.g. Purchase order receipt, Damaged stock disposal, Audit adjustment..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>

        <div className="modal-footer" style={{ padding: '1rem 0 0 0', background: 'transparent' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Recording...' : 'Log Stock Movement'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
