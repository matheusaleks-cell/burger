import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, LayoutGrid, List } from "lucide-react";
import { useProducts, Product } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductListView } from "@/components/products/ProductListView";
import { ProductFormDialog } from "@/components/products/ProductFormDialog";

export default function Products() {
  const {
    products,
    isLoading: loadingProducts,
    createProduct,
    updateProduct,
    deleteProduct
  } = useProducts();

  const { data: categories = [], isLoading: loadingCategories } = useCategories();

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list"); // Default to list view as per request
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    deleteProduct.mutate(id);
  };

  const handleToggleActive = (product: Product) => {
    updateProduct.mutate({
      id: product.id,
      updates: { is_active: !product.is_active }
    });
  };

  const handleToggleAvailable = (product: Product) => {
    updateProduct.mutate({
      id: product.id,
      updates: { availability_status: product.availability_status === 'unavailable' ? 'available' : 'unavailable' }
    });
  };

  const handleSubmit = (data: any) => {
    const { complementGroupIds, ...productSubData } = data;

    // Clean up price to ensure it is a number logic should be inside the mutation or API
    // but here we just pass it along.

    if (editingProduct) {
      updateProduct.mutate({
        id: editingProduct.id,
        updates: productSubData,
        complementGroupIds
      }, {
        onSuccess: () => setIsDialogOpen(false)
      });
    } else {
      createProduct.mutate({
        product: productSubData,
        complementGroupIds
      }, {
        onSuccess: () => setIsDialogOpen(false)
      });
    }
  };

  const filteredProducts = products.filter((product) => {
    const term = searchTerm.toLowerCase();
    const productName = product.name.toLowerCase();
    const matchesSearch = productName.includes(term);
    const matchesCategory =
      selectedCategory === "all" || product.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const isLoading = loadingProducts || loadingCategories;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-display font-black tracking-tight text-slate-900 leading-none">
            Produtos / Frigobar
          </h1>
          <p className="text-sm font-medium text-muted-foreground mt-2 italic">
            Gerencie o catálogo de itens e serviços da pousada
          </p>
        </div>

        <Button
          className="gap-2 font-black uppercase text-xs tracking-widest px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          size="lg"
          onClick={() => {
            setEditingProduct(null);
            setIsDialogOpen(true);
          }}
        >
          <Plus className="h-4 w-4" />
          Novo Item
        </Button>

        <ProductFormDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          product={editingProduct}
          categories={categories}
          onSubmit={handleSubmit}
          isLoading={createProduct.isPending || updateProduct.isPending}
        />
      </div>

      {/* Filters & View Toggle */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-gray-50 border-gray-200 focus:bg-white transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-48 bg-gray-50 border-gray-200">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as categorias</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50 p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => setViewMode("grid")}
              title="Visualização em Grade"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8 rounded-md"
              onClick={() => setViewMode("list")}
              title="Visualização em Lista"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {viewMode === "list" ? (
        <ProductListView
          products={filteredProducts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          onToggleAvailable={handleToggleAvailable}
        />
      ) : (
        <ProductGrid
          products={filteredProducts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleActive={handleToggleActive}
          onToggleAvailable={handleToggleAvailable}
        />
      )}
    </div>
  );
}
