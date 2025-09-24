const mongoose = require('mongoose');

const entriesSchema = new mongoose.Schema({
    grinNo: {
        type: String,
        required: true
    },
    grinDate: {
        type: Date,
        required: true
    },
    gsn: {
        type: String,
        required: true
    },
    gsnDate: {
        type: Date,
        required: true
    },
    poNo: {
        type: String,
        required: true
    },
    poDate: {
        type: Date,
        required: true
    },
    partyName: {
        type: String,
        required: true
    },
    innoviceno: {
        type: String,
        required: true
    },
    innoviceDate: {
        type: Date,
        required: true
    },
    receivedFrom: {
        type: String,
        required: true
    },
    lrNo: {
        type: String,
        required: true
    },
    lrDate: {
        type: Date,
        required: true
    },
    transName: {
        type: String,
        required: true
    },
    vehicleNo: {
        type: String,
        required: true
    },
    file: {
        type: String
    },
    GeneralManagerSigned: {
        type: Boolean,
        default: false
    },
    StoreManagerSigned: {
        type: Boolean,
        default: false
    },
    PurchaseManagerSigned: {
        type: Boolean,
        default: false
    },
    AccountManagerSigned: {
        type: Boolean,
        default: false
    },
    isHidden: {
        type: Boolean,
        default: false
    },
    photoPath: {
        type: String,
        required: false,
    },
    // Added New Fields (GRIN)
    gstNo: { type: String, required: false },
    cgst: { type: Number, required: false },
    sgst: { type: Number, required: false },
    igst: { type: Number, required: false },
    companyName: { type: String, required: false },
    address: { type: String, required: false },
    mobileNo: { type: String, required: false },
    gstTax: { type: Number, required: false },
    materialTotal: { type: Number, required: false },
    totalAmount: { type: Number, required: false },
    tableData: [{
        item: String,
        description: String,
        quantityValue: Number,
        priceValue: Number,
        priceType: String,
        total: Number
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Entries', entriesSchema); 