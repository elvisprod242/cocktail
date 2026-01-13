import { Product, Order, OrderStatus, CartItem, CategoryDef, Category, TableDef, Client } from '../types';
import { INITIAL_MENU } from '../constants';

let db: any = null;
const DB_STORAGE_KEY = 'barflow_sqlite_db_v1';

// Initialisation de la base de données
export const initDB = async () => {
  if (db) return;

  // Configuration de sql.js pour charger le fichier wasm depuis le CDN
  const SQL = await (window as any).initSqlJs({
    locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
  });

  // Tentative de chargement depuis le localStorage
  const savedDb = localStorage.getItem(DB_STORAGE_KEY);
  
  if (savedDb) {
    const binaryString = atob(savedDb);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    db = new SQL.Database(bytes);
    // Migration "à chaud" pour s'assurer que les tables existent si on vient d'une vieille version
    createTables(); 
  } else {
    db = new SQL.Database();
    createTables();
    seedData();
    saveDB();
  }
};

// Sauvegarde de la DB dans le localStorage (persistance simple)
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
  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT,
      icon TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT,
      price REAL,
      category TEXT,
      image TEXT,
      description TEXT
    );
  `);
  
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      total REAL,
      status TEXT,
      timestamp INTEGER,
      table_number INTEGER,
      table_name TEXT,
      client_id TEXT,
      client_name TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT,
      name TEXT,
      price REAL,
      quantity INTEGER,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS tables (
      id TEXT PRIMARY KEY,
      name TEXT,
      zone TEXT
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT,
      phone TEXT,
      email TEXT,
      notes TEXT,
      loyalty_points INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      last_visit INTEGER
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `);
};

const seedData = () => {
  // Seed Categories
  const catStmt = db.prepare("INSERT INTO categories VALUES (?, ?, ?)");
  const defaultCats = [
    { id: 'cat_1', name: Category.COCKTAIL, icon: 'Martini' },
    { id: 'cat_2', name: Category.BEER, icon: 'Beer' },
    { id: 'cat_3', name: Category.WINE, icon: 'Wine' },
    { id: 'cat_4', name: Category.SOFT, icon: 'GlassWater' },
    { id: 'cat_5', name: Category.FOOD, icon: 'Utensils' },
  ];
  
  defaultCats.forEach(c => {
    catStmt.run([c.id, c.name, c.icon]);
  });
  catStmt.free();

  // Seed Products
  const stmt = db.prepare("INSERT INTO products VALUES (?, ?, ?, ?, ?, ?)");
  INITIAL_MENU.forEach(p => {
    stmt.run([p.id, p.name, p.price, p.category, p.image, p.description || '']);
  });
  stmt.free();

  // Seed Tables
  const tableStmt = db.prepare("INSERT INTO tables VALUES (?, ?, ?)");
  const defaultTables = [
    { id: 't1', name: '1', zone: 'Salle' },
    { id: 't2', name: '2', zone: 'Salle' },
    { id: 't3', name: '3', zone: 'Salle' },
    { id: 't4', name: '4', zone: 'Salle' },
    { id: 't10', name: '10', zone: 'Terrasse' },
    { id: 't11', name: '11', zone: 'Terrasse' },
    { id: 't12', name: '12', zone: 'Terrasse' },
    { id: 't20', name: 'Bar 1', zone: 'Bar' },
    { id: 't21', name: 'Bar 2', zone: 'Bar' },
  ];
  defaultTables.forEach(t => {
    tableStmt.run([t.id, t.name, t.zone]);
  });
  tableStmt.free();
  
  // Seed Settings
  db.run("INSERT INTO settings (key, value) VALUES (?, ?)", ['currency', '€']);
};

// --- API Publique du Service DB ---

// SYSTEM
export const resetDatabase = () => {
  localStorage.removeItem(DB_STORAGE_KEY);
  window.location.reload();
};

// SETTINGS
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
  // Upsert (Insert or Replace)
  db.run("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)", [key, value]);
  saveDB();
};

// CLIENTS (Nouveau)
export const getClients = (): Client[] => {
  if (!db) return [];
  try {
    const stmt = db.prepare("SELECT * FROM clients ORDER BY last_visit DESC");
    const clients: Client[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      clients.push({
        id: row.id,
        name: row.name,
        phone: row.phone,
        email: row.email,
        notes: row.notes,
        loyaltyPoints: row.loyalty_points,
        totalSpent: row.total_spent,
        lastVisit: row.last_visit
      });
    }
    stmt.free();
    return clients;
  } catch (e) {
    return [];
  }
};

