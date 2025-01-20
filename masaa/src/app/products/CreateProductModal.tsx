import Header from "@/components/Header";
import Image from "next/image";
import React, { ChangeEvent, useEffect, useState } from "react";
import { v4 } from "uuid";

type ProductCategory = {
  categoryId: string;
  name: string;
  description?: string;
};

type ProductFormData = {
  productId: string;
  name: string;
  price: string;
  stockQuantity: string;
  categoryId: string;
  image?: File;
};

type CreateProductModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (formData: FormData) => void;
};

const CreateProductModal = ({
  isOpen,
  onClose,
  onCreate,
}: CreateProductModalProps) => {
  const initialFormData: ProductFormData = {
    productId: v4(),
    name: "",
    price: "",
    stockQuantity: "",
    categoryId: "",
  };

  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("http://localhost:8000/products/categories");
        if (!response.ok) throw new Error("Failed to fetch categories");
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error("Error fetching categories:", error);
        setError("Failed to fetch categories");
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      // Validate file size (e.g., 5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB');
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setFormData((prev) => ({
        ...prev,
        image: file,
      }));
      setError(null);
    }
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError("Product name is required");
      return false;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      setError("Valid price is required");
      return false;
    }
    if (!formData.stockQuantity || parseInt(formData.stockQuantity) < 0) {
      setError("Valid stock quantity is required");
      return false;
    }
    if (!formData.categoryId) {
      setError("Category is required");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setError(null);
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      const submitFormData = new FormData();
      submitFormData.append("productId", formData.productId);
      submitFormData.append("name", formData.name.trim());
      submitFormData.append("price", formData.price);
      submitFormData.append("stockQuantity", formData.stockQuantity);
      submitFormData.append("categoryId", formData.categoryId);

      if (formData.image) {
        submitFormData.append("image", formData.image);
      }

      console.log("submit", submitFormData);
      

      const response = await fetch("http://localhost:8000/products", {
        method: "POST",
        body: submitFormData,
      });

      

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create product");
      }

      const data = await response.json();
      console.log("Product created successfully:", data);
      onCreate(submitFormData);
      onClose();
      
      // Reset form
      setFormData(initialFormData);
      setImagePreview(null);
    } catch (error) {
      console.error("Error creating product:", error);
      setError(error instanceof Error ? error.message : "Failed to create product");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  if (!isOpen) return null;

  const labelCssStyles = "block text-sm font-medium text-gray-700";
  const inputCssStyles =
    "block w-full mb-2 p-2 border-gray-500 border-2 rounded-md";

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-20">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <Header name="Create New Product" />
        {error && (
          <div className="mb-4 p-2 text-red-500 bg-red-100 rounded">
            {error}
          </div>
        )}
        <form className="mt-5">
          {/* IMAGE UPLOAD */}
          <div className="mb-4">
            <label htmlFor="image" className={labelCssStyles}>
              Product Image
            </label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleImageChange}
              className="mb-2"
              required
            />
            {imagePreview && (
              <div className="mt-2 relative w-full h-40">
                <Image
                  src={imagePreview}
                  alt="Preview"
                  fill
                  className="object-contain rounded-md"
                  priority
                />
              </div>
            )}
          </div>

          {/* PRODUCT NAME */}
          <label htmlFor="name" className={labelCssStyles}>
            Product Name
          </label>
          <input
            type="text"
            name="name"
            placeholder="Name"
            onChange={handleChange}
            value={formData.name}
            className={inputCssStyles}
            required
          />

          {/* PRICE */}
          <label htmlFor="price" className={labelCssStyles}>
            Price
          </label>
          <input
            type="number"
            name="price"
            placeholder="Price"
            onChange={handleChange}
            value={formData.price}
            className={inputCssStyles}
            min="0"
            step="0.01"
            required
          />

          {/* STOCK QUANTITY */}
          <label htmlFor="stockQuantity" className={labelCssStyles}>
            Stock Quantity
          </label>
          <input
            type="number"
            name="stockQuantity"
            placeholder="Stock Quantity"
            onChange={handleChange}
            value={formData.stockQuantity}
            className={inputCssStyles}
            min="0"
            required
          />

          {/* CATEGORY */}
          <label htmlFor="categoryId" className={labelCssStyles}>
            Category
          </label>
          <select
            name="categoryId"
            onChange={handleChange}
            value={formData.categoryId}
            className={inputCssStyles}
            required
          >
            <option value="">Select a category</option>
            {categories.map((category) => (
              <option key={category.categoryId} value={category.categoryId}>
                {category.name}
              </option>
            ))}
          </select>

          {/* CREATE ACTIONS */}
          <div className="flex justify-end gap-2 mt-4">
            <button
            onClick={handleSubmit}
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700 ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {isSubmitting ? 'Creating...' : 'Create'}
            </button>
            <button
              onClick={onClose}
              type="button"
              disabled={isSubmitting}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateProductModal;
