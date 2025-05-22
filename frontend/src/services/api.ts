
import { 
  Product, 
  Meal, 
  MealServing,
  Supplier,
  DeliveryLog,
  User,
  MonthlyReport,
  Unit,
  MealCategory,
  Allergen
} from '../types';

// Mock data for units
const units: Unit[] = [
  { id: 1, name: 'gram', abbreviation: 'g' },
  { id: 2, name: 'liter', abbreviation: 'l' },
  { id: 3, name: 'piece', abbreviation: 'pc' },
];

// Mock data for meal categories
const mealCategories: MealCategory[] = [
  { id: 1, name: 'Breakfast' },
  { id: 2, name: 'Lunch' },
  { id: 3, name: 'Snack' },
  { id: 4, name: 'Dinner' },
];

// Mock data for allergens
const allergens: Allergen[] = [
  { id: 1, name: 'Milk' },
  { id: 2, name: 'Eggs' },
  { id: 3, name: 'Peanuts' },
  { id: 4, name: 'Tree Nuts' },
  { id: 5, name: 'Fish' },
  { id: 6, name: 'Shellfish' },
  { id: 7, name: 'Wheat' },
  { id: 8, name: 'Soy' },
];

// Mock data for products
const products: Product[] = [
  { id: 1, name: 'Potatoes', totalWeight: 5000, unit: units[0], threshold: 1000, isActive: true },
  { id: 2, name: 'Carrots', totalWeight: 2000, unit: units[0], threshold: 500, isActive: true },
  { id: 3, name: 'Milk', totalWeight: 10000, unit: units[1], threshold: 2000, isActive: true },
  { id: 4, name: 'Chicken', totalWeight: 3000, unit: units[0], threshold: 1000, isActive: true },
  { id: 5, name: 'Rice', totalWeight: 8000, unit: units[0], threshold: 1500, isActive: true },
  { id: 6, name: 'Apples', totalWeight: 50, unit: units[2], threshold: 10, isActive: true },
];

// Mock data for meals
const meals: Meal[] = [
  { 
    id: 1, 
    name: 'Mashed Potatoes', 
    category: mealCategories[1], 
    isActive: true,
    ingredients: [
      { id: 1, product: products[0], quantity: 200 },
      { id: 2, product: products[2], quantity: 50 },
    ]
  },
  { 
    id: 2, 
    name: 'Chicken Rice', 
    category: mealCategories[1], 
    isActive: true,
    ingredients: [
      { id: 3, product: products[3], quantity: 100 },
      { id: 4, product: products[4], quantity: 150 },
    ]
  },
  { 
    id: 3, 
    name: 'Apple Snack', 
    category: mealCategories[2], 
    isActive: true,
    ingredients: [
      { id: 5, product: products[5], quantity: 1 },
    ]
  },
];

// Mock data for suppliers
const suppliers: Supplier[] = [
  { id: 1, name: 'Farm Fresh Produce', contactEmail: 'contact@farmfresh.com', phone: '555-1234', isActive: true },
  { id: 2, name: 'Dairy Delights', contactEmail: 'orders@dairydelights.com', phone: '555-5678', isActive: true },
  { id: 3, name: 'Meat Masters', contactEmail: 'info@meatmasters.com', phone: '555-9012', isActive: true },
];

// Mock data for users
const users: User[] = [
  { id: 1, username: 'admin', email: 'admin@kinder.com', role: { id: 1, name: 'admin' }, isActive: true },
  { id: 2, username: 'cook1', email: 'cook1@kinder.com', role: { id: 2, name: 'cook' }, isActive: true },
  { id: 3, username: 'manager1', email: 'manager1@kinder.com', role: { id: 3, name: 'manager' }, isActive: true },
];

// Mock data for meal servings
const mealServings: MealServing[] = [
  { 
    id: 1, 
    meal: meals[0], 
    user: users[1], 
    portionCount: 20, 
    servedAt: '2023-05-15T10:30:00Z',
    notes: 'Morning snack' 
  },
  { 
    id: 2, 
    meal: meals[1], 
    user: users[1], 
    portionCount: 25, 
    servedAt: '2023-05-15T12:00:00Z',
    notes: 'Lunch' 
  },
  { 
    id: 3, 
    meal: meals[2], 
    user: users[1], 
    portionCount: 30, 
    servedAt: '2023-05-15T15:30:00Z',
    notes: 'Afternoon snack' 
  },
];

// Mock data for delivery logs
const deliveryLogs: DeliveryLog[] = [
  {
    id: 1,
    product: products[0],
    supplier: suppliers[0],
    quantityReceived: 10000,
    deliveryDate: '2023-05-10',
    receivedAt: '2023-05-10T09:00:00Z',
    receivedBy: users[2],
    notes: 'Fresh delivery'
  },
  {
    id: 2,
    product: products[2],
    supplier: suppliers[1],
    quantityReceived: 15000,
    deliveryDate: '2023-05-12',
    receivedAt: '2023-05-12T10:15:00Z',
    receivedBy: users[2],
    notes: 'Monthly order'
  },
];

// Mock data for monthly reports
const monthlyReports: MonthlyReport[] = [
  {
    id: 1,
    meal: meals[0],
    monthYear: '2023-04',
    portionsServed: 500,
    portionsPossible: 550,
    discrepancyRate: 9.09,
    generatedAt: '2023-05-01T00:00:00Z'
  },
  {
    id: 2,
    meal: meals[1],
    monthYear: '2023-04',
    portionsServed: 480,
    portionsPossible: 600,
    discrepancyRate: 20.00,
    generatedAt: '2023-05-01T00:00:00Z'
  },
];

