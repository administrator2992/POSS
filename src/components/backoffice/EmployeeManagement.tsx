import { useState, useEffect } from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { dbService, Employee } from '../../services/DatabaseService';

export function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    const loadEmployees = async () => {
      const storedEmployees = await dbService.getEmployees();
      setEmployees(storedEmployees);
    };
    
    loadEmployees();
  }, []);

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (employee.position && employee.position.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (employee.phone && employee.phone.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleAddEmployee = async (employee: Omit<Employee, 'id'>) => {
    const newEmployee: Employee = {
      ...employee,
      id: Date.now().toString(),
    };
    await dbService.addEmployee(newEmployee);
    const updatedEmployees = await dbService.getEmployees();
    setEmployees(updatedEmployees);
    toast.success('Karyawan berhasil ditambahkan');
    setShowAddModal(false);
  };

  const handleUpdateEmployee = async (updatedEmployee: Employee) => {
    await dbService.updateEmployee(updatedEmployee);
    const updatedEmployees = await dbService.getEmployees();
    setEmployees(updatedEmployees);
    toast.success('Karyawan berhasil diperbarui');
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = async (id: string) => {
    await dbService.deleteEmployee(id);
    const updatedEmployees = await dbService.getEmployees();
    setEmployees(updatedEmployees);
    toast.success('Karyawan berhasil dihapus');
  };

  const toggleEmployeeStatus = async (id: string) => {
    const employee = employees.find(emp => emp.id === id);
    if (employee) {
      const updatedEmployee = { ...employee, isActive: !employee.isActive };
      await dbService.updateEmployee(updatedEmployee);
      const updatedEmployees = await dbService.getEmployees();
      setEmployees(updatedEmployees);
      toast.success('Status karyawan berhasil diperbarui');
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-gray-900 mb-2">Employee Management</h1>
            <p className="text-gray-600">Manage your team members and their permissions</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
        </div>

        {/* Employee List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Employee</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Position</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Phone</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Hourly Rate</th>
                  <th className="text-left py-4 px-6 font-medium text-gray-900">Status</th>
                  <th className="text-right py-4 px-6 font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900">{employee.name}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-gray-600">{employee.position || ''}</td>
                    <td className="py-4 px-6 text-gray-600">{employee.phone || ''}</td>
                    <td className="py-4 px-6 text-gray-900">
                      {employee.hourlyRate ? new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(employee.hourlyRate) : ''}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        employee.isActive !== false
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditingEmployee(employee)}
                          className="p-2 text-gray-400 hover:text-orange-600 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleEmployeeStatus(employee.id)}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            employee.isActive !== false
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                          }`}
                        >
                          {employee.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Employee Modal */}
        {(showAddModal || editingEmployee) && (
          <EmployeeModal
            employee={editingEmployee}
            onSave={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
            onClose={() => {
              setShowAddModal(false);
              setEditingEmployee(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

interface EmployeeModalProps {
  employee: Employee | null;
  onSave: (employee: Employee) => void;
  onClose: () => void;
}

function EmployeeModal({ employee, onSave, onClose }: EmployeeModalProps) {
  const [formData, setFormData] = useState<Omit<Employee, 'id'> & { id?: string }>(
    employee || {
      name: '',
      pin: '',
      role: 'cashier',
      position: '',
      phone: '',
      hourlyRate: 0,
      isActive: true,
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (employee) {
      onSave({ ...formData, id: employee.id } as Employee);
    } else {
      const newEmployee: Employee = {
        ...(formData as Omit<Employee, 'id'>),
        id: Date.now().toString(),
      };
      onSave(newEmployee);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <input
                type="text"
                required
                value={formData.position || ''}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                required
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hourly Rate (IDR)
              </label>
              <input
                type="number"
                required
                min="0"
                step="1000"
                value={formData.hourlyRate || ''}
                onChange={(e) => setFormData({ ...formData, hourlyRate: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>
            
            <div className="flex items-center justify-between pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                {employee ? 'Update' : 'Add'} Employee
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}