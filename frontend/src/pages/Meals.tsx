import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Button,
  Badge,
  Input,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox
} from "@/components/ui";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { UtensilsCrossed, PlusCircle, Trash2, AlertTriangle } from 'lucide-react';
import { useApiService } from '@/hooks/useApiService';
import { toast } from "@/components/ui/sonner";
import { Meal, Product } from '@/types';

// Helper to extract product categories from paginated or flat backend response
const getProductCategoriesList = (categoriesData: any): any[] => {
  if (Array.isArray(categoriesData)) return categoriesData;
  if (categoriesData && Array.isArray(categoriesData.results)) return categoriesData.results;
  if (categoriesData && Array.isArray(categoriesData.categories)) return categoriesData.categories;
  return [];
};
// Helper to extract products from paginated or flat backend response
const getProductsList = (productsData: any): Product[] => {
  if (Array.isArray(productsData)) return productsData;
  if (productsData && Array.isArray(productsData.products)) return productsData.products;
  if (productsData && Array.isArray(productsData.results)) return productsData.results;
  return [];
};
// Helper to extract meals from paginated or flat backend response
const getMealsList = (data: any) => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.results)) return data.results;
  if (data && Array.isArray(data.meals)) return data.meals;
  return [];
};

const Meals = () => {
  const { apiBaseUrl, api, fetchWithAuth } = useApiService();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [productCategories, setProductCategories] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [possiblePortions, setPossiblePortions] = useState<{ [mealId: number]: number }>({});
  const [servingMealId, setServingMealId] = useState<number | null>(null);
  const [portionCount, setPortionCount] = useState(1);
  const [isServingDialogOpen, setIsServingDialogOpen] = useState(false);

  // Add Meal Dialog state
  const [isAddMealOpen, setIsAddMealOpen] = useState(false);
  const [addMealName, setAddMealName] = useState('');
  const [addMealCategoryId, setAddMealCategoryId] = useState<number | undefined>(undefined);
  const [addMealIsActive, setAddMealIsActive] = useState(true);
  const [addMealIngredients, setAddMealIngredients] = useState<
    { productId: number | undefined; quantity: number; }[]
  >([{ productId: undefined, quantity: 1 }]);
  const [existingDishes, setExistingDishes] = useState<Meal[]>([]);

  const wsRef = useRef<WebSocket | null>(null);

  const fetchPossiblePortions = useCallback(async (mealsList: Meal[]) => {
    const portions: { [mealId: number]: number } = {};
    await Promise.all(
      mealsList.map(async (meal) => {
        try {
          const resp = await fetchWithAuth(`/meals/meals/${meal.id}/estimate-portions/`);
          portions[meal.id] = resp.max_portions || 0;
        } catch (err: any) {
          // Check for "No ingredients defined for this meal"
          if (err.message && err.message.includes("No ingredients defined for this meal")) {
            portions[meal.id] = 0; // Or use null if you want to show "N/A"
          } else {
            portions[meal.id] = 0;
          }
        }
      })
    );
    setPossiblePortions(portions);
  }, [fetchWithAuth]);

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const [mealsData, categoriesData, productsDataRaw] = await Promise.all([
          api.getMeals(),
          api.getProductCategories(),
          api.getProducts()
        ]);
        if (!cancelled) {
          setMeals(getMealsList(mealsData));
          setProductCategories(getProductCategoriesList(categoriesData));
          setProducts(getProductsList(productsDataRaw));
          if (Array.isArray(getMealsList(mealsData))) {
            await fetchPossiblePortions(getMealsList(mealsData));
          }
        }
      } catch (error) {
        if (!cancelled) {
          toast.error('Failed to load meals data');
        }
      }
    };
    loadData();
    return () => {
      cancelled = true;
      wsRef.current?.close();
    };
  }, [apiBaseUrl, fetchPossiblePortions, api]);

  // Show existing dishes in the selected category
  useEffect(() => {
    if (addMealCategoryId) {
      const filtered = meals.filter(m => m.category && m.category.id === addMealCategoryId);
      setExistingDishes(filtered);
    } else {
      setExistingDishes([]);
    }
  }, [addMealCategoryId, meals]);

  const handleServeMeal = async () => {
    if (!servingMealId) return;
    try {
      await api.serveMeal({
        meal: servingMealId,
        portions_served: portionCount,
      });
      const mealsData = await api.getMeals();
      setMeals(getMealsList(mealsData));
      await fetchPossiblePortions(getMealsList(mealsData));
      setIsServingDialogOpen(false);
      toast.success(`Successfully served ${portionCount} portions`);
    } catch (error: any) {
      toast.error(error?.message || 'Failed to serve meal');
    }
  };

  // Add Meal dialog handlers
  const handleAddMeal = async () => {
    if (!addMealName.trim() || !addMealCategoryId) {
      toast.error('Please provide meal name and category.');
      return;
    }
    if (!addMealIngredients.length || addMealIngredients.some(ing => !ing.productId || ing.quantity <= 0)) {
      toast.error('Add at least one valid ingredient.');
      return;
    }
    // Check if a dish with this name already exists in the selected category
    const nameExists = existingDishes.some(
      m => m.name.trim().toLowerCase() === addMealName.trim().toLowerCase()
    );
    if (nameExists) {
      toast.error(
        "A meal with this name already exists in the selected category. " +
        "Try changing the name or category."
      );
      return;
    }
    try {
      const newMeal = await api.addMeal({
        name: addMealName,
        category_id: addMealCategoryId,
        is_active: addMealIsActive,
      });

      const validIngredients = addMealIngredients.filter(ing => ing.productId && ing.quantity > 0);

      await Promise.all(
        validIngredients.map(ing =>
          api.addMealIngredient({
            meal: newMeal.id,
            product_id: ing.productId,
            quantity: ing.quantity
          })
        )
      );

      // Only fetch meals once after everything is added
      const mealsData = await api.getMeals();
      setMeals(getMealsList(mealsData));
      await fetchPossiblePortions(getMealsList(mealsData));
      setAddMealName('');
      setAddMealCategoryId(undefined);
      setAddMealIsActive(true);
      setAddMealIngredients([{ productId: undefined, quantity: 1 }]);
      setIsAddMealOpen(false);
      toast.success('Meal added successfully!');
    } catch (error: any) {
      if (
        error?.message &&
        error.message.includes("must make a unique set")
      ) {
        toast.error("A meal with this name already exists in the selected category.");
      } else {
        toast.error(error?.message || 'Failed to add meal');
      }
    }
  };

  const getPossiblePortionsForMeal = (mealId: number) => {
    return possiblePortions[mealId] ?? 0;
  };

  // Suggestions for similar names if duplicate exists
  const nameExists = existingDishes.some(
    m => m.name.trim().toLowerCase() === addMealName.trim().toLowerCase()
  );
  const suggestions = nameExists && addMealName
    ? [
        `${addMealName} 2`,
        `${addMealName} special`,
        `${addMealName} (${new Date().toLocaleDateString()})`
      ]
    : [];

  const renderMealCards = () => {
    if (meals.length === 0) {
      return (
        <div className="text-center text-muted-foreground text-lg mt-24">
          No meals added yet.
        </div>
      );
    }
    const mealsByCategory: Record<number, Meal[]> = {};
    meals.forEach(meal => {
      if (!meal.category?.id) return;
      if (!mealsByCategory[meal.category.id]) mealsByCategory[meal.category.id] = [];
      mealsByCategory[meal.category.id].push(meal);
    });

    return Object.entries(mealsByCategory).map(([categoryId, meals]) => {
      const category = productCategories.find(c => c.id === Number(categoryId));
      if (!category) return null;
      return (
        <div key={categoryId} className="mb-8">
          <h2 className="text-lg font-semibold mb-4">{category.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meals.map(meal => {
              const portions = getPossiblePortionsForMeal(meal.id);
              const isLowStock = portions < 5;
              return (
                <Card key={meal.id} className="overflow-hidden">
                  <div className={`h-2 ${isLowStock ? 'bg-destructive' : 'bg-accent'}`} />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{meal.name}</CardTitle>
                      <Badge variant={meal.is_active ? "outline" : "secondary"}>
                        {meal.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-1">Ingredients:</h4>
                      <ul className="text-sm text-muted-foreground">
                        {Array.isArray(meal.ingredients) && meal.ingredients.length > 0 ? (
                          meal.ingredients.map((ingredient: any, index: number) => (
                            <li key={index}>
                              {ingredient.quantity}{" "}
                              {ingredient.product?.unit?.abbreviation
                                ? ingredient.product.unit.abbreviation + " "
                                : ""}
                              {ingredient.product?.name ?? ""}
                            </li>
                          ))
                        ) : (
                          <li>No ingredients</li>
                        )}
                      </ul>
                    </div>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm">Available portions:</p>
                        <p className={`font-medium ${isLowStock ? 'text-destructive flex items-center' : ''}`}>
                          {isLowStock && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {portions}
                        </p>
                      </div>
                      <Button
                        onClick={() => {
                          setServingMealId(meal.id);
                          setPortionCount(1);
                          setIsServingDialogOpen(true);
                        }}
                        disabled={portions <= 0}
                      >
                        <UtensilsCrossed className="h-4 w-4 mr-2" />
                        Serve
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      );
    });
  };

  // Ingredient editing handlers for dialog
  const handleIngredientChange = (idx: number, field: 'productId' | 'quantity', value: any) => {
    setAddMealIngredients(ings =>
      ings.map((ing, i) =>
        i === idx ? { ...ing, [field]: field === 'quantity' ? Number(value) : (value ? Number(value) : undefined) } : ing
      )
    );
  };
  const handleAddIngredientRow = () => setAddMealIngredients(ings => [...ings, { productId: undefined, quantity: 1 }]);
  const handleRemoveIngredientRow = (idx: number) => setAddMealIngredients(ings => ings.filter((_, i) => i !== idx));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Meals</h1>
        <Dialog open={isAddMealOpen} onOpenChange={setIsAddMealOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Meal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Meal</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="meal-name">Meal Name</Label>
                <Input
                  id="meal-name"
                  value={addMealName}
                  onChange={e => setAddMealName(e.target.value)}
                  placeholder="Meal name"
                />
                {addMealCategoryId && (
                  <div className="text-xs text-muted-foreground my-1">
                    Existing dishes in this category:{" "}
                    {existingDishes.length === 0
                      ? "None"
                      : existingDishes.map(m => m.name).join(", ")}
                  </div>
                )}
                {nameExists && (
                  <div className="text-sm text-destructive my-1">
                    <b>⚠️ This dish already exists in this category.</b>
                    <br />
                    Suggestions:{" "}
                    {suggestions.map(s => (
                      <span className="mr-2" key={s}>{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="meal-category">Category</Label>
                <Select
                  value={addMealCategoryId ? String(addMealCategoryId) : ""}
                  onValueChange={val => setAddMealCategoryId(val ? Number(val) : undefined)}
                  disabled={productCategories.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={productCategories.length === 0 ? "Loading..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {productCategories.length === 0 ? (
                      <div className="px-2 py-1 text-sm text-muted-foreground">
                        No categories found
                      </div>
                    ) : (
                      productCategories.map(category => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={addMealIsActive}
                  onCheckedChange={checked => setAddMealIsActive(Boolean(checked))}
                  id="is-active"
                />
                <Label htmlFor="is-active">Active</Label>
              </div>
              <div>
                <Label>Ingredients</Label>
                <div className="space-y-2">
                  {addMealIngredients.map((ing, idx) => (
                    <div className="flex gap-2 items-center" key={idx}>
                      <Select
                        value={ing.productId ? String(ing.productId) : ""}
                        onValueChange={val => handleIngredientChange(idx, 'productId', val)}
                        disabled={products.length === 0}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder={products.length === 0 ? "Loading..." : "Product"} />
                        </SelectTrigger>
                        <SelectContent>
                          {products.length === 0 ? (
                            <div className="px-2 py-1 text-sm text-muted-foreground">
                              No products found
                            </div>
                          ) : (
                            products.map(product => (
                              <SelectItem key={product.id} value={String(product.id)}>
                                {product.name} ({product.unit?.abbreviation || ''})
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        min={1}
                        placeholder="Qty"
                        value={ing.quantity}
                        onChange={e => handleIngredientChange(idx, 'quantity', e.target.value)}
                        className="w-20"
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        type="button"
                        onClick={() => handleRemoveIngredientRow(idx)}
                        disabled={addMealIngredients.length === 1}
                        aria-label="Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" type="button" onClick={handleAddIngredientRow}>
                    + Add Ingredient
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="secondary" onClick={() => setIsAddMealOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleAddMeal}>
                Add Meal
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {renderMealCards()}

      {/* Serve Meal Dialog */}
      <AlertDialog open={isServingDialogOpen} onOpenChange={setIsServingDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Serve Meal</AlertDialogTitle>
            <AlertDialogDescription>
              {servingMealId && (
                // Replace <div> with <div> and <p> with <div> or <span>, avoid <div> or <p> inside <p>
                <div>
                  <div className="mb-4">
                    You are about to serve{' '}
                    <strong>{meals.find(m => m.id === servingMealId)?.name}</strong>.
                    This will deduct the required ingredients from inventory.
                  </div>
                  <div className="mb-4">
                    <Label htmlFor="portions">Number of portions</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPortionCount(Math.max(1, portionCount - 1))}
                      >
                        -
                      </Button>
                      <Input
                        id="portions"
                        type="number"
                        min="1"
                        value={portionCount}
                        onChange={(e) => setPortionCount(parseInt(e.target.value) || 1)}
                        className="w-20 text-center"
                      />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setPortionCount(portionCount + 1)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleServeMeal}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Meals;