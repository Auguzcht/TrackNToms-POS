// src/components/suppliers/ConsignmentDetails.jsx
import React from 'react';
import Button from '../common/Button';
import { format } from 'date-fns';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useEffect, useState } from 'react';

const ConsignmentDetails = ({ consignment, onEdit, onClose }) => {
  const { suppliers, fetchSuppliers } = useSuppliers();
  const [supplier, setSupplier] = useState(null);

  // Fetch supplier data when component mounts
  useEffect(() => {
    const getSupplier = async () => {
      if (consignment?.supplierId) {
        await fetchSuppliers();
        const supplierData = suppliers.find(s => s.id === consignment.supplierId);
        setSupplier(supplierData);
      }
    };
    
    getSupplier();
  }, [consignment, fetchSuppliers, suppliers]);

  // Format date with fallback
  const formatDate = (dateString, fallback = '-') => {
    if (!dateString) return fallback;
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return fallback;
    }
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount || 0);
  };

  if (!consignment) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500 dark:text-gray-400">Consignment data not available</p>
      </div>
    );
  }

  const totalAmount = consignment.items?.reduce((total, item) => {
    return total + (Number(item.quantity) * Number(item.unitPrice));
  }, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Basic Info */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Invoice Number</h3>
            <p className="mt-1 text-base text-gray-900 dark:text-white">{consignment.invoiceNumber || '-'}</p>
          </div>

          {consignment.referenceNumber && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Reference Number</h3>
              <p className="mt-1 text-base text-gray-900 dark:text-white">{consignment.referenceNumber}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Supplier</h3>
            <p className="mt-1 text-base text-gray-900 dark:text-white">{supplier?.name || `Supplier #${consignment.supplierId}`}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Date Received</h3>
            <p className="mt-1 text-base text-gray-900 dark:text-white">{formatDate(consignment.receivedDate)}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Received By</h3>
            <p className="mt-1 text-base text-gray-900 dark:text-white">{consignment.receivedBy || '-'}</p>
          </div>
        </div>

        {/* Right Column: Payment Info */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</h3>
            <p className="mt-1 text-base text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Status</h3>
            <div className="mt-1">
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                consignment.paymentStatus === 'paid' 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                  : consignment.paymentStatus === 'partial' 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {consignment.paymentStatus === 'paid' ? 'Paid' : 
                 consignment.paymentStatus === 'partial' ? 'Partial' : 'Unpaid'}
              </span>
            </div>
          </div>

          {consignment.dueDate && consignment.paymentStatus !== 'paid' && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Due Date</h3>
              <p className="mt-1 text-base text-gray-900 dark:text-white">{formatDate(consignment.dueDate)}</p>
            </div>
          )}

          {consignment.paymentMethod && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Method</h3>
              <p className="mt-1 text-base text-gray-900 dark:text-white">{consignment.paymentMethod}</p>
            </div>
          )}

          {consignment.paymentDate && consignment.paymentStatus === 'paid' && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Payment Date</h3>
              <p className="mt-1 text-base text-gray-900 dark:text-white">{formatDate(consignment.paymentDate)}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items Table */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Items</h3>
        <div className="overflow-x-auto border rounded-md dark:border-gray-700">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit Price</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subtotal</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {consignment.items?.map((item, index) => (
                <tr key={item.id || index}>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.itemName}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-center">
                    {item.quantity} {item.unit || ''}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                    {formatCurrency(item.subtotal || (item.quantity * item.unitPrice))}
                  </td>
                </tr>
              ))}
              
              {/* Total row */}
              <tr className="bg-gray-50 dark:bg-gray-800 font-medium">
                <td colSpan="3" className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                  Total
                </td>
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right font-medium">
                  {formatCurrency(totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes */}
      {consignment.notes && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</h3>
          <p className="mt-1 text-base text-gray-900 dark:text-white whitespace-pre-line">{consignment.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-4 pt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={onEdit}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </Button>
      </div>
    </div>
  );
};

export default ConsignmentDetails;