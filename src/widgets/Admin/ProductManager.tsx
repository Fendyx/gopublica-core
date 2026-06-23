'use client';
import { useState, useEffect } from 'react';
import { useTenant } from '@/entities/tenant/TenantContext';
import { useBranch } from '@/entities/branch/BranchContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Search, Pencil, Trash2, Loader2 } from 'lucide-react';
import ProductForm from '@/features/ecommerce-management/ProductForm';
import CategoryForm from '@/features/ecommerce-management/CategoryForm';
import type { MenuItem } from '@/entities/menu-item/types';

export default function ProductManager({ token }: { token: string }) {
  const tenant = useTenant();
  const { selectedBranch } = useBranch();
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<any | null>(null); // <--- НОВОЕ СОСТОЯНИЕ

  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  const fetchData = async () => {
    if (!tenant?.tenantId) return;
    setLoading(true);
    try {
      let prodUrl = `${apiUrl}/api/saas/menu?tenantId=${tenant.tenantId}`;
      if (selectedBranch) prodUrl += `&branchId=${selectedBranch._id}`;
      const prodRes = await fetch(prodUrl);
      const prodData = await prodRes.json();
      setProducts(prodData);

      const catRes = await fetch(`${apiUrl}/api/saas/categories?tenantId=${tenant.tenantId}&niche=ecommerce`);
      const catData = await catRes.json();
      setCategories(catData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedBranch, tenant?.tenantId]);

  const handleEditProduct = (product: MenuItem) => {
    setEditingProduct(product);
    setIsProductFormOpen(true);
  };

  const handleAddNewProduct = () => {
    setEditingProduct(null);
    setIsProductFormOpen(true);
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await fetch(`${apiUrl}/api/saas/menu/${id}`, { 
      method: 'DELETE', 
      headers: { Authorization: `Bearer ${token}` } 
    });
    fetchData();
  };

  // НОВЫЕ ФУНКЦИИ ДЛЯ КАТЕГОРИЙ
  const handleEditCategory = (cat: any) => {
    setEditingCategory(cat);
    setIsCategoryFormOpen(true);
  };

  const handleAddNewCategory = () => {
    setEditingCategory(null);
    setIsCategoryFormOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Delete this category? Products will remain but become uncategorized.')) return;
    // Используем роут удаления по ID (убедись что он есть на бекенде, если нет - используй key)
    await fetch(`${apiUrl}/api/saas/categories/${id}`, { 
      method: 'DELETE', 
      headers: { Authorization: `Bearer ${token}` } 
    });
    fetchData();
  };

  if (loading) return <div className="text-center py-10 flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading products...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-12 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Catalog Management</h2>
          <p className="text-muted-foreground text-sm mt-1">E-commerce / Products</p>
        </div>
      </div>

      <Tabs defaultValue="products" className="w-full">
        <TabsList className="bg-muted/50 border border-border">
          <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
          <TabsTrigger value="categories">Categories ({categories.length})</TabsTrigger>
        </TabsList>

        {/* Products Tab */}
        <TabsContent value="products" className="mt-6">
          <Card className="p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input placeholder="Search products..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background" />
              </div>
              <Button className="gap-2" onClick={handleAddNewProduct}>
                <Plus className="w-4 h-4" /> Add Product
              </Button>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="w-[80px]">Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product._id} className="hover:bg-muted/20">
                      <TableCell>
                        {product.image ? (
                          <img src={product.image} alt={product.name} className="w-12 h-12 rounded-md object-cover" />
                        ) : (
                          <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">No img</div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {product.category || categories.find(c => c.key === product.categoryKey)?.name || 'Uncategorized'}
                      </TableCell>
                      <TableCell className="font-medium">${product.price.toFixed(2)}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${(product as any).status === 'draft' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-700'}`}>
                          {(product as any).status === 'draft' ? 'Draft' : 'Active'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditProduct(product)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteProduct(product._id!)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
                {/* Categories Tab */}
        <TabsContent value="categories" className="mt-6">
          <Card className="p-6">
            <div className="flex justify-end mb-6">
              <Button className="gap-2" onClick={handleAddNewCategory}>
                <Plus className="w-4 h-4" /> Add Category
              </Button>
            </div>

            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Layout</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* ФИЛЬТРУЕМ КАТЕГОРИИ ДЛЯ ОТОБРАЖЕНИЯ В ТАБЛИЦЕ */}
                  {categories
                    .filter(cat => {
                      // 1. Показываем, если админ создал её сам (она привязана к тенанту)
                      if (cat.tenantId === tenant?.tenantId) return true;
                      // 2. ИЛИ показываем, если это глобальная категория, но в ней ЕСТЬ товары
                      const hasProducts = products.some(p => (p.categoryKey || p.category) === cat.key);
                      return hasProducts;
                    })
                    .map((cat) => (
                    <TableRow key={cat._id || cat.key} className="hover:bg-muted/20">
                      <TableCell className="font-medium flex items-center gap-2">
                        <span>{cat.icon || '📦'}</span> {cat.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground font-mono text-sm">{cat.key}</TableCell>
                      <TableCell>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {cat.layout || 'grid-3'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditCategory(cat)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(cat._id)}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      <ProductForm 
        isOpen={isProductFormOpen} 
        onClose={() => setIsProductFormOpen(false)} 
        editingProduct={editingProduct}
        categories={categories}
        token={token}
        branchId={selectedBranch?._id}
        onSave={fetchData}
      />
      <CategoryForm 
        isOpen={isCategoryFormOpen} 
        onClose={() => setIsCategoryFormOpen(false)} 
        editingCategory={editingCategory} // <--- ПЕРЕДАЕМ ОБЪЕКТ
        token={token}
        onSave={fetchData}
      />
    </div>
  );
}