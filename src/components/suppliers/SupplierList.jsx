import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Button from '../common/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';
import placeholderImage from '../../assets/placeholder-image2.png';

const SupplierList = ({ 
  suppliers = [], 
  loading = false, 
  onEdit = () => {}, 
  onDelete = () => {}, 
  onRefresh = () => {}, 
  canManage = true 
}) => {
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'supplier_name', direction: 'ascending' });
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState({});

  // Handle sort click
  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // Get sort indicator
  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    
    return (
      <motion.span 
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        className="ml-1 text-xs text-white inline-block" // Changed from text-[#571C1F] to text-white
      >
        {sortConfig.direction === 'ascending' ? '↑' : '↓'}
      </motion.span>
    );
  };

  // Image component with fallback
  const ImageWithFallback = ({ src, alt, className }) => {
    return (
      <div className={`overflow-hidden ${className}`}>
        <img 
          src={src || placeholderImage}
          alt={alt}
          onError={(e) => {
            e.target.onerror = null; 
            e.target.src = placeholderImage;
          }}
          className="h-full w-full object-cover"
        />
      </div>
    );
  };

  // Filter and sort suppliers when dependencies change
  useEffect(() => {
    if (!suppliers) return;

    // Apply filters
    let result = [...suppliers];
    
    // Text search filter - updated to use supplier_name instead of name
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      result = result.filter(supplier => 
        supplier.supplier_name?.toLowerCase().includes(lowercasedSearch) || 
        supplier.contactPerson?.toLowerCase().includes(lowercasedSearch) ||
        supplier.supplier_email?.toLowerCase().includes(lowercasedSearch) ||
        supplier.phone?.toLowerCase().includes(lowercasedSearch)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      result = result.filter(supplier => 
        supplier.isActive === isActive || 
        supplier.status === (isActive ? 'Active' : 'Inactive')
      );
    }

    // Apply sorting - updated keys to match actual supplier properties
    if (sortConfig.key) {
      result.sort((a, b) => {
        // Helper function to get property value safely
        const getValue = (obj, key) => obj[key] === undefined ? '' : obj[key];
        
        let aValue = getValue(a, sortConfig.key);
        let bValue = getValue(b, sortConfig.key); 
        
        // Convert to strings for text comparison
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
        }
        
        if (typeof bValue === 'string') {
          bValue = bValue.toLowerCase();
        }
        
        // Handle special case for isActive
        if (sortConfig.key === 'isActive') {
          if (a.isActive === undefined && a.status !== undefined) {
            aValue = a.status === 'Active';
          }
          if (b.isActive === undefined && b.status !== undefined) {
            bValue = b.status === 'Active';
          }
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredSuppliers(result);
  }, [suppliers, searchTerm, statusFilter, sortConfig]);

  // Handle view supplier details
  const handleViewSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setShowDetailsModal(true);
  };

  return (
    <div className="flex flex-col">
      {/* Filters in a flex row */}
      <div className="flex flex-wrap gap-4 mb-4 items-center">
        <div className="relative rounded-md shadow-sm max-w-xs flex-grow sm:flex-grow-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-10 py-2 border border-[#571C1F]/20 rounded-md focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          {searchTerm && (
            <div className="absolute inset-y-0 right-0 flex items-center pr-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSearchTerm('')}
                className="text-gray-400 hover:text-[#571C1F] focus:outline-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>
          )}
        </div>

        <select
          className="block pl-3 pr-10 py-2 border border-[#571C1F]/20 rounded-md focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F] dark:bg-gray-700 dark:border-gray-600 dark:text-white w-40"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          style={{ height: '42px' }} // Explicitly set height to match the search input
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Enhanced table container with subtle shadow */}
      <div className="overflow-x-auto">
        <div className="align-middle inline-block min-w-full">
          <div className="overflow-hidden border border-[#571C1F]/10 rounded-lg shadow-md">
            {loading ? (
              // Loading state
              <div className="px-6 py-4">
                <div className="animate-pulse space-y-4">
                  {Array(5).fill(0).map((_, index) => (
                    <div key={index} className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                      </div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredSuppliers.length === 0 ? (
              // Empty state
              <div className="text-center py-10">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 100, delay: 0.1 }}
                  className="p-3 bg-[#FFF6F2] rounded-md border border-[#571C1F]/20 shadow-md mb-3 inline-flex"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#571C1F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </motion.div>
                <p className="text-[#571C1F] font-medium">No suppliers found</p>
                {searchTerm || statusFilter !== 'all' ? (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="mt-2 text-[#571C1F] hover:text-[#571C1F]/80 font-medium px-3 py-1 rounded-md border border-[#571C1F]/30 hover:border-[#571C1F]/50 transition-all"
                  >
                    Clear filters
                  </motion.button>
                ) : canManage && (
                  <Button 
                    variant="primary"
                    size="sm"
                    className="mt-3"
                    onClick={() => onEdit(null)}
                  >
                    Add Your First Supplier
                  </Button>
                )}
              </div>
            ) : (
              // Supplier list table
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-[#571C1F] text-white">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('supplier_name')}
                    >
                      <div className="flex items-center">
                        <span>Supplier</span>
                        {getSortIndicator('supplier_name')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('contactPerson')}
                    >
                      <div className="flex items-center">
                        <span>Contact Person</span>
                        {getSortIndicator('contactPerson')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider"
                    >
                      Email/Phone
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('isActive')}
                    >
                      <div className="flex items-center">
                        <span>Status</span>
                        {getSortIndicator('isActive')}
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-6 py-3 text-right text-xs font-semibold text-white uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-dark-lighter divide-y divide-[#571C1F]/10 dark:divide-gray-700">
                  {filteredSuppliers.map((supplier, index) => (
                    <motion.tr 
                      key={supplier.id || supplier.supplier_id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className="bg-white hover:bg-[#FFF6F2] dark:bg-dark-lighter dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                      onClick={() => handleViewSupplier(supplier)}
                    >
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full border border-[#571C1F]/10 overflow-hidden bg-[#FFF6F2]">
                            <ImageWithFallback 
                              src={supplier.logo}
                              alt={supplier.supplier_name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          </div>
                          <div className="ml-3">
                            <div className="font-medium text-[#571C1F]">{supplier.supplier_name || 'No Name'}</div>
                            {supplier.website && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {supplier.website}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                        {supplier.contactPerson || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-600">
                          {supplier.supplier_email && (
                            <div className="mb-1 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#571C1F]/70 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>{supplier.supplier_email}</span>
                            </div>
                          )}
                          {(supplier.phone || supplier.supplier_contact) && (
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#571C1F]/70 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span>{supplier.phone || supplier.supplier_contact}</span>
                            </div>
                          )}
                          {!supplier.supplier_email && !supplier.phone && !supplier.supplier_contact && '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          (supplier.isActive || supplier.status === 'Active')
                            ? 'bg-[#003B25]/10 border border-[#003B25]/20 text-[#003B25]' 
                            : 'bg-[#571C1F]/10 border border-[#571C1F]/20 text-[#571C1F]'
                        }`}>
                          <span className={`w-1.5 h-1.5 ${(supplier.isActive || supplier.status === 'Active') ? 'bg-[#003B25]' : 'bg-[#571C1F]'} rounded-full mr-1`}></span>
                          {(supplier.isActive || supplier.status === 'Active') ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2" onClick={e => e.stopPropagation()}>
                          {canManage && (
                            <>
                              <motion.button
                                whileHover={{ scale: 1.05, y: -1 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-1.5 text-[#003B25] hover:text-[#003B25] hover:bg-[#003B25]/10 rounded-full transition"
                                aria-label="Edit supplier"
                                title="Edit"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEdit(supplier.id || supplier.supplier_id);
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </motion.button>
                              
                              <motion.button
                                whileHover={{ scale: 1.05, y: -1 }}
                                whileTap={{ scale: 0.95 }}
                                className="p-1.5 text-[#571C1F] hover:text-[#571C1F] hover:bg-[#571C1F]/10 rounded-full transition"
                                aria-label="Delete supplier"
                                title="Delete"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(supplier.id || supplier.supplier_id);
                                }}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </motion.button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Results count and search info */}
      {!loading && filteredSuppliers.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-xs flex items-center justify-between"
        >
          <span className="text-gray-800 dark:text-gray-600">
            Showing <span className="font-medium text-[#571C1F]">{filteredSuppliers.length}</span> of <span className="font-medium text-[#571C1F]">{suppliers.length}</span> suppliers
          </span>
          <span className="text-[#571C1F]/70">
            {searchTerm && `Search results for "${searchTerm}"`}
          </span>
        </motion.div>
      )}

      {/* Supplier Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Supplier Details"
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setShowDetailsModal(false)}
            >
              Close
            </Button>
            {canManage && (
              <Button
                onClick={() => {
                  setShowDetailsModal(false);
                  onEdit(selectedSupplier?.id || selectedSupplier?.supplier_id);
                }}
              >
                Edit Supplier
              </Button>
            )}
          </>
        }
      >
        {selectedSupplier && (
          <div className="space-y-6">
            {/* Basic Information Section */}
            <div>
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 h-16 w-16 rounded-full border border-[#571C1F]/10 overflow-hidden bg-[#FFF6F2] mr-4">
                  <ImageWithFallback 
                    src={selectedSupplier.logo}
                    alt={selectedSupplier.supplier_name}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-[#571C1F]">
                    {selectedSupplier.supplier_name || selectedSupplier.name}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    (selectedSupplier.isActive || selectedSupplier.status === 'Active')
                      ? 'bg-[#003B25]/10 border border-[#003B25]/20 text-[#003B25]' 
                      : 'bg-[#571C1F]/10 border border-[#571C1F]/20 text-[#571C1F]'
                  }`}>
                    <span className={`w-1.5 h-1.5 ${(selectedSupplier.isActive || selectedSupplier.status === 'Active') ? 'bg-[#003B25]' : 'bg-[#571C1F]'} rounded-full mr-1`}></span>
                    {(selectedSupplier.isActive || selectedSupplier.status === 'Active') ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-[#FFF6F2]/50 p-4 rounded-md">
                <div>
                  <p className="text-sm font-medium text-[#571C1F]/70">Contact Person</p>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedSupplier.contactPerson || '—'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-[#571C1F]/70">Payment Terms</p>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedSupplier.paymentTerms || '—'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-[#571C1F]/70">Email</p>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {selectedSupplier.supplier_email ? (
                      <a href={`mailto:${selectedSupplier.supplier_email}`} className="text-[#571C1F] hover:underline">
                        {selectedSupplier.supplier_email}
                      </a>
                    ) : '—'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-[#571C1F]/70">Phone</p>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {(selectedSupplier.phone || selectedSupplier.supplier_contact) ? (
                      <a href={`tel:${selectedSupplier.phone || selectedSupplier.supplier_contact}`} className="text-[#571C1F] hover:underline">
                        {selectedSupplier.phone || selectedSupplier.supplier_contact}
                      </a>
                    ) : '—'}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-[#571C1F]/70">Website</p>
                  <p className="mt-1 text-gray-900 dark:text-white">
                    {selectedSupplier.website ? (
                      <a 
                        href={selectedSupplier.website.startsWith('http') ? selectedSupplier.website : `https://${selectedSupplier.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#571C1F] hover:underline"
                      >
                        {selectedSupplier.website}
                      </a>
                    ) : '—'}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Address Information Section */}
            <div className="pt-4 border-t border-[#571C1F]/10">
              <h3 className="text-lg font-medium text-[#571C1F] mb-4">
                Address Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 bg-[#FFF6F2]/50 p-4 rounded-md">
                <div className="md:col-span-2">
                  <p className="text-sm font-medium text-[#571C1F]/70">Address</p>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedSupplier.address || '—'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-[#571C1F]/70">City</p>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedSupplier.city || '—'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-[#571C1F]/70">State/Province</p>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedSupplier.state || '—'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-[#571C1F]/70">Postal Code</p>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedSupplier.postalCode || '—'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-[#571C1F]/70">Country</p>
                  <p className="mt-1 text-gray-900 dark:text-white">{selectedSupplier.country || '—'}</p>
                </div>
              </div>
            </div>
            
            {/* Additional Information Section */}
            {selectedSupplier.notes && (
              <div className="pt-4 border-t border-[#571C1F]/10">
                <h3 className="text-lg font-medium text-[#571C1F] mb-4">
                  Notes
                </h3>
                <div className="bg-[#FFF6F2]/50 p-4 rounded-md">
                  <p className="text-gray-900 dark:text-white whitespace-pre-line">
                    {selectedSupplier.notes}
                  </p>
                </div>
              </div>
            )}
            
            {/* Last Updated Section */}
            {selectedSupplier.updatedAt && (
              <div className="text-xs text-gray-500 text-right mt-4">
                Last updated: {format(new Date(selectedSupplier.updatedAt), 'MMM d, yyyy')}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SupplierList;