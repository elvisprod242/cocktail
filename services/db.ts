import { Product, Order, OrderStatus, CartItem } from '../types';
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
      table_number INTEGER
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
};

const seedData = () => {
  const stmt = db.prepare("INSERT INTO products VALUES (?, ?, ?, ?, ?, ?)");
  INITIAL_MENU.forEach(p => {
    stmt.run([p.id, p.name, p.price, p.category, p.image, p.description || '']);
  });
  stmt.free();
};

// --- API Publique du Service DB ---

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
      category: row.category as any,
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

export const getOrders = (): Order[] => {
  if (!db) return [];
  const stmt = db.prepare("SELECT * FROM orders ORDER BY timestamp DESC");
  const orders: Order[] = [];
  
  while (stmt.step()) {
    const row = stmt.getAsObject();
    
    // Récupérer les items pour chaque commande
    const itemsStmt = db.prepare("SELECT * FROM order_items WHERE order_id = ?");
    itemsStmt.bind([row.id]);
    const items: CartItem[] = [];
    while (itemsStmt.step()) {
      const itemRow = itemsStmt.getAsObject();
      items.push({
        id: itemRow.id.toString(), // ID interne de la ligne item
        name: itemRow.name,
        price: itemRow.price,
        quantity: itemRow.quantity,
        category: 'Food' as any // Simplification pour l'affichage historique
      });
    }
    itemsStmt.free();

    orders.push({
      id: row.id,
      total: row.total,
      status: row.status as OrderStatus,
      timestamp: row.timestamp,
      tableNumber: row.table_number,
      items: items
    });
  }
  stmt.free();
  return orders;
};

export const insertOrder = (order: Order) => {
  if (!db) return;
  db.run("INSERT INTO orders VALUES (?, ?, ?, ?, ?)", [
    order.id, 
    order.total, 
    order.status, 
    order.timestamp, 
    order.tableNumber
  ]);

  const stmt = db.prepare("INSERT INTO order_items (order_id, name, price, quantity) VALUES (?, ?, ?, ?)");
  order.items.forEach(item => {
    stmt.run([order.id, item.name, item.price, item.quantity]);
  });
  stmt.free();
  saveDB();
};

export const updateOrderStatusInDB = (orderId: string, status: OrderStatus) => {
  if (!db) return;
  db.run("UPDATE orders SET status = ? WHERE id = ?", [status, orderId]);
  saveDB();
};