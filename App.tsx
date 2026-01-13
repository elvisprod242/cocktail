import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { POS } from './pages/POS';
import { Kitchen } from './pages/Kitchen';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { CategoriesPage } from './pages/CategoriesPage';
import { SettingsPage } from './pages/SettingsPage';
import { TablesPage } from './pages/TablesPage'; 
import { ClientsPage } from './pages/ClientsPage';
import { SalesHistoryPage } from './pages/SalesHistoryPage';
import { CartItem, Product, Order, OrderStatus, CategoryDef, TableDef, Client } from './types';
import { initDB, getProducts, getOrders, insertOrder, updateOrderStatusInDB, getCategories, getTables, getClients, getSetting, saveSetting } from './services/db';
import { Loader2 } from 'lucide-react';

// Helper to generate IDs without external deps
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [isDbReady, setIsDbReady] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [tables, setTables] = useState<TableDef[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [currency, setCurrency] = useState('€');

  useEffect(() => {
    const setup = async () => {
      try {
        await initDB();
        refreshData();
        setIsDbReady(true);
      } catch (e) {
        console.error("Failed to init DB", e);
      }
    };
    setup();
  }, []);

  const refreshData = () => {
     setProducts(getProducts());
     setOrders(getOrders());
     setCategories(getCategories());
     setTables(getTables());
     setClients(getClients());
     setCurrency(getSetting('currency', '€'));
  };

  const updateCurrency = (newSymbol: string) => {
    saveSetting('currency', newSymbol);
    setCurrency(newSymbol);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateCartItemQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity: newQuantity } : item
    ));
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  const placeOrder = (tableName: string, client?: Client | null) => {
    if (cart.length === 0) return;

    // Essayer de trouver le numéro si le nom est un numéro
    const tableNumber = parseInt(tableName);

    const newOrder: Order = {
      id: generateId(),
      items: [...cart],
      total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      status: OrderStatus.PENDING,
      timestamp: Date.now(),
      tableNumber: isNaN(tableNumber) ? undefined : tableNumber,
      tableName: tableName,
      clientId: client?.id,
      clientName: client?.name
    };

    // Persistence SQLite
    insertOrder(newOrder);
    
    // Update local state from DB to be sure
    refreshData();
    clearCart();
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    // Persistence SQLite
    updateOrderStatusInDB(orderId, status);
    // Update local state
    setOrders(getOrders());
  };

  if (!isDbReady) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin mb-4 text-bar-accent" size={48} />
        <p>Chargement de la base de données SQLite...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
        <Navbar />
        <main className="flex-1 h-full overflow-hidden md:ml-20 lg:ml-64 relative">
          <Routes>
            <Route 
              path="/" 
              element={<Dashboard orders={orders} currency={currency} />} 
            />
            <Route 
              path="/pos" 
              element={
                <POS 
                  products={products}
                  categories={categories}
                  tables={tables}
                  activeOrders={orders}
                  clients={clients}
                  cart={cart} 
                  addToCart={addToCart}
                  updateCartItemQuantity={updateCartItemQuantity}
                  removeFromCart={removeFromCart} 
                  clearCart={clearCart}
                  placeOrder={placeOrder}
                  currency={currency}
                />
              } 
            />
            <Route 
              path="/kitchen" 
              element={
                <Kitchen 
                  orders={orders} 
                  updateOrderStatus={updateOrderStatus} 
                />
              } 
            />
             <Route 
              path="/history" 
              element={
                <SalesHistoryPage 
                  orders={orders} 
                  currency={currency}
                />
              } 
            />
             <Route 
              path="/clients" 
              element={
                <ClientsPage 
                  clients={clients} 
                  refreshData={refreshData} 
                  currency={currency}
                  orders={orders}
                />
              } 
            />
             <Route 
              path="/products" 
              element={
                <Products 
                  products={products} 
                  categories={categories} 
                  refreshData={refreshData} 
                  currency={currency}
                />
              } 
            />
            <Route 
              path="/tables" 
              element={
                <TablesPage 
                  tables={tables}
                  refreshData={refreshData}
                />
              } 
            />
            <Route 
              path="/categories" 
              element={
                <CategoriesPage 
                  categories={categories}
                  refreshData={refreshData}
                />
              } 
            />
            <Route 
              path="/settings" 
              element={
                <SettingsPage 
                  currentCurrency={currency} 
                  onCurrencyChange={updateCurrency} 
                />
              } 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;