const gsnEntries = require('../models/gsnInventry.Schema');
const Supplier = require('../models/supplier.schema');

// GET /api/suppliers
exports.getSuppliers = async (req, res) => {
  try {
    // Get suppliers from both GSN data and dedicated Supplier collection
    const [gsnSuppliers, dedicatedSuppliers] = await Promise.all([
      gsnEntries.find({}, {
        partyName: 1,
        address: 1,
        gstNo: 1,
        mobileNo: 1,
        companyName: 1,
        cgst: 1,
        sgst: 1,
        igst: 1,
        totalAmount: 1,
        materialTotal: 1,
        gstTax: 1,
        _id: 0
      }),
      Supplier.find({ isActive: true }, {
        partyName: 1,
        address: 1,
        gstNo: 1,
        mobileNo: 1,
        companyName: 1,
        email: 1,
        _id: 0
      })
    ]);

    // Create a map to merge data
    const supplierMap = new Map();

    // Add GSN suppliers first (they have more complete data)
    gsnSuppliers.forEach(supplier => {
      if (supplier.partyName) {
        supplierMap.set(supplier.partyName, {
          partyName: supplier.partyName,
          address: supplier.address || '',
          gstNo: supplier.gstNo || '',
          mobileNo: supplier.mobileNo || '',
          companyName: supplier.companyName || '',
          email: '',
          cgst: supplier.cgst || 0,
          sgst: supplier.sgst || 0,
          igst: supplier.igst || 0,
          totalAmount: supplier.totalAmount || 0,
          materialTotal: supplier.materialTotal || 0,
          gstTax: supplier.gstTax || 0,
          source: 'GSN'
        });
      }
    });

    // Add dedicated suppliers (only if not already exists from GSN)
    dedicatedSuppliers.forEach(supplier => {
      if (supplier.partyName && !supplierMap.has(supplier.partyName)) {
        supplierMap.set(supplier.partyName, {
          partyName: supplier.partyName,
          address: supplier.address || '',
          gstNo: supplier.gstNo || '',
          mobileNo: supplier.mobileNo || '',
          companyName: supplier.companyName || '',
          email: supplier.email || '',
          cgst: 0,
          sgst: 0,
          igst: 0,
          totalAmount: 0,
          materialTotal: 0,
          gstTax: 0,
          source: 'Dedicated'
        });
      }
    });

    // Convert map to array and sort
    const allSuppliers = Array.from(supplierMap.values()).sort((a, b) => {
      const nameA = (a.partyName || '').trim().toLowerCase();
      const nameB = (b.partyName || '').trim().toLowerCase();
      return nameA.localeCompare(nameB);
    });

    res.json(allSuppliers);
  } catch (err) {
    console.error('Get suppliers error:', err);
    res.status(500).json({ error: 'Failed to fetch suppliers' });
  }
};

// POST /api/suppliers
exports.addSupplier = async (req, res) => {
  try {
    const { partyName, address, gstNo, mobileNo, companyName, email } = req.body;
    
    // Validate required fields
    if (!partyName || partyName.trim() === '') {
      return res.status(400).json({ error: 'Supplier name is required' });
    }
    
    // Check if supplier already exists
    const existingSupplier = await Supplier.findOne({ partyName: partyName.trim() });
    if (existingSupplier) {
      return res.status(400).json({ error: 'Supplier with this name already exists' });
    }
    
    // Create a new supplier entry
    const newSupplier = new Supplier({
      partyName: partyName.trim(),
      address: address || '',
      gstNo: gstNo || '',
      mobileNo: mobileNo || '',
      companyName: companyName || '',
      email: email || '',
      isActive: true
    });
    
    await newSupplier.save();
    res.status(201).json({
      partyName: newSupplier.partyName,
      address: newSupplier.address,
      gstNo: newSupplier.gstNo,
      mobileNo: newSupplier.mobileNo,
      companyName: newSupplier.companyName,
      email: newSupplier.email
    });
  } catch (err) {
    console.error('Add supplier error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Supplier with this name already exists' });
    }
    res.status(500).json({ error: 'Failed to add supplier: ' + err.message });
  }
};

// GET /api/supplier-details?partyName=...
exports.getSupplierDetails = async (req, res) => {
  try {
    const { partyName } = req.query;
    if (!partyName) return res.status(400).json({ error: 'partyName is required' });
    
    // Get GSN/GRIN details from gsnEntries
    const entries = await gsnEntries.find({ partyName }, { gsn: 1, grinNo: 1, _id: 0 });
    res.json(entries);
  } catch (err) {
    console.error('Get supplier details error:', err);
    res.status(500).json({ error: 'Failed to fetch supplier details' });
  }
};

// PUT /api/supplier/:partyName
exports.updateSupplier = async (req, res) => {
  try {
    const { partyName } = req.params;
    const { partyName: newPartyName, address, gstNo, mobileNo, companyName, email } = req.body;
    
    const updateData = {};
    if (newPartyName) updateData.partyName = newPartyName.trim();
    if (address !== undefined) updateData.address = address;
    if (gstNo !== undefined) updateData.gstNo = gstNo;
    if (mobileNo !== undefined) updateData.mobileNo = mobileNo;
    if (companyName !== undefined) updateData.companyName = companyName;
    if (email !== undefined) updateData.email = email;
    
    const result = await Supplier.updateOne(
      { partyName, isActive: true },
      { $set: updateData }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'No supplier found to update' });
    }
    
    res.json({ success: true, modifiedCount: result.modifiedCount });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Failed to update supplier' });
  }
};

// DELETE /api/supplier/:partyName
exports.deleteSupplier = async (req, res) => {
  try {
    const { partyName } = req.params;
    const result = await Supplier.updateOne(
      { partyName, isActive: true },
      { $set: { isActive: false } }
    );
    
    if (result.modifiedCount === 0) {
      return res.status(404).json({ error: 'No supplier found to delete' });
    }
    
    res.json({ success: true, message: 'Supplier deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete supplier' });
  }
}; 