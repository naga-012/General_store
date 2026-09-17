const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  uploadProductImage,
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/admin');
const upload = require('../middleware/upload');

router.route('/').get(getProducts).post(protect, adminOnly, createProduct);

router.post(
  '/upload-image',
  protect,
  adminOnly,
  upload.single('image'),
  uploadProductImage
);

router
  .route('/:id')
  .get(getProductById)
  .put(protect, adminOnly, updateProduct)
  .delete(protect, adminOnly, deleteProduct);

router.patch('/:id/toggle-status', protect, adminOnly, toggleProductStatus);

module.exports = router;
