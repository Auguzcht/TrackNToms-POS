export const toDbFormat = (formData) => {
  const result = {};
  Object.keys(formData).forEach(key => {
    // Convert camelCase to snake_case if needed
    const dbKey = key.replace(/([A-Z])/g, "_$1").toLowerCase();
    result[dbKey] = formData[key];
  });
  return result;
};

export const fromDbFormat = (dbData) => {
  const result = {};
  Object.keys(dbData).forEach(key => {
    // Convert snake_case to camelCase
    const formKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    result[formKey] = dbData[key];
  });
  return result;
};