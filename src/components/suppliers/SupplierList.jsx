import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import Button from '../common/Button';
import Card from '../common/Card';
import Modal from '../common/Modal';
import placeholderImage from '../../assets/placeholder-image.png';

const SupplierList = ({ 
  suppliers = [], 
  loading = false, 
  onEdit = () => {}, 
  onDelete = () => {}, 
  onRefresh = () => {}, 
  canManage = true,
  onAdd = () => {} // Add this prop
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
    
    // Text search filter - updated to match database field names
    if (searchTerm) {
      const lowercasedSearch = searchTerm.toLowerCase();
      result = result.filter(supplier => 
        supplier.supplier_name?.toLowerCase().includes(lowercasedSearch) || 
        supplier.contact_person?.toLowerCase().includes(lowercasedSearch) ||
        supplier.supplier_email?.toLowerCase().includes(lowercasedSearch) ||
        supplier.supplier_contact?.toLowerCase().includes(lowercasedSearch)
      );
    }
    
    // Status filter - updated to use is_active instead of isActive
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      result = result.filter(supplier => 
        (supplier.is_active === 1) === isActive || 
        supplier.status === (isActive ? 'Active' : 'Inactive')
      );
    }

    // Apply sorting - updated to match database field names
    if (sortConfig.key) {
      result.sort((a, b) => {
        // Map frontend keys to database field names
        const keyMap = {
          'contactPerson': 'contact_person',
          'isActive': 'is_active'
        };
        
        // Use mapped key if available
        const dbKey = keyMap[sortConfig.key] || sortConfig.key;
        
        // Helper function to get property value safely
        const getValue = (obj, key) => obj[key] === undefined ? '' : obj[key];
        
        let aValue = getValue(a, dbKey);
        let bValue = getValue(b, dbKey); 
        
        // Convert to strings for text comparison
        if (typeof aValue === 'string') {
          aValue = aValue.toLowerCase();
        }
        
        if (typeof bValue === 'string') {
          bValue = bValue.toLowerCase();
        }
        
        // Handle special case for is_active (numeric to boolean conversion)
        if (dbKey === 'is_active') {
          aValue = aValue === 1 || aValue === '1' || aValue === true;
          bValue = bValue === 1 || bValue === '1' || bValue === true;
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
                    onClick={() => onAdd()} // Change from onEdit(null) to onAdd()
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
                      className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider"
                    >
                      Connected Staff
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
                      {/* Supplier name cell (unchanged) */}
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full border border-[#571C1F]/10 overflow-hidden bg-[#FFF6F2]">
                            <ImageWithFallback 
                              src={supplier.logo}
                              alt={supplier.company_name || supplier.supplier_name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          </div>
                          <div className="ml-3">
                            <div className="font-medium text-[#571C1F]">{supplier.company_name || supplier.supplier_name || 'No Name'}</div>
                            {supplier.website && (
                              <div className="text-xs text-gray-500 truncate max-w-xs">
                                {supplier.website}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* Updated cells to use consistent field names */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-600 font-medium">
                        {supplier.contact_person || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-600">
                          {supplier.contact_email && (
                            <div className="mb-1 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#571C1F]/70 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              <span>{supplier.contact_email}</span>
                            </div>
                          )}
                          {supplier.contact_phone && (
                            <div className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[#571C1F]/70 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span>{supplier.contact_phone}</span>
                            </div>
                          )}
                          {!supplier.contact_email && !supplier.contact_phone && '-'}
                        </div>
                      </td>
                      
                      {/* Status cell with improved detection */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          (supplier.is_active === 1 || supplier.is_active === true)
                            ? 'bg-[#003B25]/10 border border-[#003B25]/20 text-[#003B25]' 
                            : 'bg-[#571C1F]/10 border border-[#571C1F]/20 text-[#571C1F]'
                        }`}>
                          <span className={`w-1.5 h-1.5 ${(supplier.is_active === 1 || supplier.is_active === true) ? 'bg-[#003B25]' : 'bg-[#571C1F]'} rounded-full mr-1`}></span>
                          {(supplier.is_active === 1 || supplier.is_active === true) ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      
                      {/* Connected staff cell with enhanced info */}
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          {supplier.user_id ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
                              </svg>
                              {supplier.connected_staff ? supplier.connected_staff : 'Staff Connected'}
                            </span>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">No staff linked</span>
                          )}
                        </div>
                      </td>
                      
                      {/* Actions cell (unchanged) */}
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
        title={
          selectedSupplier && (
            <div className="flex items-center">
              <div className="flex-shrink-0 h-8 w-8 rounded-full overflow-hidden bg-[#FFF6F2] mr-3">
                <ImageWithFallback 
                  src={selectedSupplier.logo}
                  alt={selectedSupplier.supplier_name}
                  className="h-8 w-8 object-cover"
                />
              </div>
              <span className="text-white">
                {selectedSupplier?.supplier_name || selectedSupplier?.company_name || "Supplier Details"}
              </span>
            </div>
          )
        }
        size="3xl"
        variant="primary"
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
                variant="primary"
                onClick={() => {
                  setShowDetailsModal(false);
                  onEdit(selectedSupplier?.id || selectedSupplier?.supplier_id);
                }}
                className="inline-flex items-center" // Changed from "flex items-center space-x-2" to "inline-flex items-center"
              >
                Edit Supplier
              </Button>
            )}
          </>
        }
      >
        {selectedSupplier && (
          <div className="space-y-8">
            {/* Basic Information - Added rounded-lg for subtle borders */}
            <div className="bg-[#571C1F]/5 p-5 rounded-lg border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-white/20 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Basic Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 flex flex-col items-center justify-center">
                  <div className="w-32 h-32 rounded-full border border-white/20 overflow-hidden mb-3">
                    <ImageWithFallback 
                      src={selectedSupplier.logo}
                      alt={selectedSupplier.supplier_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Improved status badge with higher contrast */}
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    (selectedSupplier.is_active === 1 || selectedSupplier.is_active === true)
                      ? 'bg-[#003B25]/20 border border-[#003B25]/40 text-[#25D366]' // Brighter green text
                      : 'bg-[#571C1F]/20 border border-[#571C1F]/40 text-[#FF6B6B]' // Brighter red text
                  }`}>
                    <span className={`w-2.5 h-2.5 ${(selectedSupplier.is_active === 1 || selectedSupplier.is_active === true) 
                      ? 'bg-[#25D366]' 
                      : 'bg-[#FF6B6B]'} rounded-full mr-2`}></span>
                    {(selectedSupplier.is_active === 1 || selectedSupplier.is_active === true) ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="col-span-2 grid grid-cols-2 gap-x-6 gap-y-4">
                  <div>
                    <p className="text-sm font-medium text-white mb-1">Supplier Name</p>
                    <p className="text-base text-white/90">{selectedSupplier.company_name || selectedSupplier.supplier_name || '—'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-white mb-1">Contact Person</p>
                    <p className="text-base text-white/90">{selectedSupplier.contact_person || '—'}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-white mb-1">Email</p>
                    {selectedSupplier.supplier_email || selectedSupplier.contact_email ? (
                      <a href={`mailto:${selectedSupplier.supplier_email || selectedSupplier.contact_email}`} className="text-[#FF9F81] hover:underline">
                        {selectedSupplier.supplier_email || selectedSupplier.contact_email}
                      </a>
                    ) : <p className="text-base text-white/90">—</p>}
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-white mb-1">Phone</p>
                    {selectedSupplier.supplier_contact || selectedSupplier.contact_phone ? (
                      <a href={`tel:${selectedSupplier.supplier_contact || selectedSupplier.contact_phone}`} className="text-[#FF9F81] hover:underline">
                        {selectedSupplier.supplier_contact || selectedSupplier.contact_phone}
                      </a>
                    ) : <p className="text-base text-white/90">—</p>}
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-white mb-1">Website</p>
                    {selectedSupplier.website ? (
                      <a 
                        href={selectedSupplier.website.startsWith('http') ? selectedSupplier.website : `https://${selectedSupplier.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#FF9F81] hover:underline"
                      >
                        {selectedSupplier.website}
                      </a>
                    ) : <p className="text-base text-white/90">—</p>}
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-white mb-1">Payment Terms</p>
                    <p className="text-base text-white/90">{selectedSupplier.payment_terms || '—'}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Address Information - Added rounded-lg for subtle borders */}
            <div className="bg-[#571C1F]/5 p-5 rounded-lg border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-white/20 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Address Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-3">
                  <p className="text-sm font-medium text-white mb-1">Street Address</p>
                  <p className="text-base text-white/90">{selectedSupplier.address || '—'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-white mb-1">City</p>
                  <p className="text-base text-white/90">{selectedSupplier.city || '—'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-white mb-1">State/Province</p>
                  <p className="text-base text-white/90">{selectedSupplier.state || '—'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-white mb-1">Postal Code</p>
                  <p className="text-base text-white/90">{selectedSupplier.postal_code || selectedSupplier.postalCode || '—'}</p>
                </div>
                
                <div className="col-span-3">
                  <p className="text-sm font-medium text-white mb-1">Country</p>
                  <p className="text-base text-white/90">{selectedSupplier.country || '—'}</p>
                </div>
                
                {(selectedSupplier.address || selectedSupplier.city) && (
                  <div className="col-span-3">
                    <a 
                      href={`https://maps.google.com/?q=${encodeURIComponent(
                        `${selectedSupplier.address || ''}, ${selectedSupplier.city || ''}, ${selectedSupplier.state || ''} ${selectedSupplier.postal_code || selectedSupplier.postalCode || ''}, ${selectedSupplier.country || ''}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-[#FF9F81] hover:underline mt-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      View on Google Maps
                    </a>
                  </div>
                )}
              </div>
            </div>
            
            {/* Staff Connection - Added rounded-lg for subtle borders */}
            {selectedSupplier.user_id && (
              <div className="bg-[#571C1F]/5 p-5 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-white/20 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Connected Staff Account
                </h3>
                
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-12 w-12 bg-blue-600/30 rounded-full flex items-center justify-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  
                  <div>
                    <p className="font-medium text-lg text-white">
                      {selectedSupplier.connected_staff || "Staff Account Connected"}
                    </p>
                    {selectedSupplier.staff && selectedSupplier.staff.email && (
                      <p className="text-blue-300">{selectedSupplier.staff.email}</p>
                    )}
                    <p className="text-sm mt-1 text-white/80">
                      This supplier's inventory can be managed through their staff account login
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Notes - Added rounded-lg for subtle borders */}
            {selectedSupplier.notes && (
              <div className="bg-[#571C1F]/5 p-5 rounded-lg border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4 pb-2 border-b border-white/20 flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Notes
                </h3>
                
                <div className="whitespace-pre-line text-white/90">
                  {selectedSupplier.notes}
                </div>
              </div>
            )}
            
            {/* Footer info - Removed section divider, using just a subtle line */}
            <div className="flex justify-between text-xs text-white/60 pt-4 border-t border-white/10">
              <div>
                {selectedSupplier.supplier_id && (
                  <span>ID: {selectedSupplier.supplier_id}</span>
                )}
              </div>
              <div>
                {selectedSupplier.updated_at && (
                  <span>Last updated: {format(new Date(selectedSupplier.updated_at), 'MMM d, yyyy')}</span>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SupplierList;