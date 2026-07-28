import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Customer, Product } from '../types';
import { api } from '../services/api';
import { Plus, Trash2 } from 'lucide-react';

interface ChallanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { customerId: string; items: Array<{ productId: string; quantity: number }>; status?: string }) => Promise<void>;
}

export const ChallanModal: React.FC<ChallanModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [status, setStatus] = useState<'DRAFT' | 'CONFIRMED'>('DRAFT');

  const [items, setItems] = useState<Array<{ productId: string; quantity: number }>>([
    { productId: '', quantity: 1 },
  ]);

  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const loadOptions = async () => {
        setLoadingOptions(true);
        try {
          const [cRes, pRes] = await Promise.all([api.getCustomers(), api.getProducts()]);
          setCustomers(cRes.data);
          setProducts(pRes.data);
          if (cRes.data.length > 0) setSelectedCustomer(cRes.data[0].id);
          if (pRes.data.length > 0) setItems([{ productId: pRes.data[0].id, quantity: 1 }]);
        } catch (err) {
          console.error('Failed to load customers or products options:', err);
        } finally {
          setLoadingOptions(false);
        }
      };
      loadOptions();
      setError('');
    }
  }, [isOpen]);

  const handleAddItem = () => {
    if (products.length > 0) {
      setItems([...items, { productId: products[0].id, quantity: 1 }]);
    }
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    const updated = [...items];
    if (field === 'productId') {
      updated[index].productId = value as string;
    } else {
      updated[index].quantity = Math.max(1, Number(value));
    }
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomer) {
      setError('Please select a customer.');
      return;
    }

    if (items.some((i) => !i.productId || i.quantity <= 0)) {
      setError('All item rows must have a selected product and quantity >= 1.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({ customerId: selectedCustomer, items, status });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create Sales Challan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Sales Challan">
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

      {loadingOptions ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading dropdown data...</div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group">
              <label>Select Customer *</label>
              <select
                className="form-control"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                required
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.businessName})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Initial Status *</label>
              <select
                className="form-control"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'DRAFT' | 'CONFIRMED')}
              >
                <option value="DRAFT">Draft (Save without reducing stock)</option>
                <option value="CONFIRMED">Confirmed (Auto-deduct stock now)</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Challan Line Items
              </label>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleAddItem}
              >
                <Plus size={14} /> Add Product
              </button>
            </div>

            {items.map((item, index) => {
              const prodObj = products.find((p) => p.id === item.productId);
              return (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                    background: 'var(--bg-surface)',
                    padding: '0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-color)',
                  }}
                >
                  <div style={{ flex: 2 }}>
                    <select
                      className="form-control"
                      value={item.productId}
                      onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.currentStock} | Price: ${p.unitPrice})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ width: '100px' }}>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                    />
                  </div>

                  <div style={{ width: '90px', fontSize: '0.825rem', color: 'var(--accent-green)' }}>
                    ${prodObj ? (prodObj.unitPrice * item.quantity).toFixed(2) : '0.00'}
                  </div>

                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    style={{ padding: '0.4rem' }}
                    onClick={() => handleRemoveItem(index)}
                    disabled={items.length === 1}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="modal-footer" style={{ padding: '1rem 0 0 0', background: 'transparent' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Generating...' : 'Create Sales Challan'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
