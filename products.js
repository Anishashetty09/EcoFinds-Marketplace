const { body, validationResult } = require('express-validator');

const express = require('express');

const authenticateToken = require('../middleware/auth');
const db = require('../db/database');

const router = express.Router();

// Get all products (public)
router.get('/', (req, res) => {
  const query = `SELECT * FROM products`;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});

// Get single product by ID (public)
router.get('/:id', (req, res) => {
  const query = `SELECT * FROM products WHERE id = ?`;
  db.get(query, [req.params.id], (err, product) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  });
});

// Create new product (protected)
router.post('/', authenticateToken, (req, res) => {
  const { name, description, price, image_url } = req.body;
  if (!name || !price) return res.status(400).json({ message: 'Name and price are required' });

  const query = `INSERT INTO products (name, description, price, image_url) VALUES (?, ?, ?, ?)`;
  db.run(query, [name, description, price, image_url], function(err) {
    if (err) return res.status(500).json({ message: err.message });
    res.status(201).json({ id: this.lastID, name, description, price, image_url });
  });
});

// Update a product (protected)
router.put('/:id', authenticateToken, (req, res) => {
  const { name, description, price, image_url } = req.body;
  const { id } = req.params;

  // First check if product exists
  const checkQuery = `SELECT * FROM products WHERE id = ?`;
  db.get(checkQuery, [id], (err, product) => {
    if (err) return res.status(500).json({ message: err.message });
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Update product
    const updateQuery = `
      UPDATE products
      SET name = ?, description = ?, price = ?, image_url = ?
      WHERE id = ?`;
    db.run(updateQuery, [name || product.name, description || product.description, price || product.price, image_url || product.image_url, id], function(err) {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ id, name: name || product.name, description: description || product.description, price: price || product.price, image_url: image_url || product.image_url });
    });
  });
});

// Delete product (protected)
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM products WHERE id = ?`;
  db.run(query, [id], function(err) {
    if (err) return res.status(500).json({ message: err.message });
    if (this.changes === 0) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted' });
  });
});

module.exports = router;
