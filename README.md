<div align="center">
  <img src="src/assets/TomNToms-Logo-1.png" alt="TrackNToms Logo" width="300"/>
  <p><em>Advanced Point-of-Sale and Inventory Management System for Tom N Toms Coffee in Davao City</em></p>
</div>

# TrackNToms

## 🎯 Overview
TrackNToms is a comprehensive point-of-sale and inventory management system tailor-made for Tom N Toms Coffee located in Davao City, Philippines. The system seamlessly integrates sales processing with inventory tracking, creating an efficient workflow that automatically updates stock levels when products are sold. Designed with both staff and management in mind, TrackNToms offers an intuitive interface combined with powerful backend capabilities.

## ⚡ Key Features
- **Intelligent POS Terminal**: Process orders and track sales in real-time
- **Ingredient-based Inventory**: Automatic stock deduction based on recipes
- **Supplier Management**: Track consignments, deliveries, and returns
- **Staff Controls**: Role-based access and performance monitoring
- **Financial Reporting**: Comprehensive analytics and sales metrics
- **Customizable Menu**: Easily update products and pricing
- **Multi-payment Integration**: Support for cash, cards, and mobile payments

## 🔧 Technical Implementation
Built with modern web technologies:

- React frontend with Tailwind CSS for responsive design
- Node.js and Express for robust API functionality
- MySQL database for reliable data persistence
- JWT authentication for secure access control
- Real-time inventory updates and alerts

## 🎨 System Modules
- Dashboard (Key metrics and alerts)
- POS Terminal (Sales processing)
- Inventory (Stock management)
- Suppliers (Vendor coordination)
- Staff (Employee management)
- Reports (Business analytics)
- Settings (System configuration)

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL Server
- npm or yarn package manager
- Vite for development server

### Installation Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/Auguzcht/TrackNToms-POS.git
   cd TrackNToms-POS
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   # Copy .env.example to .env
   cp .env.example .env
   # Update database credentials and other settings
   ```

4. Start the API server:
   ```bash
   node src/server/index.js
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Access the application:
   - Web Connection: http://localhost:5173
   - API Connection: http://localhost:3000

## 📝 Database Schema
```
graph LR
    ITEMS[items] --> ITEM_INGREDIENTS[item_ingredients]
    INGREDIENTS[ingredients] --> ITEM_INGREDIENTS
    ITEMS --> SALES_DETAIL[sales_detail]
    SALES_HEADER[sales_header] --> SALES_DETAIL
    STAFF[staff] --> SALES_HEADER
    STAFF --> MANAGERS[managers]
    SUPPLIERS[suppliers] --> CONSIGNMENTS[consignments]
    INGREDIENTS --> CONSIGNMENTS
```

## 🔄 System Workflow
```
graph TD
    A[Customer Orders] --> B[POS Terminal]
    B --> C[Process Sale]
    C --> D{Payment Complete?}
    D -->|Yes| E[Generate Receipt]
    D -->|No| B
    E --> F[Update Sales Records]
    F --> G[Deduct Ingredients]
    G --> H{Stock Below Threshold?}
    H -->|Yes| I[Generate Alert]
    H -->|No| J[Ready for Next Sale]
    
    K[Supplier Delivers] --> L[Record Consignment]
    L --> M[Update Inventory]
    M --> N[Pay Supplier]
    
    style A fill:#f9a8d4,stroke:#333
    style B fill:#a5f3fc,stroke:#333
    style C fill:#a5f3fc,stroke:#333
    style D fill:#fde68a,stroke:#333
    style E fill:#a5f3fc,stroke:#333
    style F fill:#a5f3fc,stroke:#333
    style G fill:#a5f3fc,stroke:#333
    style H fill:#fde68a,stroke:#333
    style I fill:#fca5a5,stroke:#333
    style J fill:#bbf7d0,stroke:#333
    style K fill:#f9a8d4,stroke:#333
    style L fill:#a5f3fc,stroke:#333
    style M fill:#a5f3fc,stroke:#333
    style N fill:#bbf7d0,stroke:#333
```

## 📊 Usage Examples

### POS Terminal
```javascript
// Add items to order
orderContext.addItem({
  item_id: 1,
  item_name: "Espresso",
  price: 3.50,
  quantity: 1
});

// Process payment
await orderContext.processPayment({
  method: "cash",
  amount: 5.00,
  change: 1.50
});
```

### Inventory Management
```javascript
// Check ingredient availability
const availability = await inventory.checkAvailability(itemId, quantity);
if (availability.available) {
  // Proceed with order
} else {
  // Show out of stock message
}

// Update stock levels after delivery
await inventory.updateStock(ingredientId, deliveredQuantity);
```

## 🛠️ Development

### Project Structure
```
TrackNToms-POS/
├── src/
│   ├── components/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── inventory/
│   │   ├── pos/
│   │   ├── reports/
│   │   ├── staff/
│   │   └── suppliers/
│   ├── context/
│   ├── hooks/
│   ├── pages/
│   ├── server/
│   │   ├── routes/
│   │   └── index.js
│   └── services/
├── public/
└── configs/
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `node src/server/index.js` - Run API server

## 🧪 Testing
```bash
# Run all tests
npm run test

# Run specific test suite
npm run test:inventory
```

## 📱 Local Customizations
- **Philippine Peso Support**: Currency formatting and tax calculations
- **Davao City Suppliers**: Pre-configured with local vendor information
- **Filipino Language Support**: Interface translations for staff comfort
- **Regional Tax Compliance**: BIR-compliant tax reporting
- **Local Payment Methods**: GCash, Maya, and other Philippine options

## 🤝 Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📈 Implementation Status

| Module | Status | Completion |
|--------|--------|------------|
| POS Terminal | ✅ Complete | 100% |
| Inventory Management | ✅ Complete | 100% |
| Supplier Management | ✅ Complete | 95% |
| Staff Management | 🟡 In Progress | 80% |
| Reporting | 🟡 In Progress | 75% |
| Mobile Optimization | ⚪ Planned | 20% |

## 👥 Team
- **Joshua Famor** - Project Lead & Database Architect
- **Alfred Nodado** - Full-Stack Developer and Systems Administrator
- **Hanna Sato** - UI/UX Designer and Research Lead

## 🙏 Acknowledgments
- Tom N Toms Coffee Davao Management for business requirements
- Mapúa Malayan Colleges Mindanao and CCIS Department
- React and Node.js development communities
- All contributors and testers who provided feedback

## 📋 Tech Stack
- **Frontend**: React 18, Tailwind CSS, Framer Motion, React Router 6, Chart.js
- **Backend**: Node.js, Express, JWT, Multer, Sharp
- **Database**: MySQL, MariaDB compatible
- **Development**: Vite, ESLint, Git

<div align="center">
  <p>Developed for CS107 - Information Management</p>
  <p>Mapúa Malayan Colleges Mindanao, Davao City</p>
  <p>© 2025 TrackNToms</p>
</div>