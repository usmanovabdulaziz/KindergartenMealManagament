
import React, { useState, useEffect } from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { PlusCircle, Search, AlertTriangle } from "lucide-react";
import { Product, Unit } from '@/types';
import API from '@/services/api';
import { toast } from "@/components/ui/sonner";

const Ingredients = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    totalWeight: 0,
    unitId: 0,
    threshold: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const [productsData, unitsData] = await Promise.all([
          API.getProducts(),
          API.getUnits()
        ]);
        setProducts(productsData);
        setUnits(unitsData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load ingredients data');
      }
    };
    
    loadData();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'name' ? value : Number(value),
    });
  };

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      unitId: Number(value),
    });
  };

  const handleAddProduct = async () => {
    try {
      const selectedUnit = units.find(unit => unit.id === formData.unitId);
      if (!selectedUnit) {
        toast.error('Please select a valid unit');
        return;
      }

      await API.addProduct({
        name: formData.name,
        totalWeight: formData.totalWeight,
        unit: selectedUnit,
        threshold: formData.threshold,
        isActive: true,
      });

      // Refresh the products list
      const productsData = await API.getProducts();
      setProducts(productsData);
      
      // Reset form and close dialog
      setFormData({
        name: '',
        totalWeight: 0,
        unitId: 0,
        threshold: 0,
      });
      setIsAddDialogOpen(false);
      toast.success('Ingredient added successfully');
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Failed to add ingredient');
    }
  };

  const filteredProducts = searchTerm 
    ? products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : products;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search ingredients..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Ingredient
            </Button>
          </DialogTrigger>
          
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Ingredient</DialogTitle>
              <DialogDescription>
                Enter the details of the new ingredient to add to inventory.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="e.g. Potatoes" 
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="totalWeight">Quantity</Label>
                  <Input 
                    id="totalWeight" 
                    name="totalWeight" 
                    type="number" 
                    min="0"
                    value={formData.totalWeight || ''}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select 
                    onValueChange={handleSelectChange}
                    value={formData.unitId ? formData.unitId.toString() : ''}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit.id} value={unit.id.toString()}>
                          {unit.name} ({unit.abbreviation})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="threshold">Threshold (for low stock alert)</Label>
                <Input 
                  id="threshold" 
                  name="threshold" 
                  type="number"
                  min="0"
                  value={formData.threshold || ''}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddProduct}>
                Add Ingredient
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                // Calculate status percentage
                const percentage = product.threshold 
                  ? Math.min(100, (product.totalWeight / product.threshold) * 100)
                  : 100;
                
                return (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">{product.name}</TableCell>
                    <TableCell>
                      {product.totalWeight} {product.unit.abbreviation}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={percentage} className="w-24" />
                        {product.threshold && product.totalWeight < product.threshold && (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                  No ingredients found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default Ingredients;
