import { Product, Order, OrderStatus, CartItem, CategoryDef, Category, TableDef, Client, PaymentMethod, StockEntry } from '../types';
import { INITIAL_MENU } from '../constants';

let db: any = null;
const DB_STORAGE_KEY = 'barflow_sqlite_db_v1';

export const initDB = async () => {
  if (db) return;

  if (typeof (window as any).initSqlJs !== 'function') {
      throw new Error("sql.js library not loaded properly.");
  }

  const SQL = await (window as any).initSqlJs({
    locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
  });

  const savedDb = localStorage.getItem(DB_STORAGE_KEY);
  
  if (savedDb) {
    try {
        const binaryString = atob(savedDb);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
        }
        db = new SQL.Database(bytes);
    } catch (e) {
        db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }
  
  createTables();
  applyMigrations(); 
  
  if (!savedDb) {
      seedData();
      saveDB();
  }
};

const saveDB = () => {
  if (!db) return;
  const data = db.export();
  let binaryString = '';
  for (let i = 0; i < data.length; i++) {
    binaryString += String.fromCharCode(data[i]);
  }
  localStorage.setItem(DB_STORAGE_KEY, btoa(binaryString));
};

const createTables = () => {
  db.run(`CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT, icon TEXT);`);
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY, name TEXT, price REAL, cost_price REAL DEFAULT 0, 
    stock INTEGER DEFAULT 0, alert_threshold INTEGER DEFAULT 5, 
    category TEXT, image TEXT, description TEXT, is_available INTEGER DEFAULT 1
  );`);
  db.run(`CREATE TABLE IF NOT EXISTS stock_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT, product_id TEXT, quantity INTEGER, 
    timestamp INTEGER, note TEXT
  );`);
  db.run(`CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, total REAL, status TEXT, timestamp INTEGER, table_number INTEGER, table_name TEXT, client_id TEXT, client_name TEXT, payment_method TEXT);`);
  db.run(`CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT, name TEXT, price REAL, cost_price REAL DEFAULT 0, quantity INTEGER, FOREIGN KEY(order_id) REFERENCES orders(id));`);
  db.run(`CREATE TABLE IF NOT EXISTS tables (id TEXT PRIMARY KEY, name TEXT, zone TEXT);`);
  db.run(`CREATE TABLE IF NOT EXISTS clients (id TEXT PRIMARY KEY, name TEXT, phone TEXT, email TEXT, notes TEXT, loyalty_points INTEGER DEFAULT 0, total_spent REAL DEFAULT 0, balance REAL DEFAULT 0, last_visit INTEGER);`);
  db.run(`CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT);`);
};

const applyMigrations = () => {
    try { db.run("ALTER TABLE products ADD COLUMN alert_threshold INTEGER DEFAULT 5"); } catch (e) {}
    try { db.run("ALTER TABLE clients ADD COLUMN balance REAL DEFAULT 0"); } catch (e) {}
    try { db.run("ALTER TABLE orders ADD COLUMN payment_method TEXT"); } catch (e) {}
    try { db.run("ALTER TABLE products ADD COLUMN is_available INTEGER DEFAULT 1"); } catch (e) {}
    try { db.run("ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0"); } catch (e) {}
    try { db.run("ALTER TABLE products ADD COLUMN cost_price REAL DEFAULT 0"); } catch (e) {}
    try { db.run("ALTER TABLE order_items ADD COLUMN cost_price REAL DEFAULT 0"); } catch (e) {}
    try { db.run(`CREATE TABLE IF NOT EXISTS stock_history (id INTEGER PRIMARY KEY AUTOINCREMENT, product_id TEXT, quantity INTEGER, timestamp INTEGER, note TEXT);`); } catch (e) {}
    
    try {
        db.run("UPDATE clients SET total_spent = 0 WHERE total_spent IS NULL");
        db.run("UPDATE clients SET balance = 0 WHERE balance IS NULL");
        db.run("UPDATE clients SET loyalty_points = 0 WHERE loyalty_points IS NULL");
    } catch (e) {}
};

const seedData = () => {
  const catStmt = db.prepare("INSERT INTO categories VALUES (?, ?, ?)");
  const defaultCats = [
    { id: 'cat_1', name: Category.COCKTAIL, icon: 'Martini' },
    { id: 'cat_2', name: Category.BEER, icon: 'Beer' },
    { id: 'cat_3', name: Category.WINE, icon: 'Wine' },
    { id: 'cat_4', name: Category.SOFT, icon: 'GlassWater' },
    { id: 'cat_5', name: Category.FOOD, icon: 'Utensils' },
  ];
  defaultCats.forEach(c => catStmt.run([c.id, c.name, c.icon]));
  catStmt.free();

  const stmt = db.prepare("INSERT INTO products (id, name, price, cost_price, stock, alert_threshold, category, image, description, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  INITIAL_MENU.forEach(p => {
    stmt.run([p.id, p.name, p.price, p.price * 0.3, 50, 10, p.category, p.image, p.description || '', 1]);
  });
  stmt.free();

  const tableStmt = db.prepare("INSERT INTO tables VALUES (?, ?, ?)");
  const defaultTables = [
    { id: 't1', name: '1', zone: 'Salle' }, { id: 't2', name: '2', zone: 'Salle' },
    { id: 't3', name: '3', zone: 'Salle' }, { id: 't4', name: '4', zone: 'Salle' },
    { id: 't10', name: '10', zone: 'Terrasse' }, { id: 't11', name: '11', zone: 'Terrasse' },
    { id: 't12', name: '12', zone: 'Terrasse' }, { id: 't20', name: 'Bar 1', zone: 'Bar' },
    { id: 't21', name: 'Bar 2', zone: 'Bar' },
  ];
  defaultTables.forEach(t => tableStmt.run([t.id, t.name, t.zone]));
  tableStmt.free();
  db.run("INSERT INTO settings (key, value) VALUES (?, ?)", ['currency', '€']);
};

export const resetDatabase = () => {
  localStorage.removeItem(DB_STORAGE_KEY);
  window.location.reload();
};

export const getSetting = (key: string, defaultValue: string = ''): string => {
  if (!db) return defaultValue;
  try {
    const stmt = db.prepare("SELECT value FROM settings WHERE key = ?");
    stmt.bind([key]);
    if (stmt.step()) {
      const result = stmt.getAsObject();
      stmt.free();
      return result.value;
    }
    stmt.free();
    return defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

export const saveSetting = (key: string, value: string) => {
  if (!db) return;
  db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value]);
  saveDB();
};

export const getClients = (): Client[] => {
  if (!db) return [];
  try {
    const stmt = db.prepare("SELECT * FROM clients ORDER BY last_visit DESC");
    const clients: Client[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      clients.push({
        id: row.id, name: row.name, phone: row.phone, email: row.email, notes: row.notes,
        balance: row.balance || 0, loyaltyPoints: row.loyalty_points, totalSpent: row.total_spent, lastVisit: row.last_visit
      });
    }
    stmt.free();
    return clients;
  } catch (e) { return []; }
};

export const addClient = (client: Client) => {
  if (!db) return;
  db.run("INSERT INTO clients (id, name, phone, email, notes, loyalty_points, total_spent, balance, last_visit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
    client.id, client.name, client.phone || '', client.email || '', client.notes || '', 0, 0, 0, Date.now()
  ]);
  saveDB();
};

export const updateClient = (client: Client) => {
  if (!db) return;
  db.run("UPDATE clients SET name = ?, phone = ?, email = ?, notes = ? WHERE id = ?", [client.name, client.phone, client.email, client.notes, client.id]);
  saveDB();
};

export const deleteClient = (id: string) => {
  if (!db) return;
  db.run("DELETE FROM clients WHERE id = ?", [id]);
  saveDB();
};

export const updateClientBalance = (clientId: string, amount: number) => {
    if (!db) return;
    db.run("UPDATE clients SET balance = balance + ?, last_visit = ? WHERE id = ?", [amount, Date.now(), clientId]);
    saveDB();
}

export const getTables = (): TableDef[] => {
  if (!db) return [];
  try {
    const stmt = db.prepare("SELECT * FROM tables");
    const tables: TableDef[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      tables.push({ id: row.id, name: row.name, zone: row.zone });
    }
    stmt.free();
    return tables;
  } catch (e) { return []; }
};

export const addTable = (table: TableDef) => {
  if (!db) return;
  db.run("INSERT INTO tables VALUES (?, ?, ?)", [table.id, table.name, table.zone]);
  saveDB();
};

export const deleteTable = (id: string) => {
  if (!db) return;
  db.run("DELETE FROM tables WHERE id = ?", [id]);
  saveDB();
};

export const getCategories = (): CategoryDef[] => {
  if (!db) return [];
  const stmt = db.prepare("SELECT * FROM categories");
  const cats: CategoryDef[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    cats.push({ id: row.id, name: row.name, icon: row.icon });
  }
  stmt.free();
  return cats;
};

export const addCategory = (category: CategoryDef) => {
  if (!db) return;
  db.run("INSERT INTO categories VALUES (?, ?, ?)", [category.id, category.name, category.icon]);
  saveDB();
};

export const deleteCategory = (id: string) => {
  if (!db) return;
  db.run("DELETE FROM categories WHERE id = ?", [id]);
  saveDB();
};

export const getProducts = (): Product[] => {
  if (!db) return [];
  const stmt = db.prepare("SELECT * FROM products");
  const products: Product[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    products.push({
      id: row.id, name: row.name, price: row.price, costPrice: row.cost_price || 0,
      stock: row.stock || 0, alertThreshold: row.alert_threshold || 5, 
      category: row.category, image: row.image, description: row.description,
      isAvailable: row.is_available === 1
    });
  }
  stmt.free();
  return products;
};

export const addProduct = (product: Product) => {
  if (!db) return;
  db.run("INSERT INTO products (id, name, price, cost_price, stock, alert_threshold, category, image, description, is_available) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [
    product.id, product.name, product.price, product.costPrice || 0, product.stock || 0, 
    product.alertThreshold || 5, product.category, product.image || '', product.description || '', product.isAvailable ? 1 : 0
  ]);
  saveDB();
};

export const updateProduct = (product: Product) => {
  if (!db) return;
  db.run("UPDATE products SET name = ?, price = ?, cost_price = ?, stock = ?, alert_threshold = ?, category = ?, image = ?, description = ?, is_available = ? WHERE id = ?", [
    product.name, product.price, product.costPrice, product.stock, product.alertThreshold, 
    product.category, product.image, product.description, product.isAvailable ? 1 : 0, product.id
  ]);
  saveDB();
};

export const replenishStock = (productId: string, quantity: number, note: string) => {
    if (!db) return;
    db.run("UPDATE products SET stock = stock + ? WHERE id = ?", [quantity, productId]);
    db.run("INSERT INTO stock_history (product_id, quantity, timestamp, note) VALUES (?, ?, ?, ?)", [
        productId, quantity, Date.now(), note
    ]);
    saveDB();
};

export const getStockHistory = (productId: string): StockEntry[] => {
    if (!db) return [];
    const stmt = db.prepare("SELECT * FROM stock_history WHERE product_id = ? ORDER BY timestamp DESC");
    stmt.bind([productId]);
    const entries: StockEntry[] = [];
    while (stmt.step()) {
        const row = stmt.getAsObject();
        entries.push({
            id: row.id, productId: row.product_id, quantity: row.quantity, 
            timestamp: row.timestamp, note: row.note
        });
    }
    stmt.free();
    return entries;
};

export const deleteProduct = (id: string) => {
  if (!db) return;
  db.run("DELETE FROM products WHERE id = ?", [id]);
  saveDB();
};

export const getOrders = (): Order[] => {
  if (!db) return [];
  try {
      const stmt = db.prepare("SELECT * FROM orders ORDER BY timestamp DESC");
      const orders: Order[] = [];
      while (stmt.step()) {
        const row = stmt.getAsObject();
        const itemsStmt = db.prepare("SELECT * FROM order_items WHERE order_id = ?");
        itemsStmt.bind([row.id]);
        const items: CartItem[] = [];
        while (itemsStmt.step()) {
          const itemRow = itemsStmt.getAsObject();
          items.push({ 
            id: itemRow.id.toString(), 
            name: itemRow.name, 
            price: itemRow.price, 
            costPrice: itemRow.cost_price || 0, 
            stock: 0, 
            alertThreshold: 0, 
            quantity: itemRow.quantity, 
            category: 'Divers' as any 
          });
        }
        itemsStmt.free();
        orders.push({
          id: row.id, total: row.total, status: row.status as OrderStatus, timestamp: row.timestamp,
          tableNumber: row.table_number, tableName: row.table_name || '?', clientId: row.client_id,
          clientName: row.client_name, paymentMethod: row.payment_method as PaymentMethod, items: items
        });
      }
      stmt.free();
      return orders;
  } catch (e) { return []; }
};

export const insertOrder = (order: Order) => {
  if (!db) return;
  db.run("INSERT INTO orders (id, total, status, timestamp, table_number, table_name, client_id, client_name, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)", [
    order.id, order.total, order.status, order.timestamp, order.tableNumber || 0, order.tableName || 'Unknown', order.clientId || null, order.clientName || null, order.paymentMethod || null
  ]);
  const stmt = db.prepare("INSERT INTO order_items (order_id, name, price, cost_price, quantity) VALUES (?, ?, ?, ?, ?)");
  const stockStmt = db.prepare("UPDATE products SET stock = stock - ? WHERE name = ?");
  order.items.forEach(item => {
    stmt.run([order.id, item.name, item.price, item.costPrice || 0, item.quantity]);
    try { stockStmt.run([item.quantity, item.name]); } catch(e) {}
  });
  stmt.free();
  stockStmt.free();
  saveDB();
};

export const updateOrderStatusInDB = (orderId: string, status: OrderStatus) => {
  if (!db) return;
  db.run("UPDATE orders SET status = ? WHERE id = ?", [status, orderId]);
  saveDB();
};

export const processOrderPayment = (orderId: string, method: PaymentMethod, total: number, clientId?: string) => {
    if (!db) return;
    const numericTotal = Number(total);
    db.run("UPDATE orders SET status = ?, payment_method = ? WHERE id = ?", [OrderStatus.PAID, method, orderId]);
    if (clientId) {
        let sql = `UPDATE clients SET total_spent = total_spent + ?, loyalty_points = loyalty_points + ?, last_visit = ?`;
        const pointsEarned = Math.floor(numericTotal / 10);
        const params: any[] = [numericTotal, pointsEarned, Date.now()];
        if (method === PaymentMethod.TAB) {
            sql += `, balance = balance - ?`;
            params.push(numericTotal);
        }
        sql += ` WHERE id = ?`;
        params.push(clientId);
        db.run(sql, params);
    }
    saveDB();
};