
// User and Role types
export interface Role {
  id: number;
  name: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  role: Role;
  isActive: boolean;
}

// Inventory related types
export interface Unit {
  id: number;
  name: string;
  abbreviation: string;
}

export interface Supplier {
  id: number;
  name: string;
  contactEmail?: string;
  phone?: string;
  isActive: boolean;
}

export interface Product {
  id: number;
  name: string;
  totalWeight: number;
  unit: Unit;
  threshold?: number;
  isActive: boolean;
}

export interface DeliveryLog {
  id: number;
  product: Product;
  supplier: Supplier;
  quantityReceived: number;
  deliveryDate: string;
  receivedAt: string;
  receivedBy: User;
  notes?: string;
}

// Meal related types
export interface MealCategory {
  id: number;
  name: string;
}

export interface Meal {
  id: number;
  name: string;
  category: MealCategory;
  isActive: boolean;
  ingredients: MealIngredient[];
}

export interface MealIngredient {
  id: number;
  product: Product;
  quantity: number;
}

// Allergens
export interface Allergen {
  id: number;
  name: string;
}

export interface ProductAllergen {
  product: Product;
  allergen: Allergen;
}

// Operational tracking
export interface MealServing {
  id: number;
  meal: Meal;
  user: User;
  portionCount: number;
  notes?: string;
  servedAt: string;
}

export interface IngredientUsage {
  id: number;
  mealServing: MealServing;
  product: Product;
  quantityUsed: number;
  usedAt: string;
}

// Reports
export interface MonthlyReport {
  id: number;
  meal: Meal;
  monthYear: string;
  portionsServed: number;
  portionsPossible: number;
  discrepancyRate: number;
  generatedAt: string;
}