export const addClient = (client: Client) => {
  if (!db) return;
  db.run("INSERT INTO clients (id, name, phone, email, notes, loyalty_points, total_spent, last_visit) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
    client.id, client.name, client.phone || '', client.email || '', client.notes || '', 0, 0, Date.now()
  ]);
  saveDB();
};

export const updateClient = (client: Client) => {
  if (!db) return;
  db.run("UPDATE clients SET name = ?, phone = ?, email = ?, notes = ? WHERE id = ?", [
    client.name, client.phone, client.email, client.notes, client.id
  ]);
  saveDB();
};

export const deleteClient = (id: string) => {
  if (!db) return;
  db.run("DELETE FROM clients WHERE id = ?", [id]);
  saveDB();
};

// TABLES
export const getTables = (): TableDef[] => {
  if (!db) return [];
  try {
    const stmt = db.prepare("SELECT * FROM tables");
    const tables: TableDef[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      tables.push({
        id: row.id,
        name: row.name,
        zone: row.zone
      });
    }
    stmt.free();
    return tables;
  } catch (e) {
    return [];
  }
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

// CATEGORIES
export const getCategories = (): CategoryDef[] => {
  if (!db) return [];
  const stmt = db.prepare("SELECT * FROM categories");
  const cats: CategoryDef[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    cats.push({
      id: row.id,
      name: row.name,
      icon: row.icon
    });
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

// PRODUCTS
export const getProducts = (): Product[] => {
  if (!db) return [];
  const stmt = db.prepare("SELECT * FROM products");
  const products: Product[] = [];
  while (stmt.step()) {
    const row = stmt.getAsObject();
    products.push({
      id: row.id,
      name: row.name,
      price: row.price,
      category: row.category,
      image: row.image,
      description: row.description
    });
  }
  stmt.free();
  return products;
};

export const addProduct = (product: Product) => {
  if (!db) return;
  db.run("INSERT INTO products VALUES (?, ?, ?, ?, ?, ?)", [
    product.id,
    product.name,
    product.price,
    product.category,
    product.image || 'https://picsum.photos/200/200?random=' + Math.floor(Math.random() * 1000),
    product.description || ''
  ]);
  saveDB();
};

export const deleteProduct = (id: string) => {
  if (!db) return;
  db.run("DELETE FROM products WHERE id = ?", [id]);
  saveDB();
};

// ORDERS
export const getOrders = (): Order[] => {
  if (!db) return [];
  try {
      // Colonnes client_id/client_name ajoutées via migration implicite si nouvelle install
      // Pour éviter les crashs sur les vieilles DB, on select tout
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
            quantity: itemRow.quantity,
            category: 'Food' as any 
          });
        }
        itemsStmt.free();

        orders.push({
          id: row.id,
          total: row.total,
          status: row.status as OrderStatus,
          timestamp: row.timestamp,
          tableNumber: row.table_number,
          tableName: row.table_name || (row.table_number ? row.table_number.toString() : '?'),
          clientId: row.client_id,
          clientName: row.client_name,
          items: items
        });
      }
      stmt.free();
      return orders;
  } catch (e) {
      // Fallback si la migration a échoué
      return [];
  }
};

export const insertOrder = (order: Order) => {
  if (!db) return;
  
  // 1. Insert Order
  db.run("INSERT INTO orders (id, total, status, timestamp, table_number, table_name, client_id, client_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [
    order.id, 
    order.total, 
    order.status, 
    order.timestamp, 
    order.tableNumber || 0,
    order.tableName || (order.tableNumber ? order.tableNumber.toString() : 'Unknown'),
    order.clientId || null,
    order.clientName || null
  ]);

  // 2. Insert Items
  const stmt = db.prepare("INSERT INTO order_items (order_id, name, price, quantity) VALUES (?, ?, ?, ?)");
  order.items.forEach(item => {
    stmt.run([order.id, item.name, item.price, item.quantity]);
  });
  stmt.free();

  // 3. Update Client Loyalty if attached (Automatique)
  if (order.clientId) {
      // 1 point par tranche de 10 unités monétaires
      const pointsEarned = Math.floor(order.total / 10);
      
      db.run(`
        UPDATE clients 
        SET total_spent = total_spent + ?, 
            loyalty_points = loyalty_points + ?,
            last_visit = ?
        WHERE id = ?
      `, [order.total, pointsEarned, Date.now(), order.clientId]);
  }

  saveDB();
};

export const updateOrderStatusInDB = (orderId: string, status: OrderStatus) => {
  if (!db) return;
  db.run("UPDATE orders SET status = ? WHERE id = ?", [status, orderId]);
  saveDB();
};