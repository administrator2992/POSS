import React, { useState, useEffect } from 'react';
import { dbService, Employee, InventoryItem, Transaction } from './DatabaseService';

const DatabaseTest: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [testStatus, setTestStatus] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const empData = await dbService.getEmployees();
      const invData = await dbService.getInventory();
      const transData = await dbService.getTransactions();
      
      setEmployees(empData);
      setInventory(invData);
      setTransactions(transData);
      setTestStatus('Data loaded successfully');
    } catch (error) {
      setTestStatus('Error loading data: ' + error);
    }
  };

  const addTestEmployee = async () => {
    try {
      const newEmployee: Employee = {
        id: Date.now().toString(),
        name: 'Test Employee',
        pin: '9999',
        role: 'cashier',
        position: 'Tester',
        phone: '+62 812 3456 789',
        hourlyRate: 20000,
        isActive: true
      };
      
      await dbService.addEmployee(newEmployee);
      await loadData();
      setTestStatus('Employee added successfully');
    } catch (error) {
      setTestStatus('Error adding employee: ' + error);
    }
  };

  const addTestInventory = async () => {
    try {
      const newItem: InventoryItem = {
        id: Date.now().toString(),
        name: 'Test Item',
        category: 'Test',
        stock: 10,
        unit: 'pcs',
        lowStockThreshold: 5,
        lastUpdated: new Date().toISOString().split('T')[0]
      };
      
      await dbService.addInventoryItem(newItem);
      await loadData();
      setTestStatus('Inventory item added successfully');
    } catch (error) {
      setTestStatus('Error adding inventory item: ' + error);
    }
  };

  const addTestTransaction = async () => {
    try {
      const newTransaction: Transaction = {
        id: Date.now().toString(),
        orderId: 'TEST-' + Date.now(),
        items: [
          {
            id: '1',
            name: 'Test Product',
            price: 15000,
            quantity: 2
          }
        ],
        subtotal: 30000,
        discount: 0,
        tax: 3000,
        total: 33000,
        timestamp: new Date().toISOString(),
        cashier: 'Test Cashier'
      };
      
      await dbService.addTransaction(newTransaction);
      await loadData();
      setTestStatus('Transaction added successfully');
    } catch (error) {
      setTestStatus('Error adding transaction: ' + error);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Database Service Test</h1>
      
      <div className="mb-4 p-4 bg-orange-100 rounded">
        <p className="text-orange-800">{testStatus}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <button 
          onClick={addTestEmployee}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Add Test Employee
        </button>
        <button 
          onClick={addTestInventory}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
        >
          Add Test Inventory
        </button>
        <button 
          onClick={addTestTransaction}
          className="px-4 py-2 bg-brown-600 text-white rounded hover:bg-brown-700"
        >
          Add Test Transaction
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-3">Employees ({employees.length})</h2>
          <div className="max-h-60 overflow-auto">
            {employees.map(emp => (
              <div key={emp.id} className="mb-2 p-2 bg-gray-50 rounded">
                <p className="font-medium">{emp.name}</p>
                <p className="text-sm text-gray-600">Role: {emp.role}</p>
                <p className="text-sm text-gray-600">PIN: {emp.pin}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-3">Inventory ({inventory.length})</h2>
          <div className="max-h-60 overflow-auto">
            {inventory.map(item => (
              <div key={item.id} className="mb-2 p-2 bg-gray-50 rounded">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-600">Category: {item.category}</p>
                <p className="text-sm text-gray-600">Stock: {item.stock} {item.unit}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="border rounded p-4">
          <h2 className="text-xl font-semibold mb-3">Transactions ({transactions.length})</h2>
          <div className="max-h-60 overflow-auto">
            {transactions.map(trans => (
              <div key={trans.id} className="mb-2 p-2 bg-gray-50 rounded">
                <p className="font-medium">Order: {trans.orderId}</p>
                <p className="text-sm text-gray-600">Total: Rp {trans.total.toLocaleString('id-ID')}</p>
                <p className="text-sm text-gray-600">Cashier: {trans.cashier}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <button 
          onClick={loadData}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          Refresh Data
        </button>
      </div>
    </div>
  );
};

export default DatabaseTest;