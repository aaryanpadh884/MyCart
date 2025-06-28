import React, { useState, useEffect, useMemo, useRef } from 'react';
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import shoppingCart from './assets/shopping-cart.png';
import refreshIcon from './assets/refresh-icon.png';
import folderIcon from './assets/folder-icon.png';
import editIcon from './assets/edit-icon.png';
import notificationIcon from './assets/notification-icon.png';

interface Folder {
  _id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

interface Product {
  _id: string;
  url: string;
  name?: string;
  price?: number;
  lastChecked?: string;
  createdAt?: string;
  image?: string;
  folderId?: Folder | null;
  inStock?: boolean | null;
  stockStatus?: string;
  lastStockChecked?: string;
}

interface ManualProduct {
  _id: string;
  name: string;
  url: string;
  price: number;
  createdAt?: string;
  image?: string;
  folderId?: Folder | null;
  inStock?: boolean | null;
  stockStatus?: string;
  lastStockChecked?: string;
}

interface Notification {
  _id: string;
  productId: string;
  productType: 'tracked' | 'manual';
  userId?: string;
  notifyOnPriceChange: boolean;
  notifyOnStockChange: boolean;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const useClickOutside = (callback: () => void) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        callback();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [callback]);

  return ref;
};

function App() {
  const [url, setUrl] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [manualProducts, setManualProducts] = useState<ManualProduct[]>([]);
  const [manualName, setManualName] = useState('');
  const [manualUrl, setManualUrl] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualImage, setManualImage] = useState('');
  const [manualInStock, setManualInStock] = useState<boolean | null>(null);
  const [manualStockStatus, setManualStockStatus] = useState('');
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [folderDescription, setFolderDescription] = useState('');
  const [folderColor, setFolderColor] = useState('#007bff');
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [folderMenu, setFolderMenu] = useState<{
    productId: string;
    productType: 'tracked' | 'manual';
    anchorEl: HTMLElement | null;
  } | null>(null);
  const [filterFolderId, setFilterFolderId] = useState<string | null>(null);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [addItemMode, setAddItemMode] = useState<'tracked' | 'manual'>('tracked');
  const [trackedName, setTrackedName] = useState('');
  const folderMenuRef = useClickOutside(() => setFolderMenu(null));
  const [editState, setEditState] = useState<{ [productId: string]: { editing: boolean, price: string, stockStatus: string, inStock: string } }>({});
  const [hoveredProductId, setHoveredProductId] = useState<string | null>(null);
  const [editMenuProductId, setEditMenuProductId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>('');
  const [editingStock, setEditingStock] = useState<string>('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<'price' | 'stock' | 'name' | null>(null);
  const editMenuRef = useRef<HTMLDivElement | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchProducts = async () => {
    const res = await fetch(`${API_BASE}/products`);
    const data = await res.json();
    setProducts(data);
  };

  const fetchManualProducts = async () => {
    const res = await fetch(`${API_BASE}/manual-products`);
    const data = await res.json();
    setManualProducts(data);
  };

  const fetchFolders = async () => {
    const res = await fetch(`${API_BASE}/folders`);
    const data = await res.json();
    setFolders(data);
  };

  const fetchNotifications = async () => {
    const res = await fetch(`${API_BASE}/notifications`);
    const data = await res.json();
    setNotifications(data);
  };

  useEffect(() => {
    fetchProducts();
    fetchManualProducts();
    fetchFolders();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (editMenuProductId !== null) {
      const handleClickOutside = (event: MouseEvent) => {
        if (editMenuRef.current && !editMenuRef.current.contains(event.target as Node)) {
          setEditMenuProductId(null);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [editMenuProductId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, name: trackedName, folderId: selectedFolder || null })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage(`Added: ${data.name || url}`);
        setUrl('');
        setTrackedName('');
        setSelectedFolder('');
        fetchProducts();
      } else {
        setMessage(data.error || 'Failed to add product');
      }
    } catch (err) {
      setMessage('Network error');
    }
    setLoading(false);
  };

  const handleCheckPrice = async (productUrl: string) => {
    setMessage('');
    setLoading(true);
    try {
      // Check price (which also returns stock information)
      const res = await fetch(`${API_BASE}/check-price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Price and stock updated!');
        fetchProducts();
      } else {
        setMessage(data.error || 'Failed to check price and stock');
      }
    } catch (err) {
      setMessage('Network error');
    }
    setLoading(false);
  };

  const handleRemove = async (id: string) => {
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setMessage('Product removed!');
        setProducts(products.filter(p => p._id !== id));
      } else {
        setMessage(data.error || 'Failed to remove product');
      }
    } catch (err) {
      setMessage('Network error');
    }
    setLoading(false);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualUrl || !manualPrice) return;
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${API_BASE}/manual-products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: manualName, 
          url: manualUrl, 
          price: parseFloat(manualPrice), 
          image: manualImage,
          folderId: selectedFolder || null,
          inStock: manualInStock,
          stockStatus: manualStockStatus || null,
          lastStockChecked: manualInStock !== null ? new Date().toISOString() : null
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Manual product added!');
        setManualName('');
        setManualUrl('');
        setManualPrice('');
        setManualImage('');
        setManualInStock(null);
        setManualStockStatus('');
        setSelectedFolder('');
        fetchManualProducts();
      } else {
        setMessage(data.error || 'Failed to add manual product');
      }
    } catch (err) {
      setMessage('Network error');
    }
    setLoading(false);
  };

  const handleRemoveManual = async (id: string) => {
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/manual-products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setMessage('Manual product removed!');
        setManualProducts(manualProducts.filter(p => p._id !== id));
      } else {
        setMessage(data.error || 'Failed to remove manual product');
      }
    } catch (err) {
      setMessage('Network error');
    }
    setLoading(false);
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderName, description: folderDescription, color: folderColor })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Folder created successfully!');
        setFolderName('');
        setFolderDescription('');
        setFolderColor('#007bff');
        setShowFolderModal(false);
        fetchFolders();
      } else {
        setMessage(data.error || 'Failed to create folder');
      }
    } catch (err) {
      setMessage('Network error');
    }
    setLoading(false);
  };

  const handleUpdateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFolder || !folderName.trim()) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/folders/${editingFolder._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderName, description: folderDescription, color: folderColor })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Folder updated successfully!');
        setFolderName('');
        setFolderDescription('');
        setFolderColor('#007bff');
        setEditingFolder(null);
        setShowFolderModal(false);
        fetchFolders();
      } else {
        setMessage(data.error || 'Failed to update folder');
      }
    } catch (err) {
      setMessage('Network error');
    }
    setLoading(false);
  };

  const handleDeleteFolder = async (folderId: string) => {
    if (!confirm('Are you sure you want to delete this folder? Products in this folder will be moved to "No Folder".')) {
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/folders/${folderId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        setMessage('Folder deleted successfully!');
        fetchFolders();
        fetchProducts();
        fetchManualProducts();
      } else {
        setMessage(data.error || 'Failed to delete folder');
      }
    } catch (err) {
      setMessage('Network error');
    }
    setLoading(false);
  };

  const handleMoveToFolder = async (productId: string, folderId: string | null, isManual: boolean = false) => {
    console.log(`Attempting to move product ${productId} to folder ${folderId}`);
    const url = isManual ? `${API_BASE}/manual-products/${productId}/move` : `${API_BASE}/products/${productId}/move`;
    
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId })
      });

      if (res.ok) {
        setMessage('Product moved successfully!');
        fetchProducts();
        fetchManualProducts();
        setFolderMenu(null);
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to move product');
      }
    } catch (err) {
      setMessage('Network error');
    }
  };

  const openEditFolder = (folder: Folder) => {
    setEditingFolder(folder);
    setFolderName(folder.name);
    setFolderDescription(folder.description);
    setFolderColor(folder.color);
    setShowFolderModal(true);
  };

  const openCreateFolder = () => {
    setEditingFolder(null);
    setFolderName('');
    setFolderDescription('');
    setFolderColor('#007bff');
    setShowFolderModal(true);
  };

  const handleOpenFolderMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    productId: string,
    productType: 'tracked' | 'manual'
  ) => {
    e.stopPropagation();
    setFolderMenu({
      productId,
      productType,
      anchorEl: e.currentTarget,
    });
  };

  const allItems = useMemo(() => {
    const combined = [
      ...products.map(p => ({ ...p, productType: 'tracked' as const })),
      ...manualProducts.map(p => ({ ...p, productType: 'manual' as const }))
    ];
    return combined.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  }, [products, manualProducts]);

  const filteredItems = useMemo(() => {
    if (filterFolderId) {
      return allItems.filter(p => p.folderId?._id === filterFolderId);
    }
    return allItems;
  }, [allItems, filterFolderId]);

  const openAddItemModal = () => {
    setShowAddItemModal(true);
    setAddItemMode('tracked');
    setMessage('');
  };

  const handleCheckStock = async (productUrl: string) => {
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/check-stock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Stock status updated!');
        fetchProducts();
      } else {
        setMessage(data.error || 'Failed to check stock status');
      }
    } catch (err) {
      setMessage('Network error');
    }
    setLoading(false);
  };

  const handleCheckStockManual = async (productUrl: string) => {
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/check-stock-manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: productUrl })
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Stock status updated!');
        fetchManualProducts();
      } else {
        setMessage(data.error || 'Failed to check stock status');
      }
    } catch (err) {
      setMessage('Network error');
    }
    setLoading(false);
  };

  const getStockStatusColor = (inStock: boolean | null, stockStatus?: string) => {
    if (inStock === true) return '#28a745'; // Green for in stock
    if (inStock === false) return '#dc3545'; // Red for out of stock
    if (stockStatus?.toLowerCase().includes('limited')) return '#ffc107'; // Yellow for limited
    return '#6c757d'; // Gray for unknown
  };

  const getStockStatusText = (inStock: boolean | null, stockStatus?: string) => {
    if (stockStatus) return stockStatus;
    if (inStock === true) return 'In Stock';
    if (inStock === false) return 'Out of Stock';
    return 'Unknown';
  };

  const startEdit = (product: Product) => {
    setEditState({
      ...editState,
      [product._id]: {
        editing: true,
        price: product.price?.toString() ?? '',
        stockStatus: product.stockStatus ?? '',
        inStock: product.inStock === true ? 'true' : product.inStock === false ? 'false' : ''
      }
    });
  };

  const cancelEdit = (productId: string) => {
    setEditState({ ...editState, [productId]: { ...editState[productId], editing: false } });
  };

  const saveEdit = async (product: Product) => {
    const { price, inStock } = editState[product._id];
    const statusString = inStock === 'true' ? 'In Stock' : 'Out of Stock';
    await fetch(`${API_BASE}/products/${product._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        price: parseFloat(price),
        inStock: inStock === 'true' ? true : false,
        stockStatus: statusString
      })
    });
    setEditState({ ...editState, [product._id]: { ...editState[product._id], editing: false } });
    fetchProducts();
  };

  const handleRefreshAll = async () => {
    setLoading(true);
    setMessage('Refreshing all tracked products...');
    try {
      await Promise.all(products.map(async (product) => {
        await fetch(`${API_BASE}/check-price`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: product.url })
        });
      }));
      setMessage('All tracked products refreshed!');
      fetchProducts();
    } catch (err) {
      setMessage('Failed to refresh all products');
    }
    setLoading(false);
  };

  const handleToggleNotification = async (productId: string, productType: 'tracked' | 'manual') => {
    const existingNotification = notifications.find(n => n.productId === productId && n.productType === productType);
    
    if (existingNotification) {
      // Remove notification
      try {
        await fetch(`${API_BASE}/notifications/${productId}/${productType}`, {
          method: 'DELETE'
        });
        setMessage('Notifications disabled for this product');
        fetchNotifications();
      } catch (err) {
        setMessage('Failed to disable notifications');
      }
    } else {
      // Add notification
      try {
        await fetch(`${API_BASE}/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId,
            productType,
            notifyOnPriceChange: true,
            notifyOnStockChange: true
          })
        });
        setMessage('Notifications enabled for this product');
        fetchNotifications();
      } catch (err) {
        setMessage('Failed to enable notifications');
      }
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img src={shoppingCart} alt="Item Tracker logo" style={{ width: 50, height: 50, marginRight: 16 }} />
            <h1>MyCart</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={handleRefreshAll} className="refresh-all-button" disabled={loading} title="Refresh all tracked products">
              <img src={refreshIcon} alt="Refresh" style={{ width: 22, height: 22, marginRight: 6, verticalAlign: 'middle' }} /> Refresh
            </button>
            <button onClick={openAddItemModal} className="add-item-button">
              + Add Item
            </button>
          </div>
        </div>
        <p>Track prices and stocks of products from any online store.</p>
      </header>

      <div className="folder-container">
        <div className="folder-header">
          <h2 className="filters-title">Folders</h2>
          <button onClick={openCreateFolder} className="create-folder-button-new">+</button>
        </div>
        <div className="folder-filters">
          <button
            onClick={() => setFilterFolderId(null)}
            className={`folder-filter-button ${filterFolderId === null ? 'active' : ''}`}
          >
            All
          </button>
          {folders.map(folder => (
            <button
              key={folder._id}
              onClick={() => setFilterFolderId(folder._id)}
              className={`folder-filter-button ${filterFolderId === folder._id ? 'active' : ''}`}
              style={{ backgroundColor: folder.color }}
            >
              <span>{folder.name}</span>
              <div className="folder-button-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditFolder(folder);
                  }}
                  className="folder-action-button"
                >
                  ✏️
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`Are you sure you want to delete the folder "${folder.name}"? This will not delete the products in it.`)) {
                      handleDeleteFolder(folder._id);
                    }
                  }}
                  className="folder-action-button"
                >
                  🗑️
                </button>
              </div>
            </button>
          ))}
        </div>
      </div>
      <>
        <h2 style={{ textAlign: 'center', marginTop: 32, marginBottom: 32 }}>
          {filterFolderId
            ? (folders.find(f => f._id === filterFolderId)?.name || 'Products')
            : 'All'}
        </h2>
        <div
          style={{
            width: '100%',
            maxWidth: '1800px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: 32,
            justifyItems: 'center',
          }}
        >
          {filteredItems.length === 0 && (
            <div style={{ gridColumn: '1 / -1' }}>
              No products yet. Click "+ Add Item" to get started.
            </div>
          )}
          {filteredItems.map(product => (
            <div
              key={product._id}
              onMouseEnter={() => setHoveredProductId(product._id)}
              onMouseLeave={() => setHoveredProductId(null)}
              style={{
                border: `3px solid ${product.inStock === true ? '#28a745' : product.inStock === false ? '#dc3545' : '#ddd'}`,
                borderRadius: 16,
                padding: 24,
                minHeight: 260,
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: product.image
                  ? `linear-gradient(rgba(20,20,20,${hoveredProductId === product._id ? '0.7' : '0.2'}), rgba(20,20,20,${hoveredProductId === product._id ? '0.7' : '0.2'})), url('${product.image}') center/cover no-repeat`
                  : '#222',
                color: '#fff',
                boxSizing: 'border-box',
                position: 'relative',
                transition: 'box-shadow 0.2s',
                boxShadow: hoveredProductId === product._id ? '0 0 16px 2px rgba(0,0,0,0.25)' : undefined,
              }}
            >
              {product.folderId && (
                <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', alignItems: 'center', gap: 0, zIndex: 2 }}>
                  <button
                    onClick={e => handleOpenFolderMenu(e, product._id, product.productType)}
                    style={{
                      background: 'none',
                      color: 'white',
                      border: 'none',
                      padding: '0 2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                    disabled={loading}
                    title="Move to folder"
                  >
                    <div
                      style={{
                        padding: '4px 8px',
                        backgroundColor: product.folderId.color,
                        color: 'white',
                        borderRadius: 12,
                        fontSize: 12,
                        fontWeight: 'bold',
                      }}
                    >
                      {product.folderId.name}
                    </div>
                  </button>
                </div>
              )}
              {(hoveredProductId === product._id) && (
                <>
                  {/* Notification Icon - Top Left */}
                  <div style={{ position: 'absolute', top: 8, left: product.folderId ? 80 : 8, display: 'flex', alignItems: 'center', zIndex: 2 }}>
                    <button
                      onClick={() => handleToggleNotification(product._id, product.productType)}
                      style={{ 
                        background: 'none', 
                        border: 'none', 
                        padding: 4, 
                        cursor: 'pointer', 
                        display: 'flex', 
                        alignItems: 'center',
                        borderRadius: '50%',
                        transition: 'background-color 0.2s'
                      }}
                      title={notifications.find(n => n.productId === product._id && n.productType === product.productType) 
                        ? 'Disable notifications' 
                        : 'Enable notifications for price/stock changes'
                      }
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <img 
                        src={notificationIcon} 
                        alt="Notification" 
                        style={{ 
                          width: 24, 
                          height: 24,
                          filter: notifications.find(n => n.productId === product._id && n.productType === product.productType)
                            ? 'brightness(1.2) drop-shadow(0 0 4px rgba(255, 255, 255, 0.5))'
                            : 'brightness(0.7)'
                        }} 
                      />
                    </button>
                  </div>
                  {/* Edit Icon - Top Right */}
                  <div style={{ position: 'absolute', top: 4, right: 4, display: 'flex', alignItems: 'center', zIndex: 2 }}>
                    <button
                      onClick={() => setEditMenuProductId(product._id)}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                      title="Edit"
                    >
                      <img src={editIcon} alt="Edit" style={{ width: 28, height: 28 }} />
                    </button>
                  </div>
                </>
              )}
              {editMenuProductId === product._id && (
                <div ref={editMenuRef} className="edit-menu-popup">
                  <button
                    onClick={e => { handleOpenFolderMenu(e, product._id, product.productType); }}
                  >
                    Assign to Folder
                  </button>
                  <button
                    onClick={() => { setEditMenuProductId(null); handleCheckPrice(product.url); }}
                  >
                    Refresh Product
                  </button>
                  <button
                    onClick={() => { 
                      setEditMenuProductId(null); 
                      setEditingPrice(product.price?.toString() || '');
                      setEditingStock(product.inStock === true ? 'true' : product.inStock === false ? 'false' : '');
                      setEditingProductId(product._id);
                      setEditingField('price');
                    }}
                  >
                    Edit Price
                  </button>
                  <button
                    onClick={() => { 
                      setEditMenuProductId(null); 
                      setEditingStock(product.inStock === true ? 'true' : product.inStock === false ? 'false' : '');
                      setEditingProductId(product._id);
                      setEditingField('stock');
                    }}
                  >
                    Edit Stock
                  </button>
                  <button
                    onClick={() => {
                      setEditMenuProductId(null);
                      setEditingName(product.name || '');
                      setEditingProductId(product._id);
                      setEditingField('name');
                    }}
                  >
                    Edit Name
                  </button>
                  <button
                    onClick={() => { setEditMenuProductId(null); product.productType === 'tracked' ? handleRemove(product._id) : handleRemoveManual(product._id); }}
                  >
                    Remove Product
                  </button>
                  <button className="cancel" onClick={() => setEditMenuProductId(null)}>
                    Cancel
                  </button>
                </div>
              )}
              
              {/* Product Content Display */}
              {hoveredProductId === product._id && (
                <>
                  {/* Product Name (bottom left) */}
                  <div style={{
                    position: 'absolute',
                    bottom: 24,
                    left: 16,
                    zIndex: 1,
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    lineHeight: 1.2,
                    cursor: 'pointer',
                    textAlign: 'left',
                    color: '#fff',
                  }}
                  onClick={() => window.open(product.url, '_blank')}
                  title="Click to visit product page"
                  >
                    {product.name || 'Unnamed Product'}
                  </div>
                  {/* Price (bottom right, aligned with edit icon) */}
                  {product.price && (
                    <div style={{
                      position: 'absolute',
                      bottom: 24,
                      right: 16,
                      fontSize: '1.1rem',
                      fontWeight: 'bold',
                      color: '#fff',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      lineHeight: 1.2,
                      zIndex: 1
                    }}>
                      ${product.price.toFixed(2)}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      </>

      {showAddItemModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Add New Item</h2>
              <button onClick={() => setShowAddItemModal(false)} className="close-button">&times;</button>
            </div>
            <div className="modal-body">
              <div className="tabs">
                <button onClick={() => setAddItemMode('tracked')} className={addItemMode === 'tracked' ? 'active' : ''}>Track with URL</button>
                <button onClick={() => setAddItemMode('manual')} className={addItemMode === 'manual' ? 'active' : ''}>Add Manually</button>
              </div>

              {addItemMode === 'tracked' ? (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={trackedName}
                      onChange={e => setTrackedName(e.target.value)}
                      required
                      style={{ padding: 8 }}
                    />
                    {trackedName && (
                      <button
                        type="button"
                        onClick={() => setTrackedName('')}
                        style={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          fontSize: 16,
                          cursor: 'pointer',
                          color: '#888'
                        }}
                        aria-label="Clear"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="url"
                      placeholder="Enter product URL"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      style={{ flex: 1, padding: 8 }}
                      required
                    />
                    {url && (
                      <button
                        type="button"
                        onClick={() => setUrl('')}
                        style={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          fontSize: 16,
                          cursor: 'pointer',
                          color: '#888'
                        }}
                        aria-label="Clear"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <select
                    value={selectedFolder}
                    onChange={e => setSelectedFolder(e.target.value)}
                    style={{ padding: 8, minWidth: 150 }}
                  >
                    <option value="">Folder</option>
                    {folders.map(folder => (
                      <option key={folder._id} value={folder._id}>{folder.name}</option>
                    ))}
                  </select>
                  <button type="submit" disabled={loading} style={{ padding: '8px 16px' }}>
                    {loading ? 'Adding...' : 'Add'}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 24 }}>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Product Name"
                      value={manualName}
                      onChange={e => setManualName(e.target.value)}
                      required
                      style={{ padding: 8 }}
                    />
                    {manualName && (
                      <button
                        type="button"
                        onClick={() => setManualName('')}
                        style={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          fontSize: 16,
                          cursor: 'pointer',
                          color: '#888'
                        }}
                        aria-label="Clear"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="url"
                      placeholder="Product Link"
                      value={manualUrl}
                      onChange={e => setManualUrl(e.target.value)}
                      required
                      style={{ padding: 8 }}
                    />
                    {manualUrl && (
                      <button
                        type="button"
                        onClick={() => setManualUrl('')}
                        style={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          fontSize: 16,
                          cursor: 'pointer',
                          color: '#888'
                        }}
                        aria-label="Clear"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  <input
                    type="number"
                    placeholder="Product Price"
                    value={manualPrice}
                    onChange={e => setManualPrice(e.target.value)}
                    required
                    style={{ padding: 8 }}
                    min="0"
                    step="0.01"
                  />
                  <input
                    type="url"
                    placeholder="Image URL (optional)"
                    value={manualImage}
                    onChange={e => setManualImage(e.target.value)}
                    style={{ padding: 8 }}
                  />
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label style={{ fontSize: 14, color: '#ccc' }}>Stock Status:</label>
                    <select
                      value={manualInStock === null ? '' : manualInStock ? 'true' : 'false'}
                      onChange={e => setManualInStock(e.target.value === '' ? null : e.target.value === 'true')}
                      style={{ padding: 8, flex: 1 }}
                    >
                      <option value="">Unknown</option>
                      <option value="true">In Stock</option>
                      <option value="false">Out of Stock</option>
                    </select>
                  </div>
                  <input
                    type="text"
                    placeholder="Stock Status Text (optional, e.g., 'Limited Stock')"
                    value={manualStockStatus}
                    onChange={e => setManualStockStatus(e.target.value)}
                    style={{ padding: 8 }}
                  />
                  <select
                    value={selectedFolder}
                    onChange={e => setSelectedFolder(e.target.value)}
                    style={{ padding: 8 }}
                  >
                    <option value="">Folder</option>
                    {folders.map(folder => (
                      <option key={folder._id} value={folder._id}>{folder.name}</option>
                    ))}
                  </select>
                  <button type="submit" disabled={loading} style={{ padding: '8px 16px' }}>
                    {loading ? 'Adding...' : 'Add Manually'}
                  </button>
                </form>
              )}
               {message && (
                <div
                  style={{
                    marginTop: 16,
                    color:
                      message.includes('CAPTCHA') || message.includes('Price not found') || message.includes('Failed') || message.includes('Network error')
                        ? '#a00'
                        : '#007700',
                  }}
                >
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {folderMenu && folderMenu.anchorEl && (
        <div
          ref={folderMenuRef}
          style={{
            position: 'fixed',
            top: folderMenu.anchorEl.getBoundingClientRect().bottom,
            left: folderMenu.anchorEl.getBoundingClientRect().left,
            background: '#333',
            border: '1px solid #555',
            borderRadius: 8,
            zIndex: 100,
            minWidth: 150,
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            maxHeight: '70vh',
            overflowY: 'auto',
          }}
        >
          <div style={{ padding: '8px 0' }}>
            <div style={{ padding: '8px 16px', color: '#ccc', fontSize: 12 }}>Move to...</div>
            {folders.map(folder => (
              <button
                key={folder._id}
                onClick={() => {
                  console.log('Clicked folder:', folder.name, folder._id);
                  handleMoveToFolder(folderMenu.productId, folder._id, folderMenu.productType === 'manual');
                  setEditMenuProductId(null);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 16px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                {folder.name}
              </button>
            ))}
            {folders.length > 0 && <hr style={{ margin: '4px 0', borderColor: '#555' }} />}
            <button
              onClick={() => {
                console.log('Clicked Remove from Folder');
                handleMoveToFolder(folderMenu.productId, null, folderMenu.productType === 'manual');
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 16px',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              Remove from Folder
            </button>
            <hr style={{ margin: '4px 0', borderColor: '#555' }} />
            <button
              onClick={() => {
                console.log('Clicked Create New Folder');
                openCreateFolder();
              }}
              style={{
                display: 'block',
                width: '100%',
                padding: '8px 16px',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              + Create New Folder
            </button>
          </div>
        </div>
      )}
      {showFolderModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingFolder ? 'Edit Folder' : 'Create Folder'}</h2>
              <button onClick={() => setShowFolderModal(false)} className="close-button">&times;</button>
            </div>
            <div className="modal-body">
              <form onSubmit={editingFolder ? handleUpdateFolder : handleCreateFolder} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Folder Name *</label>
                  <input
                    type="text"
                    value={folderName}
                    onChange={e => setFolderName(e.target.value)}
                    required
                    style={{ width: '100%', padding: 12, border: '1px solid #555', borderRadius: 4, background: '#333', color: 'white', fontSize: 16 }}
                    placeholder="e.g., Clothes, Electronics"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Description</label>
                  <textarea
                    value={folderDescription}
                    onChange={e => setFolderDescription(e.target.value)}
                    style={{ width: '100%', padding: 12, border: '1px solid #555', borderRadius: 4, background: '#333', color: 'white', minHeight: 80, fontSize: 16 }}
                    placeholder="Optional description for this folder"
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Color</label>
                  <input
                    type="color"
                    value={folderColor}
                    onChange={e => setFolderColor(e.target.value)}
                    style={{ width: '100%', height: 48, border: '1px solid #555', borderRadius: 4, cursor: 'pointer', background: '#333' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                  <button
                    type="button"
                    onClick={() => setShowFolderModal(false)}
                    style={{ padding: '10px 20px', border: 'none', borderRadius: 4, background: '#555', color: 'white', cursor: 'pointer', fontSize: 16 }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16 }}
                  >
                    {loading ? 'Saving...' : (editingFolder ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Edit Price/Stock Modal */}
      {editingProductId && editingField && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit {editingField === 'price' ? 'Price' : editingField === 'stock' ? 'Stock Status' : 'Name'}</h2>
              <button 
                onClick={() => {
                  setEditingProductId(null);
                  setEditingField(null);
                  setEditingPrice('');
                  setEditingStock('');
                }} 
                className="close-button"
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              {editingField === 'price' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Price</label>
                    <input
                      type="number"
                      value={editingPrice}
                      onChange={e => setEditingPrice(e.target.value)}
                      step="0.01"
                      min="0"
                      style={{ width: '100%', padding: 12, border: '1px solid #555', borderRadius: 4, background: '#333', color: 'white', fontSize: 16 }}
                      placeholder="Enter new price"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProductId(null);
                        setEditingField(null);
                        setEditingPrice('');
                      }}
                      style={{ padding: '10px 20px', border: 'none', borderRadius: 4, background: '#555', color: 'white', cursor: 'pointer', fontSize: 16 }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (editingPrice && !isNaN(parseFloat(editingPrice))) {
                          const product = allItems.find(p => p._id === editingProductId);
                          if (product) {
                            await fetch(`${API_BASE}/products/${editingProductId}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                price: parseFloat(editingPrice),
                                inStock: product.inStock,
                                stockStatus: product.stockStatus
                              })
                            });
                            fetchProducts();
                            fetchManualProducts();
                            setMessage('Price updated successfully!');
                          }
                        }
                        setEditingProductId(null);
                        setEditingField(null);
                        setEditingPrice('');
                      }}
                      style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16 }}
                    >
                      Update Price
                    </button>
                  </div>
                </div>
              ) : editingField === 'stock' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Stock Status</label>
                    <select
                      value={editingStock}
                      onChange={e => setEditingStock(e.target.value)}
                      style={{ width: '100%', padding: 12, border: '1px solid #555', borderRadius: 4, background: '#333', color: 'white', fontSize: 16 }}
                    >
                      <option value="">Unknown</option>
                      <option value="true">In Stock</option>
                      <option value="false">Out of Stock</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProductId(null);
                        setEditingField(null);
                        setEditingStock('');
                      }}
                      style={{ padding: '10px 20px', border: 'none', borderRadius: 4, background: '#555', color: 'white', cursor: 'pointer', fontSize: 16 }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        const product = allItems.find(p => p._id === editingProductId);
                        if (product) {
                          const statusString = editingStock === 'true' ? 'In Stock' : editingStock === 'false' ? 'Out of Stock' : 'Unknown';
                          await fetch(`${API_BASE}/products/${editingProductId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              price: product.price,
                              inStock: editingStock === 'true' ? true : editingStock === 'false' ? false : null,
                              stockStatus: statusString
                            })
                          });
                          fetchProducts();
                          fetchManualProducts();
                          setMessage('Stock status updated successfully!');
                        }
                        setEditingProductId(null);
                        setEditingField(null);
                        setEditingStock('');
                      }}
                      style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16 }}
                    >
                      Update Stock
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: 8, fontWeight: 'bold' }}>Name</label>
                    <input
                      type="text"
                      value={editingName}
                      onChange={e => setEditingName(e.target.value)}
                      style={{ width: '100%', padding: 12, border: '1px solid #555', borderRadius: 4, background: '#333', color: 'white', fontSize: 16 }}
                      placeholder="Enter new name"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 16 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProductId(null);
                        setEditingField(null);
                        setEditingName('');
                      }}
                      style={{ padding: '10px 20px', border: 'none', borderRadius: 4, background: '#555', color: 'white', cursor: 'pointer', fontSize: 16 }}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        const product = allItems.find(p => p._id === editingProductId);
                        if (product) {
                          await fetch(`${API_BASE}/products/${editingProductId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              name: editingName,
                              price: product.price,
                              inStock: product.inStock,
                              stockStatus: product.stockStatus
                            })
                          });
                          fetchProducts();
                          fetchManualProducts();
                          setMessage('Name updated successfully!');
                        }
                        setEditingProductId(null);
                        setEditingField(null);
                        setEditingName('');
                      }}
                      style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16 }}
                    >
                      Update Name
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
