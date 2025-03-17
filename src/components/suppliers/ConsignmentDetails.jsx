// src/components/suppliers/ConsignmentDetails.jsx
import React from 'react';
import Button from '../common/Button';
import { format } from 'date-fns';

const ConsignmentDetails = ({ consignment, onEdit, onClose }) => {
  // Update the totalAmount calculation to use the total from DB
  const totalAmount = Number(consignment.total || 0);

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

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Basic Info */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Invoice Number</h3>
            <p className="mt-1 text-base text-gray-900 dark:text-white">{consignment.invoice_number || '-'}</p>
          </div>

          {consignment.reference_number && (
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Reference Number</h3>
              <p className="mt-1 text-base text-gray-900 dark:text-white">{consignment.reference_number}</p>
            </div>
          )}

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Supplier</h3>
            <p className="mt-1 text-base text-gray-900 dark:text-white">{consignment.supplier_name || `Supplier #${consignment.supplier_id}`}</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Date Received</h3>
            <p className="mt-1 text-base text-gray-900 dark:text-white">{formatDate(consignment.date)}</p>
          </div>

          {/* Add Manager ID if needed */}
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Manager ID</h3>
            <p className="mt-1 text-base text-gray-900 dark:text-white">{consignment.manager_id || '-'}</p>
          </div>
        </div>

        {/* Right Column: Payment Info */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Amount</h3>
            <p className="mt-1 text-base text-gray-900 dark:text-white">{formatCurrency(totalAmount)}</p>
          </div>
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
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Production Date</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Unit Price</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subtotal</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {consignment.items?.map((item, index) => (
                <tr key={`${item.consignment_id}-${item.item_id}`}>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">{item.item_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-center">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-center">
                    {formatDate(item.production_date)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                    {formatCurrency(item.supplier_price)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
                    {formatCurrency(item.usa_total)}
                  </td>
                </tr>
              ))}
              
              {/* Total row */}
              <tr className="bg-gray-50 dark:bg-gray-800 font-medium">
                <td colSpan="4" className="px-4 py-3 text-sm text-gray-900 dark:text-white text-right">
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

      {/* Actions */}
      <div className="flex justify-end space-x-4 pt-4">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={() => onEdit(consignment.consignment_id)}>
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