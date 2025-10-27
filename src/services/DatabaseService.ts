import { Storage } from '@capacitor/storage';

// Define our data models
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
}

class DatabaseService {
  private EMPLOYEES_KEY = 'employees';
  private INVENTORY_KEY = 'inventory';
  private TRANSACTIONS_KEY = 'transactions';
  private SETTINGS_KEY = 'settings';

  // Employee methods
  async getEmployees(): Promise<Employee[]> {
    try {
      const { value } = await Storage.get({ key: this.EMPLOYEES_KEY });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error getting employees:', error);
      return [];
    }
  }

  async saveEmployees(employees: Employee[]): Promise<void> {
    try {
      await Storage.set({
        key: this.EMPLOYEES_KEY,
        value: JSON.stringify(employees)
      });
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

  // Inventory methods
  async getInventory(): Promise<InventoryItem[]> {
    try {
      const { value } = await Storage.get({ key: this.INVENTORY_KEY });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error getting inventory:', error);
      return [];
    }
  }

  async saveInventory(inventory: InventoryItem[]): Promise<void> {
    try {
      await Storage.set({
        key: this.INVENTORY_KEY,
        value: JSON.stringify(inventory)
      });
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

  // Transaction methods
  async getTransactions(): Promise<Transaction[]> {
    try {
      const { value } = await Storage.get({ key: this.TRANSACTIONS_KEY });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  async saveTransactions(transactions: Transaction[]): Promise<void> {
    try {
      await Storage.set({
        key: this.TRANSACTIONS_KEY,
        value: JSON.stringify(transactions)
      });
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

  // Settings methods
  async getSettings(): Promise<any> {
    try {
      const { value } = await Storage.get({ key: this.SETTINGS_KEY });
      return value ? JSON.parse(value) : {};
    } catch (error) {
      console.error('Error getting settings:', error);
      return {};
    }
  }

  async saveSettings(settings: any): Promise<void> {
    try {
      await Storage.set({
        key: this.SETTINGS_KEY,
        value: JSON.stringify(settings)
      });
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  }

  // Initialize with default data if empty
  async initializeDefaultData(): Promise<void> {
    const employees = await this.getEmployees();
    if (employees.length === 0) {
      const defaultEmployees: Employee[] = [
        { id: '1', name: 'Sarah Johnson', pin: '1234', role: 'manager', position: 'Manager', phone: '+62 812 3456 7890', hourlyRate: 25000, isActive: true },
        { id: '2', name: 'Mike Chen', pin: '5678', role: 'cashier', position: 'Cashier', phone: '+62 813 4567 8901', hourlyRate: 18000, isActive: true },
      ];
      await this.saveEmployees(defaultEmployees);
    }

    const inventory = await this.getInventory();
    if (inventory.length === 0) {
      const defaultInventory: InventoryItem[] = [
        { id: '1', name: 'Kue Lapis', category: 'Kue', stock: 45, unit: 'pcs', lowStockThreshold: 20, lastUpdated: new Date().toISOString().split('T')[0] },
        { id: '2', name: 'Kue Mangkok', category: 'Kue', stock: 15, unit: 'pcs', lowStockThreshold: 20, lastUpdated: new Date().toISOString().split('T')[0] },
        { id: '3', name: 'Lemper', category: 'Kue', stock: 35, unit: 'pcs', lowStockThreshold: 25, lastUpdated: new Date().toISOString().split('T')[0] },
        { id: '4', name: 'Pastel', category: 'Kue', stock: 18, unit: 'pcs', lowStockThreshold: 15, lastUpdated: new Date().toISOString().split('T')[0] },
        { id: '5', name: 'Wajik', category: 'Kue', stock: 12, unit: 'pcs', lowStockThreshold: 10, lastUpdated: new Date().toISOString().split('T')[0] },
        { id: '6', name: 'Bacang Ayam', category: 'Kue', stock: 25, unit: 'pcs', lowStockThreshold: 10, lastUpdated: new Date().toISOString().split('T')[0] },
        { id: '7', name: 'Bacang T. Asin', category: 'Kue', stock: 8, unit: 'pcs', lowStockThreshold: 15, lastUpdated: new Date().toISOString().split('T')[0] },
        { id: '8', name: 'Bakwan', category: 'Kue', stock: 24, unit: 'pcs', lowStockThreshold: 20, lastUpdated: new Date().toISOString().split('T')[0] },
        { id: '9', name: 'Bakwan Udang', category: 'Kue', stock: 18, unit: 'pcs', lowStockThreshold: 15, lastUpdated: new Date().toISOString().split('T')[0] },
        { id: '10', name: 'Kue Ku', category: 'Kue', stock: 9, unit: 'pcs', lowStockThreshold: 8, lastUpdated: new Date().toISOString().split('T')[0] },
        { id: '11', name: 'Paketku', category: 'Kue', stock: 450, unit: 'pcs', lowStockThreshold: 200, lastUpdated: new Date().toISOString().split('T')[0] },
        { id: '12', name: 'Risoles', category: 'Kue', stock: 180, unit: 'pcs', lowStockThreshold: 200, lastUpdated: new Date().toISOString().split('T')[0] },
      ];
      await this.saveInventory(defaultInventory);
    }
  }
}

// Export singleton instance
export const dbService = new DatabaseService();