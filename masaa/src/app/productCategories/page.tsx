'use client';
import Header from "@/components/Header";
import { useState, useEffect } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";

type ProductCategory = {
    categoryId: string;
    name: string;
    description?: string;
    products?: any[]; 
};

const ProductCategories = () => {
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [currentCategory, setCurrentCategory] = useState<ProductCategory | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });

    // Fetch categories
    const fetchCategories = async () => {
        try {
            const response = await fetch('http://localhost:8000/products/categories');
            const data = await response.json();
            setCategories(data);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Handle form input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    // Open modal for creating new category
    const handleCreateNew = () => {
        setIsEditMode(false);
        setCurrentCategory(null);
        setFormData({ name: '', description: '' });
        setIsModalOpen(true);
    };

    // Open modal for editing category
    const handleEdit = (category: ProductCategory) => {
        setIsEditMode(true);
        setCurrentCategory(category);
        setFormData({
            name: category.name,
            description: category.description || ''
        });
        setIsModalOpen(true);
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        try {
            if (isEditMode && currentCategory) {
                // Update existing category
                const response = await fetch(`http://localhost:8000/products/categories/${currentCategory.categoryId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...formData,
                        categoryId: currentCategory.categoryId
                    }),
                });

                if (!response.ok) throw new Error('Failed to update category');
            } else {
                // Create new category
                const response = await fetch('http://localhost:8000/products/categories', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        ...formData,
                        categoryId: crypto.randomUUID()
                    }),
                });

                if (!response.ok) throw new Error('Failed to create category');
            }

            // Refresh categories list
            await fetchCategories();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    // Handle category deletion
    const handleDelete = async (categoryId: string) => {
        if (window.confirm('Are you sure you want to delete this category?')) {
            try {
                const response = await fetch(`http://localhost:8000/products/categories/${categoryId}`, {
                    method: 'DELETE',
                });

                if (!response.ok) throw new Error('Failed to delete category');

                await fetchCategories();
            } catch (error) {
                console.error('Error:', error);
            }
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <Header name="Product Categories" />
                <button
                    onClick={handleCreateNew}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Create New Category
                </button>
            </div>

            {/* Categories List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categories.map((category) => (
                    <div
                        key={category.categoryId}
                        className="bg-white p-4 rounded-lg shadow-md"
                    >
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="text-lg font-semibold">{category.name}</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(category)}
                                    className="text-blue-500 hover:text-blue-700"
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    onClick={() => handleDelete(category.categoryId)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <FaTrash />
                                </button>
                            </div>
                        </div>
                        <p className="text-gray-600">{category.description || 'No description'}</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Products: {category.products?.length || 0}
                        </p>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg w-96">
                        <h2 className="text-xl font-semibold mb-4">
                            {isEditMode ? 'Edit Category' : 'Create New Category'}
                        </h2>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    className="w-full p-2 border rounded"
                                    rows={3}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                >
                                    {isEditMode ? 'Update' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductCategories;
