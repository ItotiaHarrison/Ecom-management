import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { v2 as cloudinary } from "cloudinary";

const prisma = new PrismaClient();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const getProducts = async (req: Request, res: Response): Promise<void> => {
    try {
        const search = req.query.search?.toString();
        const products = await prisma.products.findMany({
            where: {
                name: {
                    contains: search
                }
            }
        })
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving products" })
    }
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate required fields
        const missingFields = [];
        if (!req.body.name) missingFields.push('name');
        if (!req.body.price) missingFields.push('price');
        if (!req.body.stockQuantity) missingFields.push('stockQuantity');
        if (!req.body.categoryId) missingFields.push('categoryId');
        if (!req.file) missingFields.push('image');

        if (missingFields.length > 0) {
            res.status(400).json({
                message: 'Missing required fields',
                missingFields
            });
            return;
        }

        let imageUrl = null;

        // Upload to Cloudinary if file exists
        if (req.file) {
            try {
                // Convert buffer to Base64
                const b64 = Buffer.from(req.file.buffer).toString('base64');
                const dataURI = `data:${req.file.mimetype};base64,${b64}`;
                
                // Upload to Cloudinary
                const result = await cloudinary.uploader.upload(dataURI, {
                    folder: 'products',
                    resource_type: 'auto'
                });
                
                imageUrl = result.secure_url;
            } catch (uploadError) {
                console.error('Cloudinary upload error:', uploadError);
                res.status(500).json({
                    message: 'Error uploading image',
                    error: uploadError instanceof Error ? uploadError.message : 'Unknown error'
                });
                return;
            }
        }

        // Create product in database
        const product = await prisma.products.create({
            data: {
                productId: req.body.productId,
                name: req.body.name,
                price: parseFloat(req.body.price),
                stockQuantity: parseInt(req.body.stockQuantity),
                imageUrl,
                categories: {
                    connect: { categoryId: req.body.categoryId }
                }
            },
            include: {
                categories: true
            }
        });

        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({
            message: 'Server error',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};



export const updateProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId } = req.params;
        const { name, price, stockQuantity, categoryId } = req.body;

        const existingProduct = await prisma.products.findUnique({
            where: { productId }
        });

        if (!existingProduct) {
            res.status(404).json({ message: "Product not found" });
            return;
        }

        let imageUrl = existingProduct.imageUrl;

        // Handle image update if new file is provided
        if (req.file) {
            try {
                // Delete old image from Cloudinary if it exists
                if (existingProduct.imageUrl) {
                    const publicId = existingProduct.imageUrl.split('/').pop()?.split('.')[0];
                    if (publicId) {
                        await cloudinary.uploader.destroy(`products/${publicId}`);
                    }
                }

                // Upload new image
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'products',
                    resource_type: 'auto'
                });
                imageUrl = result.secure_url;
            } catch (error) {
                console.error('Cloudinary operation error:', error);
                res.status(500).json({ message: "Error handling image update" });
                return;
            }
        }

        const updatedProduct = await prisma.products.update({
            where: { productId },
            data: {
                name,
                price: parseFloat(price),
                stockQuantity: parseInt(stockQuantity),
                imageUrl,
                categories: {
                    set: [],
                    connect: { categoryId }
                }
            },
            include: {
                categories: true
            }
        });

        res.json(updatedProduct);
    } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ message: "Error updating product" });
    }
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId } = req.params;

        const product = await prisma.products.findUnique({
            where: { productId }
        });

        if (!product) {
            res.status(404).json({ message: "Product not found" });
            return;
        }

        // Delete image from Cloudinary if it exists
        if (product.imageUrl) {
            try {
                const publicId = product.imageUrl.split('/').pop()?.split('.')[0];
                if (publicId) {
                    await cloudinary.uploader.destroy(`products/${publicId}`);
                }
            } catch (error) {
                console.error('Cloudinary delete error:', error);
                // Continue with product deletion even if image deletion fails
            }
        }

        await prisma.products.delete({
            where: { productId }
        });

        res.status(200).json({ message: "Product deleted successfully" });
    } catch (error) {
        console.error("Error deleting product:", error);
        res.status(500).json({ message: "Error deleting product" });
    }
};


export const createProductCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { categoryId, name, description } = req.body;
        const category = await prisma.productCategory.create({
            data: {
                categoryId,
                name,
                description
            }
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: "Error creating product category" });
    }
};

export const deleteProductCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { categoryId } = req.params;
        await prisma.productCategory.delete({
            where: {
                categoryId: categoryId
            }
        });
        res.status(200).json({ message: "Product category deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting product category" });
    }
};

export const getProductCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const categories = await prisma.productCategory.findMany({
            include: {
                products: true 
            }
        });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving product categories" });
    }
};

export const getProductsByCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { categoryId } = req.params;
        const products = await prisma.productCategory.findUnique({
            where: {
                categoryId: categoryId
            },
            include: {
                products: true 
            }
        });

        if (!products) {
            res.status(404).json({ message: "Category not found" });
            return;
        }

        res.json(products);
    } catch (error) {
        res.status(500).json({ message: "Error retrieving products by category" });
    }
};

export const addProductToCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { productId, categoryId } = req.body;
        const updatedProduct = await prisma.products.update({
            where: {
                productId: productId
            },
            data: {
                categories: {
                    connect: {
                        categoryId: categoryId
                    }
                }
            },
            include: {
                categories: true
            }
        });
        res.json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: "Error adding product to category" });
    }
};

export const getNewArrivals = async (req: Request, res: Response): Promise<void> => {
    try {
        // Calculate the date 2 months ago from current date
        const twoMonthsAgo = new Date();
        twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

        // Get all products created within the last 2 months
        const newArrivals = await prisma.productCategory.findMany({
            include: {
                products: {
                    where: {
                        createdAt: {
                            gte: twoMonthsAgo
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            },
            // Only include categories that have products in the last 2 months
            where: {
                products: {
                    some: {
                        createdAt: {
                            gte: twoMonthsAgo
                        }
                    }
                }
            }
        });

        // Filter out categories with no products
        const filteredCategories = newArrivals.filter(
            category => category.products.length > 0
        );

        res.json(filteredCategories);
    } catch (error) {
        console.error('Error retrieving new arrivals:', error);
        res.status(500).json({ 
            message: "Error retrieving new arrivals",
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

