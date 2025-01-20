import { Router } from "express";
import multer from "multer";
import { addProductToCategory, createProduct, createProductCategory, deleteProduct, deleteProductCategory, getNewArrivals, getProductCategories, getProducts, getProductsByCategory, updateProduct } from "../controllers/productController";

const router = Router();

// Configure multer to use memory storage instead of disk storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'));
        }
        cb(null, true);
    }
});

router.get("/", getProducts);
router.post("/", upload.single('image'), createProduct);
router.put('/products/:productId', updateProduct);
router.delete('/products/:productId', deleteProduct);
router.post('/categories', createProductCategory);
router.delete('/categories/:categoryId', deleteProductCategory);
router.get('/categories', getProductCategories);
router.get('/categories/:categoryId/products', getProductsByCategory);
router.post('/categories/add-product', addProductToCategory);
router.get('/newArrivals', getNewArrivals);


export default router;