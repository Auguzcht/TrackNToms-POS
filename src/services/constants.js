// Application metadata
export const APP_NAME = 'TrackNToms POS';
export const APP_VERSION = '1.2.0';
export const APP_COPYRIGHT = '© 2023-2024 TrackNToms';

// Supabase connection constants
export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// UI configuration
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_DEBOUNCE_TIME = 300; // ms
export const ANIMATION_DURATION = 0.4; // seconds
export const THEME_COLOR = '#571C1F';
export const SECONDARY_COLOR = '#003B25';

// Storage limits and file types
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
export const IMAGE_DIMENSIONS = {
  thumbnail: { width: 100, height: 100 },
  small: { width: 300, height: 300 },
  medium: { width: 600, height: 600 },
  large: { width: 1200, height: 1200 }
};

// Local storage keys
export const AUTH_TOKEN_KEY = 'track_n_toms_auth_token';
export const AUTH_USER_KEY = 'track_n_toms_auth_user';
export const AUTH_EXPIRY_KEY = 'track_n_toms_auth_expiry';
export const THEME_PREFERENCE_KEY = 'track_n_toms_theme';
export const RECENT_ITEMS_KEY = 'track_n_toms_recent_items';
export const SAVED_CART_KEY = 'track_n_toms_saved_cart';

// Formatting constants
export const DATE_FORMAT = 'yyyy-MM-dd';
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
export const DISPLAY_DATE_FORMAT = 'MMM dd, yyyy';
export const DISPLAY_TIME_FORMAT = 'h:mm a';
export const CURRENCY_SYMBOL = '₱';
export const CURRENCY_CODE = 'PHP';
export const TAX_RATE = 0.12; // 12% VAT

// Table names - for Supabase queries and real-time subscriptions
export const TABLES = {
  STAFF: 'staff',
  ROLES: 'roles',
  ROLE_PERMISSIONS: 'role_permissions',
  INGREDIENTS: 'ingredients',
  ITEMS: 'items',
  ITEM_INGREDIENTS: 'item_ingredients',
  SALES_HEADER: 'sales_header',
  SALES_DETAIL: 'sales_detail',
  SUPPLIERS: 'suppliers',
  CONSIGNMENTS: 'consignments',
  CONSIGNMENT_ITEMS: 'consignment_items',
  PULLOUTS: 'pullouts',
  PURCHASES: 'purchases',
  PURCHASE_DETAILS: 'purchase_details'
};

// Permissions structure for role-based access control
export const PERMISSIONS = {
  DASHBOARD: {
    VIEW: 'dashboard.view'
  },
  SALES: {
    VIEW: 'sales.view',
    CREATE: 'sales.create',
    VOID: 'sales.void',
    REFUND: 'sales.refund',
    REPORTS: 'sales.reports'
  },
  INVENTORY: {
    VIEW: 'inventory.view',
    ADD: 'inventory.add',
    EDIT: 'inventory.edit',
    DELETE: 'inventory.delete',
    MANAGE_RECIPES: 'inventory.recipes'
  },
  SUPPLIERS: {
    VIEW: 'suppliers.view',
    ADD: 'suppliers.create',
    EDIT: 'suppliers.edit',
    DELETE: 'suppliers.delete',
    MANAGE: 'suppliers.manage' 
  },
  PURCHASES: {
    VIEW: 'purchases.view',
    CREATE: 'purchases.create',
    APPROVE: 'purchases.approve',
    DELETE: 'purchases.delete' 
  },
  PULLOUTS: {
    VIEW: 'pullouts.view',
    CREATE: 'pullouts.create',
    APPROVE: 'pullouts.approve',
    DELETE: 'pullouts.delete'
  },
  REPORTS: {
    SALES: 'reports.sales',
    INVENTORY: 'reports.inventory',
    FINANCIAL: 'reports.financial'
  },
  STAFF: {
    VIEW: 'staff.view',
    ADD: 'staff.add',
    EDIT: 'staff.edit',
    DELETE: 'staff.delete',
    MANAGE_ROLES: 'staff.roles'
  },
  SETTINGS: {
    VIEW: 'settings.view',
    EDIT: 'settings.edit'
  }
};

// User roles with default permissions
export const USER_ROLES = {
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
  STAFF: 'Staff',
  SUPPLIER: 'Supplier' // Add this line
};

// Status values for various entities
export const STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  VOIDED: 'Voided'
};

// Order/transaction status values
export const ORDER_STATUS = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  READY: 'Ready',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
  VOIDED: 'Voided'
};

// Payment methods
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'mobile_payment', label: 'GCash/Maya' },
  { value: 'bank_transfer', label: 'Bank Transfer' }
];

