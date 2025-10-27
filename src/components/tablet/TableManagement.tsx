import { useState } from 'react';
import { Users, Clock } from 'lucide-react';

interface TableManagementProps {
  onSelectTable: (tableNumber: number) => void;
}

type TableStatus = 'available' | 'seated' | 'bill-printed';

interface Table {
  number: number;
  status: TableStatus;
  guests?: number;
  timeSeated?: string;
}

const INITIAL_TABLES: Table[] = [
  { number: 1, status: 'available' },
  { number: 2, status: 'seated', guests: 4, timeSeated: '12:30 PM' },
  { number: 3, status: 'available' },
  { number: 4, status: 'bill-printed', guests: 2, timeSeated: '1:15 PM' },
  { number: 5, status: 'available' },
  { number: 6, status: 'seated', guests: 6, timeSeated: '1:00 PM' },
  { number: 7, status: 'available' },
  { number: 8, status: 'available' },
  { number: 9, status: 'seated', guests: 2, timeSeated: '12:45 PM' },
  { number: 10, status: 'available' },
  { number: 11, status: 'available' },
  { number: 12, status: 'available' },
];

export function TableManagement({ onSelectTable }: TableManagementProps) {
  const [tables] = useState<Table[]>(INITIAL_TABLES);
  const [filterStatus, setFilterStatus] = useState<TableStatus | 'all'>('all');

  const filteredTables = filterStatus === 'all' 
    ? tables 
    : tables.filter(table => table.status === filterStatus);

  const getTableColor = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'bg-orange-100 border-orange-300 hover:border-orange-500';
      case 'seated':
        return 'bg-orange-100 border-orange-300 hover:border-orange-500';
      case 'bill-printed':
        return 'bg-brown-100 border-brown-300 hover:border-brown-500';
    }
  };

  const getStatusLabel = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'Available';
      case 'seated':
        return 'Seated';
      case 'bill-printed':
        return 'Bill Printed';
    }
  };

  const getStatusColor = (status: TableStatus) => {
    switch (status) {
      case 'available':
        return 'text-orange-700';
      case 'seated':
        return 'text-orange-700';
      case 'bill-printed':
        return 'text-brown-700';
    }
  };

  const availableCount = tables.filter(t => t.status === 'available').length;
  const seatedCount = tables.filter(t => t.status === 'seated').length;
  const billPrintedCount = tables.filter(t => t.status === 'bill-printed').length;

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <h1 className="text-gray-900 mb-6">Table Management</h1>
        
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-orange-600 mb-1">Available</div>
            <div className="text-orange-900">{availableCount} Tables</div>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="text-orange-600 mb-1">Seated</div>
            <div className="text-orange-900">{seatedCount} Tables</div>
          </div>
          <div className="bg-brown-50 border border-brown-200 rounded-lg p-4">
            <div className="text-brown-600 mb-1">Bill Printed</div>
            <div className="text-brown-900">{billPrintedCount} Tables</div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === 'all'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Tables
          </button>
          <button
            onClick={() => setFilterStatus('available')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === 'available'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Available
          </button>
          <button
            onClick={() => setFilterStatus('seated')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === 'seated'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Seated
          </button>
          <button
            onClick={() => setFilterStatus('bill-printed')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filterStatus === 'bill-printed'
                ? 'bg-orange-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Bill Printed
          </button>
        </div>
      </div>

      {/* Table Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-4 gap-6">
          {filteredTables.map(table => (
            <button
              key={table.number}
              onClick={() => onSelectTable(table.number)}
              className={`aspect-square rounded-xl border-2 transition-all p-6 flex flex-col items-center justify-center ${getTableColor(table.status)}`}
            >
              <div className="text-gray-900 mb-2">Table {table.number}</div>
              <div className={`mb-4 ${getStatusColor(table.status)}`}>
                {getStatusLabel(table.status)}
              </div>
              {table.guests && (
                <div className="flex items-center gap-2 text-gray-600 mb-2">
                  <Users className="w-4 h-4" />
                  <span>{table.guests} guests</span>
                </div>
              )}
              {table.timeSeated && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Clock className="w-4 h-4" />
                  <span>{table.timeSeated}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
