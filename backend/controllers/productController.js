const Product = require('../models/Product');
const Category = require('../models/Category');
const { emitProductChange } = require('../services/socketService');

// @desc    Get all products with filtering, search and sorting
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    const {
      keyword,
      category,
      minPrice,
      maxPrice,
      inStock,
      sort,
      includeInactive,
      page = 1,
      limit = 50,
    } = req.query;

    const query = {};

    // Inactive filter for customer vs admin
    if (includeInactive !== 'true') {
      query.status = 'active';
    }

    // Keyword search
    if (keyword && keyword.trim()) {
      query.$or = [
        { name: { $regex: keyword.trim(), $options: 'i' } },
        { description: { $regex: keyword.trim(), $options: 'i' } },
      ];
    }

    // Category filter
    if (category && category !== 'all') {
      if (category.match(/^[0-9a-fA-F]{24}$/)) {
        query.category = category;
      } else {
        const foundCategory = await Category.findOne({
          $or: [
            { slug: category.toLowerCase() },
            { name: { $regex: new RegExp(`^${category}$`, 'i') } },
          ],
        });
        if (foundCategory) {
          query.category = foundCategory._id;
        }
      }
    }

    // Stock availability filter
    if (inStock === 'true') {
      query['variants.stock'] = { $gt: 0 };
    }

    let productsQuery = Product.find(query).populate('category', 'name slug');

    // Sorting
    if (sort === 'price-asc') {
      productsQuery = productsQuery.sort({ 'variants.0.price': 1 });
    } else if (sort === 'price-desc') {
      productsQuery = productsQuery.sort({ 'variants.0.price': -1 });
    } else if (sort === 'newest') {
      productsQuery = productsQuery.sort({ createdAt: -1 });
    } else if (sort === 'popular') {
      productsQuery = productsQuery.sort({ isFeatured: -1, createdAt: -1 });
    } else {
      productsQuery = productsQuery.sort({ createdAt: -1 });
    }

    let products = await productsQuery;

    if (minPrice || maxPrice) {
      const min = minPrice ? Number(minPrice) : 0;
      const max = maxPrice ? Number(maxPrice) : Infinity;

      products = products.filter((p) => {
        const hasVariantInRange = p.variants.some(
          (v) => v.price >= min && v.price <= max
        );
        return hasVariantInRange;
      });
    }

    res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single product details
// @route   GET /api/products/:id
// @access  Public
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category', 'name slug');
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }
    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  try {
    const {
      name,
      image,
      category,
      description,
      variants,
      status,
      isFeatured,
      lowStockThreshold,
    } = req.body;

    if (!name || !category || !variants || variants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide product name, category, and at least one pricing variant',
      });
    }

    // Validate variants
    for (const v of variants) {
      if (!v.unit || v.price === undefined || v.price < 0) {
        return res.status(400).json({
          success: false,
          message: 'Each variant must have a valid unit (e.g., 250g, 1kg) and non-negative price',
        });
      }
    }

    const product = await Product.create({
      name: name.trim(),
      image: image || '',
      category,
      description: description || '',
      variants,
      status: status || 'active',
      isFeatured: isFeatured || false,
      lowStockThreshold: lowStockThreshold !== undefined ? Number(lowStockThreshold) : 10,
    });

    const populatedProduct = await Product.findById(product._id).populate('category', 'name slug');

    // Emit live socket event
    emitProductChange({ type: 'create', product: populatedProduct });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product: populatedProduct,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const {
      name,
      image,
      category,
      description,
      variants,
      status,
      isFeatured,
      lowStockThreshold,
    } = req.body;

    if (name) product.name = name.trim();
    if (image !== undefined) product.image = image;
    if (category) product.category = category;
    if (description !== undefined) product.description = description;
    if (variants && variants.length > 0) product.variants = variants;
    if (status !== undefined) product.status = status;
    if (isFeatured !== undefined) product.isFeatured = isFeatured;
    if (lowStockThreshold !== undefined) product.lowStockThreshold = Number(lowStockThreshold);

    const updatedProduct = await product.save();
    const populated = await Product.findById(updatedProduct._id).populate('category', 'name slug');

    // Emit live socket event
    emitProductChange({ type: 'update', product: populated });

    res.json({
      success: true,
      message: 'Product updated successfully',
      product: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const productId = product._id;
    await product.deleteOne();

    // Emit live socket event
    emitProductChange({ type: 'delete', productId });

    res.json({ success: true, message: 'Product removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle product active/inactive
// @route   PATCH /api/products/:id/toggle-status
// @access  Private/Admin
const toggleProductStatus = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    product.status = product.status === 'active' ? 'inactive' : 'active';
    await product.save();

    const populated = await Product.findById(product._id).populate('category', 'name slug');

    // Emit live socket event
    emitProductChange({ type: 'status_toggle', product: populated });

    res.json({
      success: true,
      message: `Product marked as ${product.status}`,
      product: populated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload product image
// @route   POST /api/products/upload-image
// @access  Private/Admin
const uploadProductImage = (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      message: 'Image uploaded successfully',
      imageUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  uploadProductImage,
};
