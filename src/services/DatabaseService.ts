import { supabase } from '../utils/supabase';
import pako from 'pako';

// ─── Data Models ─────────────────────────────────────────────────────────────

export interface Employee {
  id: string;
  name: string;
  pin: string;
  role: 'cashier' | 'manager';
  position?: string;
  phone?: string;
  hourlyRate?: number;
  isActive?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  unit: string;
  price: number;
  cost: number;
  available?: boolean;
  lowStockThreshold: number;
  lastUpdated: string;
}

export interface Transaction {
  id: string;
  orderId: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    modifiers?: string[];
    notes?: string;
  }>;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  timestamp: string;
  cashier: string;
  paymentMethod?: string;
}

// ─── Compression Helpers ─────────────────────────────────────────────────────

/**
 * Compresses a JavaScript object into a base64-encoded string
 * using pako (zlib/deflate) for efficient binary compression.
 */
function compress<T>(data: T): string {
  const json = JSON.stringify(data);
  const compressed = pako.deflate(json);
  let binary = '';
  for (let i = 0; i < compressed.byteLength; i++) {
    binary += String.fromCharCode(compressed[i]);
  }
  return btoa(binary);
}

/**
 * Decompresses a base64-encoded compressed string back into a JavaScript object.
 */
function decompress<T>(encoded: string): T {
  const binary = atob(encoded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const decompressed = pako.inflate(bytes, { to: 'string' });
  return JSON.parse(decompressed) as T;
}

// ─── Supabase Row Shape ──────────────────────────────────────────────────────

interface DataRow {
  id: number;
  data: string;       // base64-encoded compressed JSON
  updated_at: string;
}

// ─── Generic CRUD helpers ────────────────────────────────────────────────────

async function readBlob<T>(table: string, emptyValue: T): Promise<T> {
  const { data, error } = await supabase
    .from(table)
    .select('data')
    .eq('id', 1)
    .maybeSingle<DataRow>();

  if (error) {
    console.error(`Error reading ${table}:`, error);
    return emptyValue;
  }

  if (!data || !data.data) {
    return emptyValue;
  }

  try {
    return decompress<T>(data.data);
  } catch (err) {
    console.error(`Error decompressing ${table}:`, err);
    return emptyValue;
  }
}

async function writeBlob<T>(table: string, payload: T): Promise<void> {
  const encoded = compress(payload);

  const { error } = await supabase
    .from(table)
    .upsert({ id: 1, data: encoded, updated_at: new Date().toISOString() });

  if (error) {
    console.error(`Error writing ${table}:`, error);
  }
}

// ─── Supabase Table Names ────────────────────────────────────────────────────

const EMPLOYEES_TABLE     = 'pos_employees';
const INVENTORY_TABLE     = 'pos_inventory';
const TRANSACTIONS_TABLE  = 'pos_transactions';
const SETTINGS_TABLE      = 'pos_settings';

// ─── Database Service ────────────────────────────────────────────────────────

class DatabaseService {

  // ── Employees ──────────────────────────────────────────────────────────────

  async getEmployees(): Promise<Employee[]> {
    try {
      return await readBlob<Employee[]>(EMPLOYEES_TABLE, []);
    } catch (error) {
      console.error('Error getting employees:', error);
      return [];
    }
  }

  async saveEmployees(employees: Employee[]): Promise<void> {
    try {
      await writeBlob(EMPLOYEES_TABLE, employees);
    } catch (error) {
      console.error('Error saving employees:', error);
    }
  }

  async addEmployee(employee: Employee): Promise<void> {
    const employees = await this.getEmployees();
    employees.push(employee);
    await this.saveEmployees(employees);
  }

  async updateEmployee(employee: Employee): Promise<void> {
    const employees = await this.getEmployees();
    const index = employees.findIndex(e => e.id === employee.id);
    if (index !== -1) {
      employees[index] = employee;
      await this.saveEmployees(employees);
    }
  }

  async deleteEmployee(id: string): Promise<void> {
    const employees = await this.getEmployees();
    const filtered = employees.filter(e => e.id !== id);
    await this.saveEmployees(filtered);
  }

  // ── Inventory ──────────────────────────────────────────────────────────────

  async getInventory(): Promise<InventoryItem[]> {
    try {
      return await readBlob<InventoryItem[]>(INVENTORY_TABLE, []);
    } catch (error) {
      console.error('Error getting inventory:', error);
      return [];
    }
  }

  async saveInventory(inventory: InventoryItem[]): Promise<void> {
    try {
      await writeBlob(INVENTORY_TABLE, inventory);
    } catch (error) {
      console.error('Error saving inventory:', error);
    }
  }

  async addInventoryItem(item: InventoryItem): Promise<void> {
    const inventory = await this.getInventory();
    inventory.push(item);
    await this.saveInventory(inventory);
  }

  async updateInventoryItem(item: InventoryItem): Promise<void> {
    const inventory = await this.getInventory();
    const index = inventory.findIndex(i => i.id === item.id);
    if (index !== -1) {
      inventory[index] = item;
      await this.saveInventory(inventory);
    }
  }

  async deleteInventoryItem(id: string): Promise<void> {
    const inventory = await this.getInventory();
    const filtered = inventory.filter(i => i.id !== id);
    await this.saveInventory(filtered);
  }

  // ── Transactions ───────────────────────────────────────────────────────────

  async getTransactions(): Promise<Transaction[]> {
    try {
      return await readBlob<Transaction[]>(TRANSACTIONS_TABLE, []);
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    try {
      await writeBlob(TRANSACTIONS_TABLE, transactions);
    } catch (error) {
      console.error('Error saving transactions:', error);
    }
  }

  async addTransaction(transaction: Transaction): Promise<void> {
    const transactions = await this.getTransactions();
    transactions.push(transaction);
    await this.saveTransactions(transactions);
  }

  async deleteTransaction(id: string): Promise<void> {
    const transactions = await this.getTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    await this.saveTransactions(filtered);
  }

  // ── Settings ───────────────────────────────────────────────────────────────

  async getSettings(): Promise<any> {
    try {
      return await readBlob<any>(SETTINGS_TABLE, {});
    } catch (error) {
      console.error('Error getting settings:', error);
      return {};
    }
  }

  async saveSettings(settings: any): Promise<void> {
    try {
      await writeBlob(SETTINGS_TABLE, settings);
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }
}

// Export singleton instance
export const dbService = new DatabaseService();