// Common units for inventory
export const UNITS = [
  { value: 'g', label: 'Grams (g)' },
  { value: 'kg', label: 'Kilograms (kg)' },
  { value: 'ml', label: 'Milliliters (ml)' },
  { value: 'l', label: 'Liters (l)' },
  { value: 'pcs', label: 'Pieces (pcs)' },
  { value: 'box', label: 'Box' },
  { value: 'pack', label: 'Pack' },
  { value: 'cup', label: 'Cup' },
  { value: 'tbsp', label: 'Tablespoon' },
  { value: 'tsp', label: 'Teaspoon' }
];

// Product categories specific to coffee shop/restaurant
export const PRODUCT_CATEGORIES = [
  { value: 'coffee', label: 'Coffee' },
  { value: 'tea', label: 'Tea' },
  { value: 'frappe', label: 'Frappe' },
  { value: 'smoothie', label: 'Smoothie' },
  { value: 'pastry', label: 'Pastry' },
  { value: 'sandwich', label: 'Sandwich' },
  { value: 'cake', label: 'Cake' },
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'snack', label: 'Snack' },
  { value: 'add_on', label: 'Add-on' }
];

// Ingredient categories
export const INGREDIENT_CATEGORIES = [
  { value: 'coffee_beans', label: 'Coffee Beans' },
  { value: 'tea_leaves', label: 'Tea Leaves' },
  { value: 'milk', label: 'Milk & Dairy' },
  { value: 'syrup', label: 'Syrups' },
  { value: 'powder', label: 'Powders' },
  { value: 'fruit', label: 'Fruits' },
  { value: 'vegetable', label: 'Vegetables' },
  { value: 'bread', label: 'Bread & Pastry' },
  { value: 'meat', label: 'Meat' },
  { value: 'condiment', label: 'Condiments' },
  { value: 'topping', label: 'Toppings' },
  { value: 'packaging', label: 'Packaging' },
  { value: 'other', label: 'Other' }
];

// Date range presets for reports
export const DATE_RANGE_PRESETS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'thisWeek', label: 'This Week' },
  { id: 'lastWeek', label: 'Last Week' },
  { id: 'thisMonth', label: 'This Month' },
  { id: 'lastMonth', label: 'Last Month' },
  { id: 'last30Days', label: 'Last 30 Days' },
  { id: 'last90Days', label: 'Last 90 Days' },
  { id: 'thisYear', label: 'This Year' },
  { id: 'custom', label: 'Custom Range' }
];

// Report types
export const REPORT_TYPES = [
  { id: 'sales', label: 'Sales Report' },
  { id: 'inventory', label: 'Inventory Report' },
  { id: 'financial', label: 'Financial Report' },
  { id: 'staff', label: 'Staff Performance' },
  { id: 'products', label: 'Product Analysis' }
];

// Export formats
export const EXPORT_FORMATS = [
  { id: 'csv', label: 'CSV' },
  { id: 'pdf', label: 'PDF' },
  { id: 'excel', label: 'Excel' }
];

// Storage paths for Supabase storage
export const STORAGE_PATHS = {
  STAFF_IMAGES: 'staff',
  PRODUCT_IMAGES: 'products',
  INGREDIENT_IMAGES: 'ingredients',
  SUPPLIER_LOGOS: 'suppliers',
  RECEIPTS: 'receipts',
  EXPORTS: 'exports',
  BACKUPS: 'backups'
};

// Error messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  AUTH_REQUIRED: 'You must be logged in to perform this action.',
  PERMISSION_DENIED: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  NETWORK: 'Network error. Please check your connection and try again.',
  LOW_INVENTORY: 'Not enough inventory to complete this action.',
  DUPLICATE: 'This record already exists in the system.'
};

// Chart color schemes
export const CHART_COLORS = {
  PRIMARY: [
    'rgba(87, 28, 31, 0.9)',
    'rgba(87, 28, 31, 0.7)',
    'rgba(87, 28, 31, 0.5)',
    'rgba(87, 28, 31, 0.3)'
  ],
  SECONDARY: [
    'rgba(0, 59, 37, 0.9)',
    'rgba(0, 59, 37, 0.7)',
    'rgba(0, 59, 37, 0.5)',
    'rgba(0, 59, 37, 0.3)'
  ],
  CATEGORY: [
    'rgba(87, 28, 31, 0.8)',
    'rgba(0, 59, 37, 0.8)',
    'rgba(59, 130, 246, 0.8)',
    'rgba(249, 115, 22, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(234, 179, 8, 0.8)'
  ]
};