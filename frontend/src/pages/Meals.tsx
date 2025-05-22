
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from "@/components/ui";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { UtensilsCrossed, PlusCircle, X, Check, AlertTriangle } from 'lucide-react';
import API from '@/services/api';
import { Meal, MealCategory, User } from '@/types';
import { toast } from "@/components/ui/sonner";

interface PossiblePortion {
  meal: Meal;
  possiblePortions: number;
}

const Meals = () => {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealCategories, setMealCategories] = useState<MealCategory[]>([]);
  const [possiblePortions, setPossiblePortions] = useState<PossiblePortion[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [servingMealId, setServingMealId] = useState<number | null>(null);
  const [portionCount, setPortionCount] = useState(1);
  const [isServingDialogOpen, setIsServingDialogOpen] = useState(false);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        const [mealsData, categoriesData, portionsData, userData] = await Promise.all([
          API.getMeals(),
          API.getMealCategories(),
          API.getPossiblePortions(),
          API.getCurrentUser()
        ]);
        
        setMeals(mealsData);
        setMealCategories(categoriesData);
        setPossiblePortions(portionsData);
        setCurrentUser(userData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load meals data');
      }
    };
    
    loadData();
  }, []);
  
  const handleServeMeal = async () => {
    if (!servingMealId || !currentUser) return;
    
    try {
      await API.serveMeal(servingMealId, portionCount, currentUser.id);
      
      // Refresh data after serving
      const [mealsData, portionsData] = await Promise.all([
        API.getMeals(),
        API.getPossiblePortions()
      ]);
      
      setMeals(mealsData);
      setPossiblePortions(portionsData);
      setIsServingDialogOpen(false);
      toast.success(`Successfully served ${portionCount} portions`);
    } catch (error: any) {
      console.error('Error serving meal:', error);
      toast.error(error.message || 'Failed to serve meal');
    }
  };
  
  const getPossiblePortionsForMeal = (mealId: number) => {
    const foundPortion = possiblePortions.find(p => p.meal.id === mealId);
    return foundPortion ? foundPortion.possiblePortions : 0;
  };
  
  const renderMealCards = () => {
    const mealsByCategory: Record<number, Meal[]> = {};
    
    meals.forEach(meal => {
      if (!mealsByCategory[meal.category.id]) {
        mealsByCategory[meal.category.id] = [];
      }
      mealsByCategory[meal.category.id].push(meal);
    });
    
    return Object.entries(mealsByCategory).map(([categoryId, meals]) => {
      const category = mealCategories.find(c => c.id === Number(categoryId));
      
      if (!category) return null;
      
      return (
        <div key={categoryId} className="mb-8">
          <h2 className="text-lg font-semibold mb-4">{category.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meals.map(meal => {
              const possiblePortions = getPossiblePortionsForMeal(meal.id);
              const isLowStock = possiblePortions < 5;
              
              return (
                <Card key={meal.id} className="overflow-hidden">
                  <div className={`h-2 ${isLowStock ? 'bg-destructive' : 'bg-accent'}`} />
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{meal.name}</CardTitle>
                      <Badge variant={meal.isActive ? "outline" : "secondary"}>
                        {meal.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-4">
                      <h4 className="text-sm font-medium mb-1">Ingredients:</h4>
                      <ul className="text-sm text-muted-foreground">
                        {meal.ingredients.map((ingredient, index) => (
                          <li key={index}>
                            {ingredient.quantity} {ingredient.product.unit.abbreviation} {ingredient.product.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm">Available portions:</p>
                        <p className={`font-medium ${isLowStock ? 'text-destructive flex items-center' : ''}`}>
                          {isLowStock && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {possiblePortions}
                        </p>
                      </div>
                      
                      <Button 
                        onClick={() => {
                          setServingMealId(meal.id);
                          setPortionCount(1);
                          setIsServingDialogOpen(true);
                        }}
                        disabled={possiblePortions <= 0}
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
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Meals</h1>
        <Button>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Meal
        </Button>
      </div>
      
      {renderMealCards()}
      
      <AlertDialog open={isServingDialogOpen} onOpenChange={setIsServingDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Serve Meal</AlertDialogTitle>
            <AlertDialogDescription>
              {servingMealId && (
                <div>
                  <p className="mb-4">
                    You are about to serve{' '}
                    <strong>{meals.find(m => m.id === servingMealId)?.name}</strong>.
                    This will deduct the required ingredients from inventory.
                  </p>
                  
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
