export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.trackntoms.com/api' 
  : 'http://localhost:3000/api';

export const APP_NAME = 'TrackNToms POS';
export const APP_VERSION = '1.0.0';

// Default pagination
export const DEFAULT_PAGE_SIZE = 10;

// Image dimensions
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

// Local storage keys
export const AUTH_TOKEN_KEY = 'track_n_toms_auth_token';
export const AUTH_USER_KEY = 'track_n_toms_auth_user';
export const AUTH_EXPIRY_KEY = 'track_n_toms_auth_expiry';

// Application Constants
export const DATE_FORMAT = 'yyyy-MM-dd';
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
export const CURRENCY_SYMBOL = '₱';

// User Roles
export const USER_ROLES = {
  MANAGER: 'Manager',
  CASHIER: 'Cashier',
};

// Status Values
export const STATUS = {
  ACTIVE: 'Active',
  INACTIVE: 'Inactive',
  PENDING: 'Pending',
};

// Order Status Values
export const ORDER_STATUS = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

// Payment Methods
export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'mobile_payment', label: 'Mobile Payment' },
];

// Firebase Storage Paths
export const STORAGE_PATHS = {
  STAFF_IMAGES: 'TrackNToms/staff',
  PRODUCT_IMAGES: 'TrackNToms/products',
  INGREDIENT_IMAGES: 'TrackNToms/ingredients',
  SUPPLIER_LOGOS: 'TrackNToms/suppliers',
};