// API service
const API = {
  // Products
  getProducts: () => Promise.resolve(products),
  
  getProduct: (id: number) => {
    const product = products.find(p => p.id === id);
    return Promise.resolve(product);
  },
  
  addProduct: (product: Omit<Product, 'id'>) => {
    const newProduct = {
      ...product,
      id: Math.max(...products.map(p => p.id)) + 1
    };
    products.push(newProduct as Product);
    return Promise.resolve(newProduct);
  },
  
  updateProduct: (id: number, product: Partial<Product>) => {
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      products[index] = { ...products[index], ...product };
      return Promise.resolve(products[index]);
    }
    return Promise.reject(new Error('Product not found'));
  },
  
  deleteProduct: (id: number) => {
    const index = products.findIndex(p => p.id === id);
    if (index !== -1) {
      const product = products.splice(index, 1)[0];
      return Promise.resolve(product);
    }
    return Promise.reject(new Error('Product not found'));
  },

  // Meals
  getMeals: () => Promise.resolve(meals),
  
  getMeal: (id: number) => {
    const meal = meals.find(m => m.id === id);
    return Promise.resolve(meal);
  },
  
  addMeal: (meal: Omit<Meal, 'id'>) => {
    const newMeal = {
      ...meal,
      id: Math.max(...meals.map(m => m.id)) + 1
    };
    meals.push(newMeal as Meal);
    return Promise.resolve(newMeal);
  },
  
  updateMeal: (id: number, meal: Partial<Meal>) => {
    const index = meals.findIndex(m => m.id === id);
    if (index !== -1) {
      meals[index] = { ...meals[index], ...meal };
      return Promise.resolve(meals[index]);
    }
    return Promise.reject(new Error('Meal not found'));
  },
  
  deleteMeal: (id: number) => {
    const index = meals.findIndex(m => m.id === id);
    if (index !== -1) {
      const meal = meals.splice(index, 1)[0];
      return Promise.resolve(meal);
    }
    return Promise.reject(new Error('Meal not found'));
  },

  // Meal serving
  serveMeal: (mealId: number, portionCount: number, userId: number, notes?: string) => {
    // Find the meal
    const meal = meals.find(m => m.id === mealId);
    if (!meal) {
      return Promise.reject(new Error('Meal not found'));
    }
    
    // Check if we have enough ingredients
    for (const ingredient of meal.ingredients) {
      const product = products.find(p => p.id === ingredient.product.id);
      if (!product) {
        return Promise.reject(new Error(`Product ${ingredient.product.name} not found`));
      }
      
      const requiredAmount = ingredient.quantity * portionCount;
      if (product.totalWeight < requiredAmount) {
        return Promise.reject(new Error(`Not enough ${product.name} in inventory`));
      }
    }
    
    // Update inventory
    for (const ingredient of meal.ingredients) {
      const product = products.find(p => p.id === ingredient.product.id)!;
      product.totalWeight -= ingredient.quantity * portionCount;
    }
    
    // Create meal serving record
    const user = users.find(u => u.id === userId);
    if (!user) {
      return Promise.reject(new Error('User not found'));
    }
    
    const newMealServing: MealServing = {
      id: Math.max(...mealServings.map(ms => ms.id), 0) + 1,
      meal,
      user,
      portionCount,
      servedAt: new Date().toISOString(),
      notes
    };
    
    mealServings.push(newMealServing);
    return Promise.resolve(newMealServing);
  },

  // Get meal servings
  getMealServings: () => Promise.resolve(mealServings),

  // Get possible portions
  getPossiblePortions: () => {
    const result = meals.map(meal => {
      // Calculate how many portions we can make based on current inventory
      let maxPortions: number | null = null;
      
      for (const ingredient of meal.ingredients) {
        const product = products.find(p => p.id === ingredient.product.id);
        if (!product) continue;
        
        const possiblePortions = Math.floor(product.totalWeight / ingredient.quantity);
        if (maxPortions === null || possiblePortions < maxPortions) {
          maxPortions = possiblePortions;
        }
      }
      
      return {
        meal,
        possiblePortions: maxPortions || 0
      };
    });
    
    return Promise.resolve(result);
  },

  // Suppliers
  getSuppliers: () => Promise.resolve(suppliers),

  // Delivery logs
  getDeliveryLogs: () => Promise.resolve(deliveryLogs),
  
  addDelivery: (deliveryLog: Omit<DeliveryLog, 'id'>) => {
    const newDeliveryLog = {
      ...deliveryLog,
      id: Math.max(...deliveryLogs.map(d => d.id)) + 1
    };
    deliveryLogs.push(newDeliveryLog as DeliveryLog);
    
    // Update product quantity
    const product = products.find(p => p.id === deliveryLog.product.id);
    if (product) {
      product.totalWeight += deliveryLog.quantityReceived;
    }
    
    return Promise.resolve(newDeliveryLog);
  },

  // Reports
  getMonthlyReports: () => Promise.resolve(monthlyReports),

  // Lookup data
  getUnits: () => Promise.resolve(units),
  getMealCategories: () => Promise.resolve(mealCategories),
  getAllergens: () => Promise.resolve(allergens),

  // Users
  getCurrentUser: () => Promise.resolve(users[0]),
};

export default API;
