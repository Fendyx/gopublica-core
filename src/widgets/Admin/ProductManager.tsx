'use client';
import { useState, useEffect, useMemo } from 'react';
import { useTenant } from '@/entities/tenant/TenantContext';
import { useBranch } from '@/entities/branch/BranchContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, Search, Pencil, Trash2, Loader2, Star } from 'lucide-react';
import ProductForm from '@/features/ecommerce-management/ProductForm';
import CategoryForm from '@/features/ecommerce-management/CategoryForm';
import SortableCategoryList from '@/features/ecommerce-management/SortableCategoryList';
import type { MenuItem } from '@/entities/menu-item/types';

const FEATURED_ID = 'featured';
const STORAGE_KEY = (tenantId: string) => `${tenantId}_categories_order`;

export default function ProductManager({ token }: { token: string }) {
  const tenant = useTenant();
  const { selectedBranch } = useBranch();
  const [products, setProducts] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<any | null>(null);

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
    await fetch(`${apiUrl}/api/saas/menu/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchData();
  };

  const handleEditCategory = (cat: any) => {
    if (cat.key === FEATURED_ID) return;
    setEditingCategory(cat);
    setIsCategoryFormOpen(true);
  };

  const handleAddNewCategory = () => {
    setEditingCategory(null);
    setIsCategoryFormOpen(true);
  };

  const handleDeleteCategory = async (id: string) => {
    if (id === FEATURED_ID) return;
    if (!confirm('Delete this category?')) return;
    await fetch(`${apiUrl}/api/saas/categories/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchData();
  };

  const handleReorderCategories = async (newOrder: any[]) => {
    try {
      localStorage.setItem(STORAGE_KEY(tenant?.tenantId || ''), JSON.stringify(newOrder.map(c => c.key)));
    } catch {}
    
    const realCats = newOrder.filter(c => c.key !== FEATURED_ID);
    try {
      const res = await fetch(`${apiUrl}/api/saas/categories/reorder`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: realCats.map(c => c._id) }),
      });
      if (res.ok) {
        setCategories(realCats);
      } else {
        console.error('Failed to reorder categories');
        fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const hasFeatured = products.some(p => p.isFeatured);

  const orderedCategories = useMemo(() => {
    const savedOrder = (typeof window !== 'undefined') ? localStorage.getItem(STORAGE_KEY(tenant?.tenantId || '')) : null;
    const baseList = [
      ...(hasFeatured ? [{ _id: FEATURED_ID, key: FEATURED_ID, name: '⭐ Featured', layout: 'featured', order: -1, tenantId: tenant?.tenantId }] : []),
      ...categories,
    ];

    if (savedOrder) {
      try {
        const orderKeys: string[] = JSON.parse(savedOrder);
        const ordered = orderKeys
          .map(key => baseList.find(c => c.key === key))
          .filter(Boolean) as any[];
        const missingCats = baseList.filter(c => !ordered.some(oc => oc.key === c.key));
        return [...ordered, ...missingCats];
      } catch {}
    }
    return baseList;
  }, [categories, hasFeatured, tenant?.tenantId]);

  if (loading) return <div className="text-center py-10 flex items-center justify-center gap-2"><Loader2 className="w-5 h-5 animate-spin" /> Loading...</div>;

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
          <Card className="p-4 lg:p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="relative w-full max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input placeholder="Search products..." className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background" />
              </div>
              <Button className="gap-2" onClick={handleAddNewProduct}>
                <Plus className="w-4 h-4" /> Add Product
              </Button>
            </div>

            {/* Desktop table */}
            <div className="hidden lg:block rounded-lg border border-border overflow-hidden">
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
                      <TableCell className="font-medium">
                        {product.name}
                        {product.isFeatured && <Star className="inline ml-2 w-4 h-4 text-yellow-500" />}
                      </TableCell>
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

            {/* Mobile cards */}
            <div className="lg:hidden space-y-4">
              {products.map((product) => (
                <div key={product._id} className="border rounded-lg p-4 bg-card flex gap-4 items-start">
                  <div className="shrink-0">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-16 h-16 rounded-md object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">No img</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                      {product.isFeatured && <Star className="w-4 h-4 text-yellow-500 shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {product.category || categories.find(c => c.key === product.categoryKey)?.name || 'Uncategorized'}
                    </p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="font-bold text-sm">${product.price.toFixed(2)}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${(product as any).status === 'draft' ? 'bg-gray-100 text-gray-500' : 'bg-emerald-100 text-emerald-700'}`}>
                        {(product as any).status === 'draft' ? 'Draft' : 'Active'}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" onClick={() => handleEditProduct(product)}>
                        <Pencil className="w-3 h-3 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteProduct(product._id!)}>
                        <Trash2 className="w-3 h-3 mr-1 text-red-500" /> Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </TabsContent>

        {/* Categories Tab with Drag & Drop */}
        <TabsContent value="categories" className="mt-6">
          <Card className="p-4 lg:p-6">
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-muted-foreground">Drag to reorder</p>
              <Button className="gap-2" onClick={handleAddNewCategory}>
                <Plus className="w-4 h-4" /> Add Category
              </Button>
            </div>

            <SortableCategoryList
              categories={orderedCategories.filter(cat => {
                if (cat.key === FEATURED_ID) return true;
                if (cat.tenantId === tenant?.tenantId) return true;
                return products.some(p => (p.categoryKey || p.category) === cat.key);
              })}
              onEdit={handleEditCategory}
              onDelete={handleDeleteCategory}
              onReorder={handleReorderCategories}
              featuredId={FEATURED_ID}
            />
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
        editingCategory={editingCategory}
        token={token}
        onSave={fetchData}
      />
    </div>
  );
}