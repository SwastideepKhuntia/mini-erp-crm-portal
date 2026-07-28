import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ProductModal } from '../components/ProductModal';
import { StockMovementModal } from '../components/StockMovementModal';
import { Search, Plus, Edit, ArrowLeftRight, AlertTriangle, PackageCheck } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const { canManageProducts } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [stockProduct, setStockProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getProducts({
        search: search || undefined,
        category: categoryFilter || undefined,
        lowStockOnly,
      });
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, lowStockOnly]);

  const handleCreateOrUpdate = async (data: Partial<Product>) => {
    if (selectedProduct) {
      await api.updateProduct(selectedProduct.id, data);
    } else {
      await api.createProduct(data);
    }
    fetchProducts();
  };

  const handleStockMovement = async (
    productId: string,
    data: { quantityChanged: number; movementType: 'IN' | 'OUT'; reason: string }
  ) => {
    await api.logStockMovement(productId, data);
    fetchProducts();
  };

  return (
    <div>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem' }}>Product & Inventory Management</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Monitor warehouse stock balances, unit prices, and stock movements.
          </p>
        </div>

        {canManageProducts && (
          <button
            className="btn btn-primary"
            onClick={() => {
              setSelectedProduct(null);
              setIsProductModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span>Add Product</span>
          </button>
        )}
      </div>

      {/* Filter and Controls */}
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
              placeholder="Search by SKU, product name, category, warehouse..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <button
            type="button"
            className={`btn ${lowStockOnly ? 'btn-danger' : 'btn-secondary'}`}
            onClick={() => setLowStockOnly(!lowStockOnly)}
          >
            <AlertTriangle size={16} />
            <span>Low Stock Alert Filter</span>
          </button>
        </div>
      </div>

      {/* Products Table */}
      <div className="glass-panel table-container">
        <table>
          <thead>
            <tr>
              <th>SKU / Product Name</th>
              <th>Category</th>
              <th>Unit Price</th>
              <th>Current Stock</th>
              <th>Warehouse Loc</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>
                  Loading inventory catalog...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No inventory products found matching search parameters.
                </td>
              </tr>
            ) : (
              products.map((p) => {
                const isLowStock = p.currentStock <= p.minStockAlertQuantity;
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{p.name}</div>
                      <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        SKU: {p.sku}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-sales">{p.category}</span>
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--accent-green)' }}>
                      ${p.unitPrice.toFixed(2)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span
                          style={{
                            fontWeight: 700,
                            color: isLowStock ? 'var(--accent-rose)' : 'var(--accent-cyan)',
                          }}
                        >
                          {p.currentStock} units
                        </span>
                        {isLowStock && (
                          <span className="badge badge-inactive" title={`Alert Min Qty: ${p.minStockAlertQuantity}`}>
                            Low Stock
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{p.locationWarehouse}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        {canManageProducts && (
                          <>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setStockProduct(p);
                                setIsStockModalOpen(true);
                              }}
                              title="Log Stock Movement (IN/OUT)"
                            >
                              <ArrowLeftRight size={14} />
                              <span>Stock IN/OUT</span>
                            </button>

                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => {
                                setSelectedProduct(p);
                                setIsProductModalOpen(true);
                              }}
                              title="Edit Product"
                            >
                              <Edit size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Product Add/Edit Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={handleCreateOrUpdate}
        product={selectedProduct}
      />

      {/* Stock IN/OUT Movement Modal */}
      <StockMovementModal
        isOpen={isStockModalOpen}
        onClose={() => setIsStockModalOpen(false)}
        product={stockProduct}
        onSubmit={handleStockMovement}
      />
    </div>
  );
};
