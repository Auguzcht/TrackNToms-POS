// Function to standardize object keys to match DB field names
export const toDbFormat = (formData, entityType) => {
  // Standard mappings for common field name conversions
  const commonMappings = {
    phone: 'phone_number',
    isActive: 'is_active',
    cashierId: 'cashier_id',
    // Add other common mappings
  };
  
  // Entity-specific mappings
  const mappings = {
    staff: {
      ...commonMappings,
      // Any staff-specific mappings
    },
    supplier: {
      ...commonMappings,
      // Any supplier-specific mappings
    },
    // Add other entities
  };
  
  const currentMappings = mappings[entityType] || commonMappings;
  
  // Convert the form data to DB format
  const result = {};
  Object.entries(formData).forEach(([key, value]) => {
    // Use the mapping if it exists, otherwise keep the original key
    const dbKey = currentMappings[key] || key;
    result[dbKey] = value;
  });
  
  return result;
};

// Function to standardize DB field names to form field names
export const fromDbFormat = (dbData, entityType) => {
  // Inverse of the mappings in toDbFormat
  const commonMappings = {
    phone_number: 'phone',
    is_active: 'isActive',
    cashier_id: 'cashierId',
    // Add other common mappings
  };
  
  // Entity-specific mappings
  const mappings = {
    staff: {
      ...commonMappings,
      // Any staff-specific mappings
    },
    supplier: {
      ...commonMappings,
      // Any supplier-specific mappings
    },
    // Add other entities
  };
  
  const currentMappings = mappings[entityType] || commonMappings;
  
  // Convert the DB data to form format
  const result = {};
  Object.entries(dbData).forEach(([key, value]) => {
    // Use the mapping if it exists, otherwise keep the original key
    const formKey = currentMappings[key] || key;
    result[formKey] = value;
  });
  
  return result;
};