const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplier.controller');

router.get('/suppliers', supplierController.getSuppliers);
router.post('/suppliers', supplierController.addSupplier);
router.get('/supplier-details', supplierController.getSupplierDetails);
router.put('/supplier/:partyName', supplierController.updateSupplier);
router.delete('/supplier/:partyName', supplierController.deleteSupplier);

module.exports = router; 