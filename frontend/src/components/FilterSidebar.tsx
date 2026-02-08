'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { catalogService } from '@/services/catalogService';

interface FilterSidebarProps {
  onFiltersChange?: (filters: any) => void;
}

export default function FilterSidebar({ onFiltersChange }: FilterSidebarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>(searchParams.get('category') || '');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [brands, setBrands] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    loadFiltersData();
  }, []);

  const loadFiltersData = async () => {
    try {
      // Load categories
      const categoriesData = await catalogService.getCategories();
      // Handle both array response and object with results property
      const categoriesArray = Array.isArray(categoriesData) 
        ? categoriesData 
        : categoriesData.results || [];
      setCategories(categoriesArray);
      
      // Load brands (we'll get them from products for now)
      const productsData = await catalogService.getProducts({ limit: 100 });
      const productsArray = Array.isArray(productsData)
        ? productsData
        : productsData.results || [];
      
      const uniqueBrands = [...new Set(
        productsArray
          .filter((p: any) => p.brand)
          .map((p: any) => p.brand.name)
      )].sort();
      setBrands(uniqueBrands);
    } catch (error) {
      console.error('Error loading filter data:', error);
    }
  };

  const applyFilters = () => {
    const filters: any = {};
    
    if (selectedBrand) filters.brand = selectedBrand;
    if (selectedCategory) filters.category = selectedCategory;
    if (priceRange[1] < 500) {
      filters.min_price = priceRange[0];
      filters.max_price = priceRange[1];
    }
    if (inStockOnly) filters.in_stock = true;
    
    // Notify parent component
    if (onFiltersChange) {
      onFiltersChange(filters);
    }
    
    // Update URL params for browsing
    if (!searchParams.get('q')) {
      const params = new URLSearchParams();
      if (selectedCategory) params.set('category', selectedCategory);
      if (selectedBrand) params.set('brand', selectedBrand);
      router.push(`/products?${params.toString()}`);
    }
  };

  const clearAllFilters = () => {
    setPriceRange([0, 500]);
    setSelectedBrand('');
    setSelectedCategory('');
    setInStockOnly(false);
    if (onFiltersChange) {
      onFiltersChange({});
    }
    router.push('/products');
  };

  return (
    <div className="sticky top-[72px]">
      <div className="bg-white rounded-xl border border-gray-200 p-20">
        <div className="flex items-center justify-between mb-20">
          <h3 className="text-[16px] font-bold text-gray-900">Filters</h3>
          <button 
            onClick={clearAllFilters}
            className="text-[13px] text-brand-600 hover:text-brand-700 font-medium"
          >
            Clear All
          </button>
        </div>

        {/* Categories */}
        <div className="mb-24 pb-24 border-b border-gray-200">
          <h4 className="text-[14px] font-semibold text-gray-900 mb-12">Category</h4>
          <div className="space-y-8">
            {categories.map((cat) => (
              <label key={cat.slug} className="flex items-center gap-8 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  checked={selectedCategory === cat.slug}
                  onChange={() => {
                    setSelectedCategory(cat.slug);
                    setTimeout(applyFilters, 100);
                  }}
                  className="w-16 h-16 text-brand-600 focus:ring-brand-600"
                />
                <span className="text-[14px] text-gray-700">{cat.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Brands */}
        {brands.length > 0 && (
          <div className="mb-24 pb-24 border-b border-gray-200">
            <h4 className="text-[14px] font-semibold text-gray-900 mb-12">Brand</h4>
            <div className="space-y-8 max-h-[200px] overflow-y-auto">
              {brands.map((brand) => (
                <label key={brand} className="flex items-center gap-8 cursor-pointer">
                  <input
                    type="radio"
                    name="brand"
                    checked={selectedBrand === brand}
                    onChange={() => {
                      setSelectedBrand(brand);
                      setTimeout(applyFilters, 100);
                    }}
                    className="w-16 h-16 text-brand-600 focus:ring-brand-600"
                  />
                  <span className="text-[14px] text-gray-700">{brand}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Price Range */}
        <div className="mb-24 pb-24 border-b border-gray-200">
          <h4 className="text-[14px] font-semibold text-gray-900 mb-12">Price Range</h4>
          <div className="space-y-12">
            <input
              type="range"
              min="0"
              max="500"
              value={priceRange[1]}
              onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
              onMouseUp={applyFilters}
              onTouchEnd={applyFilters}
              className="w-full accent-brand-600"
            />
            <div className="flex items-center justify-between text-[13px] text-gray-600">
              <span>${priceRange[0]}</span>
              <span>${priceRange[1] === 500 ? '500+' : `$${priceRange[1]}`}</span>
            </div>
          </div>
        </div>

        {/* Stock Availability */}
        <div>
          <label className="flex items-center gap-8 cursor-pointer">
            <input
              type="checkbox"
              checked={inStockOnly}
              onChange={(e) => {
                setInStockOnly(e.target.checked);
                setTimeout(applyFilters, 100);
              }}
              className="w-16 h-16 rounded border-gray-300 text-brand-600 focus:ring-brand-600"
            />
            <span className="text-[14px] text-gray-700">In Stock Only</span>
          </label>
        </div>
      </div>
    </div>
  );
}
