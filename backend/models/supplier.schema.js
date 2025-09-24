const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
  partyName: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    type: String,
    default: ''
  },
  gstNo: {
    type: String,
    default: ''
  },
  mobileNo: {
    type: String,
    default: ''
  },
  companyName: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

const Supplier = mongoose.model('Supplier', supplierSchema);

module.exports = Supplier;

