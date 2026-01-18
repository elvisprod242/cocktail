
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { POS } from './pages/POS';
import { Kitchen } from './pages/Kitchen';
import { Dashboard } from './pages/Dashboard';
import { ReportsPage } from './pages/ReportsPage';
import { Products } from './pages/Products';
import { CategoriesPage } from './pages/CategoriesPage';
import { SettingsPage } from './pages/SettingsPage';
import { TablesPage } from './pages/TablesPage'; 
import { ClientsPage } from './pages/ClientsPage';
import { SalesHistoryPage } from './pages/SalesHistoryPage';
import { StaffPage } from './pages/StaffPage';
import { LoginPage } from './pages/LoginPage';
import { CartItem, Product, Order, OrderStatus, CategoryDef, TableDef, Client, User, UserRole, TableStatus } from './types';
import { initDB, getProducts, getOrders, insertOrder, updateOrderStatusInDB, getCategories, getTables, getClients, getSetting, saveSetting, getUsers } from './services/db';
import { Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [isDbReady, setIsDbReady] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [tables, setTables] = useState<TableDef[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [staff, setStaff] = useState<User[]>([]);
  const [currency, setCurrency] = useState('€');

  useEffect(() => {
    const setup = async () => {
      try {
        await initDB();
        refreshData();
        
        const savedUser = localStorage.getItem('barflow_session');
        if (savedUser) {
          setCurrentUser(JSON.parse(savedUser));
        }
        
        setIsDbReady(true);
      } catch (e) {
        console.error("Failed to init DB", e);
        setDbError("Impossible de charger la base de données SQLite.");
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
     setStaff(getUsers());
     setCurrency(getSetting('currency', '€'));
  };

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('barflow_session', JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('barflow_session');
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
    insertOrder(newOrder);
    refreshData();
    clearCart();
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    updateOrderStatusInDB(orderId, status);
    refreshData();
  };

  const ProtectedRoute = ({ children, roles }: React.PropsWithChildren<{ roles: UserRole[] }>) => {
    if (!currentUser) return <Navigate to="/login" />;
    if (!roles.includes(currentUser.role)) return <Navigate to="/" />;
    return <>{children}</>;
  };

  if (dbError) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white p-6 text-center">
        <AlertTriangle className="text-red-500 mb-4" size={64} />
        <h1 className="text-2xl font-bold mb-2">Erreur</h1>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-slate-800 rounded-xl font-bold flex items-center gap-2"><RefreshCw size={20} /> Réessayer</button>
      </div>
    );
  }

  if (!isDbReady) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin mb-4 text-bar-accent" size={48} />
        <p>Initialisation...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="flex h-screen bg-slate-950 text-slate-200 font-sans overflow-hidden">
        {currentUser && <Navbar currentUser={currentUser} onLogout={handleLogout} />}
        <main className={`flex-1 h-full overflow-hidden relative transition-all duration-300 ${currentUser ? 'md:ml-20 lg:ml-64' : ''}`}>
          <Routes>
            <Route path="/login" element={!currentUser ? <LoginPage onLogin={handleLogin} users={staff} /> : <Navigate to="/" />} />
            
            <Route 
              path="/" 
              element={
                <ProtectedRoute roles={[UserRole.ADMIN, UserRole.BARTENDER, UserRole.SERVER]}>
                  <Dashboard orders={orders} products={products} currency={currency} />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="/pos" 
              element={
                <ProtectedRoute roles={[UserRole.ADMIN, UserRole.BARTENDER, UserRole.SERVER]}>
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
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/kitchen" 
              element={
                <ProtectedRoute roles={[UserRole.ADMIN, UserRole.BARTENDER]}>
                  <Kitchen orders={orders} updateOrderStatus={updateOrderStatus} clients={clients} />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/reports" 
              element={
                <ProtectedRoute roles={[UserRole.ADMIN]}>
                  <ReportsPage orders={orders} products={products} currency={currency} />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/history" 
              element={
                <ProtectedRoute roles={[UserRole.ADMIN, UserRole.BARTENDER, UserRole.SERVER]}>
                  <SalesHistoryPage orders={orders} currency={currency} />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/clients" 
              element={
                <ProtectedRoute roles={[UserRole.ADMIN, UserRole.SERVER]}>
                  <ClientsPage clients={clients} refreshData={refreshData} currency={currency} orders={orders} />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/staff" 
              element={
                <ProtectedRoute roles={[UserRole.ADMIN]}>
                  <StaffPage staff={staff} refreshData={refreshData} />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/products" 
              element={
                <ProtectedRoute roles={[UserRole.ADMIN, UserRole.BARTENDER]}>
                  <Products products={products} categories={categories} refreshData={refreshData} currency={currency} />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/tables" 
              element={
                <ProtectedRoute roles={[UserRole.ADMIN, UserRole.SERVER]}>
                  <TablesPage tables={tables} refreshData={refreshData} orders={orders} currency={currency} />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/categories" 
              element={
                <ProtectedRoute roles={[UserRole.ADMIN]}>
                  <CategoriesPage categories={categories} refreshData={refreshData} />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/settings" 
              element={
                <ProtectedRoute roles={[UserRole.ADMIN]}>
                  <SettingsPage currentCurrency={currency} onCurrencyChange={(s) => { saveSetting('currency', s); setCurrency(s); }} />
                </ProtectedRoute>
              } 
            />

            <Route path="*" element={currentUser ? <Navigate to="/" /> : <Navigate to="/login" />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
