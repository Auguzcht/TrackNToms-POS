// src/components/suppliers/ConsignmentDetails.jsx
import React from 'react';
import Button from '../common/Button';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

const ConsignmentDetails = ({ consignment, onEdit, onClose }) => {
  // Updated the totalAmount calculation to use the total from DB
  const totalAmount = Number(consignment.total || 0);

  // Helper function to get item name from various possible structures
  const getItemName = (item) => {
    if (!item) return 'Unknown Item';
    
    if (item.item_name) return item.item_name;
    if (item.items?.item_name) return item.items.item_name;
    if (item.item?.item_name) return item.item.item_name;
    
    return 'Unknown Item';
  };

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

  // Get status color classes
  const getStatusClasses = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-50 border border-green-200 text-green-700';
      case 'pending':
        return 'bg-yellow-50 border border-yellow-200 text-yellow-700';
      case 'cancelled':
        return 'bg-red-50 border border-red-200 text-red-700';
      default:
        return 'bg-gray-50 border border-gray-200 text-gray-700';
    }
  };

  // Format manager name (or show Not Approved if no manager)
  const getManagerName = () => {
    if (!consignment.manager_id) return 'Not Approved';
    
    // If manager_name exists, use that
    if (consignment.manager_name) return consignment.manager_name;
    
    // If staff property exists with first_name and last_name
    if (consignment.staff?.first_name && consignment.staff?.last_name) {
      return `${consignment.staff.first_name} ${consignment.staff.last_name}`;
    }
    
    // Fallback to a default format
    return `Manager #${consignment.manager_id}`;
  };

  return (
    <div className="space-y-6 w-full max-w-[95vw] mx-auto">
      {/* Header Section */}
      <div className="bg-[#FFF6F2] rounded-lg p-4 border border-[#571C1F]/10">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-xl font-semibold text-[#571C1F]">
              Invoice #{consignment.invoice_number || 'N/A'}
            </h2>
            {consignment.reference_number && (
              <p className="text-sm text-gray-600">Ref: {consignment.reference_number}</p>
            )}
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusClasses(consignment.status)}`}>
            {consignment.status || 'Pending'}
          </span>
        </div>
      </div>
      
      {/* Main Details Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Supplier & Date Info */}
        <motion.div 
          className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="font-medium text-gray-800 border-b pb-2 mb-4">Supplier Details</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Supplier:</span>
              <span className="text-sm font-medium text-gray-800">{consignment.supplier_name || `Supplier #${consignment.supplier_id}`}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Received Date:</span>
              <span className="text-sm font-medium text-gray-800">{formatDate(consignment.date)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Manager Approval:</span>
              <span className="text-sm font-medium text-gray-800">{getManagerName()}</span>
            </div>
          </div>
        </motion.div>
        
        {/* Right Column: Payment Info */}
        <motion.div 
          className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm"
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="font-medium text-gray-800 border-b pb-2 mb-4">Payment Summary</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Items:</span>
              <span className="text-sm font-medium text-gray-800">{consignment.items?.length || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Quantity:</span>
              <span className="text-sm font-medium text-gray-800">
                {consignment.items?.reduce((total, item) => total + Number(item.quantity || 0), 0)}
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium text-gray-700">Total Amount:</span>
              <span className="text-lg font-bold text-[#571C1F]">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Items Table - Improved spacing and layout without images */}
      <motion.div 
        className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden"
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="font-medium text-gray-800 p-4 bg-gray-50 border-b">Consignment Items</h3>
        <div className="overflow-x-auto w-full">
          <table className="w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-2/5">Item</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">Quantity</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-1/5">Production Date</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">Unit Price</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-1/8">Subtotal</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {consignment.items?.map((item, index) => (
                <tr key={`${item.consignment_id}-${item.item_id}`} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div>
                      <div className="font-medium">{getItemName(item)}</div>
                      {item.lotNumber && <div className="text-xs text-gray-500">Lot: {item.lotNumber}</div>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-center">
                    {item.quantity}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-center">
                    {formatDate(item.production_date)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">
                    {formatCurrency(item.supplier_price)}
                  </td>
                  <td className="px-6 py-4 text-sm text-[#571C1F] font-medium text-right">
                    {formatCurrency(item.usa_total)}
                  </td>
                </tr>
              ))}
              
              {/* Total row */}
              <tr className="bg-[#FFF6F2]">
                <td colSpan="4" className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                  Total
                </td>
                <td className="px-6 py-4 text-sm font-bold text-[#571C1F] text-right">
                  {formatCurrency(totalAmount)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div 
        className="flex justify-end space-x-4 pt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button onClick={() => onEdit(consignment.consignment_id)}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit Consignment
        </Button>
      </motion.div>
    </div>
  );
};

export default ConsignmentDetails;