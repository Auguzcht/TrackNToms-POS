import { useState, useEffect } from 'react';
import Button from '../common/Button';
import { useInventory } from '../../hooks/useInventory';
import { useSuppliers } from '../../hooks/useSuppliers';
import supabase from '../../services/supabase.js';
import Swal from 'sweetalert2';
import FileUpload from '../common/FileUpload';
import { motion } from 'framer-motion';
import placeholderImage from '../../assets/placeholder-image2.png';

const IngredientForm = ({ ingredient = null, onSave = () => {}, onCancel = () => {}, viewOnly = false }) => {
  const { addIngredient, updateIngredient, getIngredientSuppliers, setPreferredSupplier } = useInventory();
  const { suppliers, fetchSuppliers } = useSuppliers();
  const [loading, setLoading] = useState(false);
  const [loadingSuppliers, setLoadingSuppliers] = useState(false);
  const [supplierDetails, setSupplierDetails] = useState([]);
  
  const [form, setForm] = useState({
    name: '',
    unit: '',
    quantity: '',
    minimum_quantity: '',
    unit_cost: '',
    image: ''
    // Remove description from here
  });

  // Add a separate state for selected supplier
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePath, setImagePath] = useState('');
  
  // Load suppliers when component mounts
  useEffect(() => {
    fetchSuppliers();
    
    // If viewing/editing an ingredient, fetch its suppliers
    if (ingredient?.ingredient_id) {
      loadSupplierDetails(ingredient.ingredient_id);
    }
  }, [ingredient]);
  
  // Function to load supplier details for an ingredient
  const loadSupplierDetails = async (ingredientId) => {
    setLoadingSuppliers(true);
    try {
      const data = await getIngredientSuppliers(ingredientId);
      setSupplierDetails(data || []);
      
      // If there's a preferred supplier, select it in the dropdown
      const preferredSupplier = data?.find(s => s.is_preferred);
      if (preferredSupplier) {
        setSelectedSupplierId(preferredSupplier.supplier_id.toString());
      }
    } catch (error) {
      console.error('Error loading supplier details:', error);
    } finally {
      setLoadingSuppliers(false);
    }
  };
  
  // Set form data if editing an existing ingredient
  useEffect(() => {
    if (ingredient) {
      setForm({
        name: ingredient.name || '',
        unit: ingredient.unit || '',
        quantity: ingredient.quantity || '',
        minimum_quantity: ingredient.minimum_quantity || '',
        unit_cost: ingredient.unit_cost || '',
        image: ingredient.image || ''
        // Remove description from here
      });
      setImageUrl(ingredient.image || '');
    }
  }, [ingredient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };
  
  // Separate handler for supplier selection
  const handleSupplierChange = (e) => {
    const value = e.target.value;
    setSelectedSupplierId(value);
    
    // If we're removing a supplier (setting to empty), confirm first
    if (!value && ingredient?.ingredient_id) {
      Swal.fire({
        title: 'Remove Preferred Supplier?',
        text: "Are you sure you want to remove the preferred supplier for this ingredient?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#571C1F',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, remove it',
        cancelButtonText: 'Cancel'
      }).then((result) => {
        if (result.isConfirmed) {
          // Proceed with removing preferred supplier
          removePreferredSupplier(ingredient.ingredient_id);
        } else {
          // User canceled, restore the previous selection
          const preferredSupplier = supplierDetails.find(s => s.is_preferred);
          if (preferredSupplier) {
            setSelectedSupplierId(preferredSupplier.supplier_id.toString());
          }
        }
      });
    }
  };

  // Function to remove preferred supplier
  const removePreferredSupplier = async (ingredientId) => {
    try {
      // Update all suppliers for this ingredient to non-preferred
      await supabase
        .from('ingredient_suppliers')
        .update({ is_preferred: false })
        .eq('ingredient_id', ingredientId);
      
      // Refresh supplier data
      await loadSupplierDetails(ingredientId);
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Preferred supplier removed successfully'
      });
    } catch (error) {
      console.error('Error removing preferred supplier:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to remove preferred supplier'
      });
    }
  };

  const validateForm = () => {
    if (!form.name) return "Name is required";
    if (!form.unit) return "Unit is required";
    if (!form.quantity) return "Quantity is required";
    if (parseFloat(form.quantity) < 0) return "Quantity must be positive";
    if (!form.minimum_quantity) return "Minimum quantity is required";
    if (parseFloat(form.minimum_quantity) < 0) return "Minimum quantity must be positive";
    if (!form.unit_cost) return "Unit cost is required";
    if (parseFloat(form.unit_cost) <= 0) return "Unit cost must be greater than zero";
    return null;
  };

  // Handle preferred supplier selection
  const handleSetPreferredSupplier = async (supplierId) => {
    if (!ingredient?.ingredient_id) return;
    
    try {
      await setPreferredSupplier(ingredient.ingredient_id, supplierId);
      
      // Refresh supplier data
      await loadSupplierDetails(ingredient.ingredient_id);
      
      // Update the selected supplier in the dropdown
      setSelectedSupplierId(supplierId.toString());
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Preferred supplier updated successfully',
        timer: 2000,
        showConfirmButton: false
      });
    } catch (error) {
      console.error('Error setting preferred supplier:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to update preferred supplier'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const error = validateForm();
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Validation Error',
        text: error
      });
      return;
    }

    setLoading(true);
    
    try {
      const ingredientData = {
        ...form,
        quantity: parseFloat(form.quantity),
        minimum_quantity: parseFloat(form.minimum_quantity),
        unit_cost: parseFloat(form.unit_cost),
        image: imageUrl || form.image
      };

      let result;
      if (ingredient) {
        result = await updateIngredient(ingredient.ingredient_id, ingredientData);
        
        // Handle supplier association if needed
        if (selectedSupplierId) {
          try {
            await createIngredientSupplierAssociation(
              ingredient.ingredient_id, 
              parseInt(selectedSupplierId),
              parseFloat(form.unit_cost)
            );
          } catch (err) {
            console.error('Error associating supplier:', err);
          }
        }
        
        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Ingredient updated successfully',
          timer: 1500,
          showConfirmButton: false
        });
        
        // Call onSave with the result - ONLY ONCE
        onSave(result);
      } else {
        result = await addIngredient(ingredientData);
        
        // Handle supplier association if needed
        if (selectedSupplierId && result?.ingredient_id) {
          try {
            await createIngredientSupplierAssociation(
              result.ingredient_id, 
              parseInt(selectedSupplierId),
              parseFloat(form.unit_cost)
            );
          } catch (err) {
            console.error('Error associating supplier:', err);
          }
        }
        
        // Show success message
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Ingredient added successfully',
          timer: 1500,
          showConfirmButton: false
        });
        
        // Call onSave with the result - ONLY ONCE
        onSave(result);
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'An error occurred while saving'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImageUploadComplete = (result) => {
    setImageUrl(result.url);
    setImagePath(result.path);
  };

  const handleImageUploadError = (error) => {
    Swal.fire({
      icon: 'error',
      title: 'Error',
      text: `Failed to upload image: ${error.message}`
    });
  };

  const handleImageDelete = () => {
    setImageUrl('');
    setForm(prev => ({ ...prev, image: '' }));
  };

  // Function to create/update association between ingredient and supplier
  const createIngredientSupplierAssociation = async (ingredientId, supplierId, price) => {
    try {
      // First check if the association already exists
      const { data: existingAssoc, error: checkError } = await supabase
        .from('ingredient_suppliers')
        .select('*')
        .eq('ingredient_id', ingredientId)
        .eq('supplier_id', supplierId)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is the code for "not found"
        console.error("Error checking for existing supplier association:", checkError);
        throw checkError;
      }
      
      if (existingAssoc) {
        // Update the existing association
        const { error: updateError } = await supabase
          .from('ingredient_suppliers')
          .update({
            is_preferred: true, // Make this the preferred supplier
            typical_price: price,
            updated_at: new Date().toISOString()
          })
          .eq('ingredient_id', ingredientId)
          .eq('supplier_id', supplierId);
        
        if (updateError) {
          console.error("Error updating supplier association:", updateError);
          throw updateError;
        }
      } else {
        // Create new association
        const { error: insertError } = await supabase
          .from('ingredient_suppliers')
          .insert({
            ingredient_id: ingredientId,
            supplier_id: supplierId,
            is_preferred: true, // Make this the preferred supplier
            typical_price: price,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        
        if (insertError) {
          console.error("Error creating supplier association:", insertError);
          throw insertError;
        }
      }
        
      // Then unset other preferred suppliers for this ingredient
      const { error: unsetError } = await supabase
        .from('ingredient_suppliers')
        .update({ is_preferred: false })
        .eq('ingredient_id', ingredientId)
        .neq('supplier_id', supplierId);
      
      if (unsetError) {
        console.error("Error updating other supplier preferences:", unsetError);
        // Don't throw here, as the main operation succeeded
      }
    } catch (error) {
      console.error('Error managing supplier association:', error);
      throw error;
    }
  };

  // If in view mode, render the view-only version
  if (viewOnly && ingredient) {
    return (
      <div className="w-full overflow-visible">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
          {/* Left column - Image */}
          <div className="lg:col-span-1 h-full">
            <motion.div 
              className="bg-white rounded-lg border border-[#571C1F]/10 p-6 shadow-sm h-full flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex-grow flex flex-col items-center justify-center">
                <div className="w-40 h-40 rounded-full border border-[#571C1F]/10 overflow-hidden bg-white mb-4 shadow-sm">
                  <img 
                    src={ingredient.image || placeholderImage}
                    alt={ingredient.name}
                    className="h-40 w-40 object-cover"
                    onError={(e) => { 
                      e.target.src = placeholderImage; 
                      e.target.onerror = null;
                    }}
                  />
                </div>
                <h2 className="text-xl font-bold text-[#571C1F]">{ingredient.name}</h2>
                <span className="text-sm text-gray-500">{ingredient.unit}</span>
              </div>
            </motion.div>
          </div>
          
          {/* Right column - Details */}
          <div className="lg:col-span-2 h-full">
            <motion.div 
              className="bg-white rounded-lg border border-[#571C1F]/10 p-6 shadow-sm h-full flex flex-col"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <div className="space-y-4 flex-grow">
                {/* Inventory Information */}
                <div className="bg-white p-4 rounded-lg border border-[#571C1F]/10 shadow-sm">
                  <h4 className="text-sm font-medium text-[#571C1F] mb-3 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    Inventory Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-2 bg-[#FFF6F2]/50 rounded border border-[#571C1F]/10">
                      <span className="text-xs text-gray-500 block mb-1">Current Stock</span>
                      <p className="font-medium text-[#571C1F]">{ingredient.quantity} {ingredient.unit}</p>
                    </div>
                    <div className="p-2 bg-[#FFF6F2]/50 rounded border border-[#571C1F]/10">
                      <span className="text-xs text-gray-500 block mb-1">Minimum Stock</span>
                      <p className="font-medium text-[#571C1F]">{ingredient.minimum_quantity} {ingredient.unit}</p>
                    </div>
                    <div className="p-2 bg-[#FFF6F2]/50 rounded border border-[#571C1F]/10">
                      <span className="text-xs text-gray-500 block mb-1">Unit Cost</span>
                      <p className="font-medium text-[#571C1F]">₱{parseFloat(ingredient.unit_cost).toFixed(2)}</p>
                    </div>
                    <div className="p-2 bg-[#FFF6F2]/50 rounded border border-[#571C1F]/10">
                      <span className="text-xs text-gray-500 block mb-1">Total Value</span>
                      <p className="font-medium text-[#571C1F]">
                        ₱{(ingredient.unit_cost * ingredient.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Supplier Information */}
                <div className="bg-white p-4 rounded-lg border border-[#571C1F]/10 shadow-sm">
                  <h4 className="text-sm font-medium text-[#571C1F] mb-4 flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    Supplier Information
                  </h4>
                  
                  {loadingSuppliers ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#571C1F]"></div>
                    </div>
                  ) : supplierDetails.length === 0 ? (
                    <div className="text-center py-6 bg-[#FFF6F2]/50 rounded-lg border border-[#571C1F]/10">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-600 font-medium">No suppliers associated with this ingredient</p>
                      <p className="text-xs mt-1 text-gray-500">Add suppliers through the Purchase Order system</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {supplierDetails.map(supplier => (
                        <div
                          key={supplier.supplier_id}
                          className="p-3 bg-[#FFF6F2]/50 border border-[#571C1F]/10 rounded-md shadow-sm flex items-center justify-between hover:bg-[#FFF6F2] transition-colors"
                        >
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full border border-[#571C1F]/10 overflow-hidden bg-white">
                              <img
                                src={supplier.suppliers?.logo || placeholderImage}
                                alt={supplier.suppliers?.company_name}
                                className="h-10 w-10 rounded-full object-cover"
                                onError={(e) => { 
                                  e.target.src = placeholderImage; 
                                  e.target.onerror = null;
                                }}
                              />
                            </div>
                            <div className="ml-3">
                              <div className="font-medium text-[#571C1F]">
                                {supplier.suppliers?.company_name}
                                {supplier.is_preferred && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                    Preferred
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-600 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Typical price: ₱{(supplier.typical_price || 0).toFixed(2)}
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => handleSetPreferredSupplier(supplier.supplier_id)}
                            className={`px-3 py-1.5 text-xs rounded-md ${
                              supplier.is_preferred
                                ? "bg-green-100 text-green-800 cursor-default"
                                : "bg-gray-100 text-gray-700 hover:bg-[#571C1F]/10 hover:text-[#571C1F]"
                            }`}
                            disabled={supplier.is_preferred}
                          >
                            {supplier.is_preferred ? "Preferred" : "Set as Preferred"}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Description - only if available */}
                {ingredient.description && (
                  <div className="bg-white p-4 rounded-lg border border-[#571C1F]/10 shadow-sm">
                    <h4 className="text-sm font-medium text-[#571C1F] mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                      Description
                    </h4>
                    <p className="text-sm text-gray-700">{ingredient.description}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  // Otherwise render the editable form
  return (
    <div className="max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 011 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                {ingredient 
                  ? "Update inventory ingredient details including stock levels, cost, and supplier information" 
                  : "Create a new inventory ingredient with details such as stock levels, cost, and preferred suppliers"
                }
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            {/* Image Section */}
            <div className="lg:col-span-1 h-full">
              <motion.div 
                className="bg-white rounded-lg border border-[#571C1F]/10 p-6 shadow-sm h-full flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <h3 className="text-lg font-medium text-[#571C1F] mb-4">
                  Ingredient Image
                </h3>
                
                <div className="flex-grow flex flex-col">
                  <FileUpload
                    category="ingredients"
                    onUploadComplete={handleImageUploadComplete}
                    onUploadError={handleImageUploadError}
                    onDeleteComplete={handleImageDelete}
                    accept="image/jpeg,image/png,image/gif"
                    maxSize={2}
                    initialPreview={imageUrl || form.image}
                    previewClass="w-full h-60 object-contain rounded-md"
                    alt={form.name || "Ingredient image"}
                    className="w-full mb-3 flex-grow"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-auto text-center">
                  Upload a clear image of the ingredient
                </p>
              </motion.div>
            </div>
            
            {/* Ingredient Details */}
            <div className="lg:col-span-2 h-full">
              <motion.div 
                className="bg-white rounded-lg border border-[#571C1F]/10 p-6 shadow-sm h-full flex flex-col"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <h3 className="text-lg font-medium text-[#571C1F] mb-4">
                  Ingredient Details
                </h3>
                
                <div className="space-y-4 flex-grow">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-[#571C1F] mb-1">
                      Name *
                    </label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F]"
                      placeholder="e.g. Coffee Beans"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                      <label htmlFor="quantity" className="block text-sm font-medium text-[#571C1F] mb-1">
                        Current Stock *
                      </label>
                      <div className="flex rounded-md shadow-sm">
                        <input
                          id="quantity"
                          name="quantity"
                          type="number"
                          step="0.01"
                          value={form.quantity}
                          onChange={handleChange}
                          className="flex-grow px-3 py-2 border border-r-0 border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F]"
                          placeholder="e.g. 10.5"
                        />
                        <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-md">
                          {form.unit || 'units'}
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="unit" className="block text-sm font-medium text-[#571C1F] mb-1">
                        Unit of Measure *
                      </label>
                      <select
                        id="unit"
                        name="unit"
                        value={form.unit}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F]"
                      >
                        <option value="" disabled>Select a unit</option>
                        <option value="kg">Kilogram (kg)</option>
                        <option value="g">Gram (g)</option>
                        <option value="l">Liter (l)</option>
                        <option value="ml">Milliliter (ml)</option>
                        <option value="pcs">Pieces (pcs)</option>
                        <option value="pack">Pack</option>
                        <option value="box">Box</option>
                        <option value="bottle">Bottle</option>
                        <option value="cup">Cup</option>
                        <option value="tbsp">Tablespoon (tbsp)</option>
                        <option value="tsp">Teaspoon (tsp)</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                      <label htmlFor="minimum_quantity" className="block text-sm font-medium text-[#571C1F] mb-1">
                        Reorder Level *
                      </label>
                      <div className="flex rounded-md shadow-sm">
                        <input
                          id="minimum_quantity"
                          name="minimum_quantity"
                          type="number"
                          step="0.01"
                          value={form.minimum_quantity}
                          onChange={handleChange}
                          className="flex-grow px-3 py-2 border border-r-0 border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F]"
                          placeholder="e.g. 2.0"
                        />
                        <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 bg-gray-50 text-gray-500 rounded-r-md">
                          {form.unit || 'units'}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Alert will be shown when stock falls below this level
                      </p>
                    </div>
                    
                    <div>
                      <label htmlFor="unit_cost" className="block text-sm font-medium text-[#571C1F] mb-1">
                        Unit Cost (₱) *
                      </label>
                      <div className="flex rounded-md shadow-sm">
                        <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 bg-gray-50 text-gray-500 rounded-l-md">
                          ₱
                        </span>
                        <input
                          id="unit_cost"
                          name="unit_cost"
                          type="number"
                          step="0.01"
                          value={form.unit_cost}
                          onChange={handleChange}
                          className="flex-grow px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F]"
                          placeholder="e.g. 100.00"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Supplier Selection with improved handling */}
                  <div>
                    <label htmlFor="supplier_id" className="block text-sm font-medium text-[#571C1F] mb-1">
                      Primary Supplier
                    </label>
                    <select
                      id="supplier_id"
                      name="supplier_id"
                      value={selectedSupplierId}
                      onChange={handleSupplierChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#571C1F] focus:border-[#571C1F]"
                    >
                      <option value="">Select a supplier</option>
                      {suppliers && suppliers.map(supplier => (
                        <option key={supplier.supplier_id} value={supplier.supplier_id}>
                          {supplier.company_name || supplier.supplier_name}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      This supplier will be set as the preferred supplier for this ingredient
                    </p>
                  </div>
                  
                  {/* Display Existing Supplier Associations (when editing) */}
                  {ingredient && ingredient.ingredient_id && supplierDetails.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-[#571C1F] mb-2">
                        Associated Suppliers
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-[#571C1F]/10 rounded-md p-2">
                        {loadingSuppliers ? (
                          <div className="flex justify-center py-4">
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#571C1F]"></div>
                          </div>
                        ) : (
                          supplierDetails.map(supplier => (
                            <div key={supplier.supplier_id} className="flex items-center justify-between p-2 bg-[#FFF6F2]/50 rounded-md">
                              <div className="flex items-center">
                                <div className="text-sm font-medium text-[#571C1F]">{supplier.suppliers?.company_name}</div>
                                {supplier.is_preferred && (
                                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                                    Preferred
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500">₱{supplier.typical_price?.toFixed(2) || '0.00'}</div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
          
          <motion.div 
            className="flex justify-end space-x-3 pt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </span>
              ) : (
                ingredient ? 'Update Ingredient' : 'Add Ingredient'
              )}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
};

export default IngredientForm;