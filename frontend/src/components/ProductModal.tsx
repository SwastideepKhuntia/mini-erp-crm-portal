import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Product } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<Product>) => Promise<void>;
  product?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  product,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: 0,
    currentStock: 0,
    minStockAlertQuantity: 5,
    locationWarehouse: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        category: product.category || '',
        unitPrice: product.unitPrice || 0,
        currentStock: product.currentStock || 0,
        minStockAlertQuantity: product.minStockAlertQuantity || 0,
        locationWarehouse: product.locationWarehouse || '',
      });
    } else {
      setFormData({
        name: '',
        sku: '',
        category: '',
        unitPrice: 0,
        currentStock: 0,
        minStockAlertQuantity: 5,
        locationWarehouse: '',
      });
    }
    setError('');
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Product' : 'Add New Inventory Item'}
    >
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

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label>Product Name *</label>
            <input
              type="text"
              className="form-control"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>SKU / Product Code *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. ELEC-001"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Electronics, Hardware"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Unit Price ($) *</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              value={formData.unitPrice}
              onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
              required
            />
          </div>

          <div className="form-group">
            <label>Initial Current Stock *</label>
            <input
              type="number"
              className="form-control"
              value={formData.currentStock}
              onChange={(e) => setFormData({ ...formData, currentStock: parseInt(e.target.value, 10) || 0 })}
              required
            />
          </div>

          <div className="form-group">
            <label>Minimum Stock Alert Qty *</label>
            <input
              type="number"
              className="form-control"
              value={formData.minStockAlertQuantity}
              onChange={(e) =>
                setFormData({ ...formData, minStockAlertQuantity: parseInt(e.target.value, 10) || 0 })
              }
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>Warehouse Location *</label>
          <input
            type="text"
            className="form-control"
            placeholder="e.g. Bay-A3, Warehouse-North"
            value={formData.locationWarehouse}
            onChange={(e) => setFormData({ ...formData, locationWarehouse: e.target.value })}
            required
          />
        </div>

        <div className="modal-footer" style={{ padding: '1rem 0 0 0', background: 'transparent' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
