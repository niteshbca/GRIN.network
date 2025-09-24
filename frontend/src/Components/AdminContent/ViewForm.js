import React, { useEffect, useState } from 'react';
import styles from '../../Components/Approval/Approval.module.css';
import axios from 'axios';
import TableComponent from '../../Components/Table/Table.rendering';
import LogOutComponent from '../LogOut/LogOutComponent';
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Modal from 'react-modal';
import TableEntry from '../../Components/Table/TableEntry';

// Format date function
const formatDate = (oldFormat) => {
    if (!oldFormat) return "N/A";
    const date = new Date(oldFormat);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    const formattedTime = date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
    });
    return `${formattedDate}, ${formattedTime}`;
};

// Add a new function to format date only with year
const formatDateOnly = (oldFormat) => {
    if (!oldFormat) return "N/A";
    const date = new Date(oldFormat);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
};

// Add a new function to format time only
const formatTimeOnly = (oldFormat) => {
    if (!oldFormat) return "N/A";
    const date = new Date(oldFormat);
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        hour12: true
    });
};

export default function ViewForm({ managerType }) {
    const [visibleItem, setVisibleItem] = useState(null);
    const [combinedList, setCombinedList] = useState([]);
    const url = process.env.REACT_APP_BACKEND_URL;

    // State for search
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredCombinedList, setFilteredCombinedList] = useState([]);

    const isImageFile = (filename) => {
        if (!filename) return false;
        const extension = filename.split('.').pop().toLowerCase();
        return ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension);
    };
   
    const handleDownloadPDF = (index, groupIndex) => {
        const divElement = document.getElementById(`div-${index}-group-${groupIndex}`);
        if (!divElement) return;

        const partyName = combinedList[index]?.partyName || `document-${index}`;
        const sanitizedPartyName = partyName.replace(/[^a-zA-Z0-9]/g, '_');

        // Select elements to hide, including the bill details link/image wrappers
        const elementsToHide = divElement.querySelectorAll('.hide-in-pdf'); 
        const downloadButton = divElement.querySelector('.download-pdf-button');
        
        const originalDisplayValues = {
            elementsToHide: Array.from(elementsToHide).map(el => el.style.display),
            downloadButton: downloadButton ? downloadButton.style.display : null
        };

        elementsToHide.forEach(el => {
            el.style.display = 'none';
        });
        if (downloadButton) {
            downloadButton.style.display = 'none';
        }

        setTimeout(() => {
            html2canvas(divElement, { 
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            }).then((canvas) => {
                const imgData = canvas.toDataURL("image/png");
                const pdf = new jsPDF("p", "mm", "a4");
                const imgWidth = 210;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                let position = 0;
                const pageHeight = 295;
                let heightLeft = imgHeight;

                pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;

                while (heightLeft >= 0) {
                    position = heightLeft - imgHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                    heightLeft -= pageHeight;
                }
                
                pdf.save(`${sanitizedPartyName}_Group${groupIndex + 1}_Approved.pdf`);

                // Restore display
                elementsToHide.forEach((el, i) => {
                    el.style.display = originalDisplayValues.elementsToHide[i];
                });
                if (downloadButton) {
                    downloadButton.style.display = originalDisplayValues.downloadButton;
                }
            }).catch(err => {
                console.error("Error generating PDF:", err);
                // Restore display on error
                elementsToHide.forEach((el, i) => {
                    el.style.display = originalDisplayValues.elementsToHide[i];
                });
                if (downloadButton) {
                    downloadButton.style.display = originalDisplayValues.downloadButton;
                }
            });
        }, 100);
    };
  
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('authToken');
                const url = process.env.REACT_APP_BACKEND_URL;
                
                const [gsnResponse, grnResponse] = await Promise.all([
                    axios.get(`${url}/gsn/getdata`, {
                        headers: {
                          'Authorization': `Bearer ${token}`,
                          'Content-Type': 'application/json'
                        }
                    }),
                    axios.get(`${url}/entries/getdata1`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    })
                ]);

                // Sort individual lists first
                const sortedGsnData = (gsnResponse.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                const sortedGrnData = (grnResponse.data || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

                console.log('Sorted GSN Data:', sortedGsnData);
                console.log('Sorted GRN Data:', sortedGrnData);

                const combined = {};
                
                // Process sorted GSN documents
                (sortedGsnData).forEach(doc => {
                    if (doc.isHidden) return;

                    if (!combined[doc.partyName]) {
                        combined[doc.partyName] = {
                            partyName: doc.partyName,
                            gsnDocuments: [],
                            grnDocuments: [],
                            GeneralManagerSigned: doc.GeneralManagerSigned,
                            StoreManagerSigned: doc.StoreManagerSigned,
                            PurchaseManagerSigned: doc.PurchaseManagerSigned,
                            AccountManagerSigned: doc.AccountManagerSigned,
                            AuditorSigned: doc.AuditorSigned
                        };
                    }
                    combined[doc.partyName].gsnDocuments.push(doc);
                    if (combined[doc.partyName].GeneralManagerSigned === undefined) combined[doc.partyName].GeneralManagerSigned = doc.GeneralManagerSigned;
                    if (combined[doc.partyName].StoreManagerSigned === undefined) combined[doc.partyName].StoreManagerSigned = doc.StoreManagerSigned;
                    if (combined[doc.partyName].PurchaseManagerSigned === undefined) combined[doc.partyName].PurchaseManagerSigned = doc.PurchaseManagerSigned;
                    if (combined[doc.partyName].AccountManagerSigned === undefined) combined[doc.partyName].AccountManagerSigned = doc.AccountManagerSigned;
                    if (combined[doc.partyName].AuditorSigned === undefined) combined[doc.partyName].AuditorSigned = doc.AuditorSigned;
                });

                // Process sorted GRN documents
                (sortedGrnData).forEach(doc => {
                    if (doc.isHidden) return;

                    if (!combined[doc.partyName]) {
                        combined[doc.partyName] = {
                            partyName: doc.partyName,
                            gsnDocuments: [],
                            grnDocuments: [],
                            GeneralManagerSigned: doc.GeneralManagerSigned,
                            StoreManagerSigned: doc.StoreManagerSigned,
                            PurchaseManagerSigned: doc.PurchaseManagerSigned,
                            AccountManagerSigned: doc.AccountManagerSigned,
                            AuditorSigned: doc.AuditorSigned
                        };
                    }
                    combined[doc.partyName].grnDocuments.push(doc);
                    if (combined[doc.partyName].GeneralManagerSigned === undefined) combined[doc.partyName].GeneralManagerSigned = doc.GeneralManagerSigned;
                    if (combined[doc.partyName].StoreManagerSigned === undefined) combined[doc.partyName].StoreManagerSigned = doc.StoreManagerSigned;
                    if (combined[doc.partyName].PurchaseManagerSigned === undefined) combined[doc.partyName].PurchaseManagerSigned = doc.PurchaseManagerSigned;
                    if (combined[doc.partyName].AccountManagerSigned === undefined) combined[doc.partyName].AccountManagerSigned = doc.AccountManagerSigned;
                    if (combined[doc.partyName].AuditorSigned === undefined) combined[doc.partyName].AuditorSigned = doc.AuditorSigned;
                });

                const combinedListData = Object.values(combined);

                // Function to get the latest createdAt from a group
                const getLatestDate = (item) => {
                    const dates = [
                        ...(item.gsnDocuments || []).map(d => new Date(d.createdAt)),
                        ...(item.grnDocuments || []).map(d => new Date(d.createdAt))
                    ].filter(d => !isNaN(d)); // Filter out invalid dates
                    return dates.length > 0 ? Math.max(...dates.map(d => d.getTime())) : 0; // Use getTime() for comparison
                };

                // Sort the final combined list
                combinedListData.sort((a, b) => getLatestDate(b) - getLatestDate(a));

                console.log('Sorted Combined List Data:', combinedListData);
                setCombinedList(combinedListData);

            } catch (error) {
                console.error('Error fetching data:', error);
                console.error('Error details:', error.response?.data);
            }
        };

        fetchData();
    }, []);

    // useEffect for filtering based on searchTerm
    useEffect(() => {
        let filtered = combinedList;
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            filtered = combinedList.filter(item => {
                // Check party name
                const partyNameMatch = item.partyName.toLowerCase().includes(searchLower);
                
                // Check GRN/GRIN in both GSN and GRN documents
                const gsnMatch = item.gsnDocuments.some(doc => 
                    (doc.grinNo && doc.grinNo.toLowerCase().includes(searchLower)) ||
                    (doc.gsn && doc.gsn.toLowerCase().includes(searchLower))
                );
                
                const grnMatch = item.grnDocuments.some(doc => 
                    (doc.grinNo && doc.grinNo.toLowerCase().includes(searchLower)) ||
                    (doc.gsn && doc.gsn.toLowerCase().includes(searchLower))
                );

                return partyNameMatch || gsnMatch || grnMatch;
            });
        }
        setFilteredCombinedList(filtered);
    }, [searchTerm, combinedList]);

    const showHandler = (index) => {
        setVisibleItem(visibleItem === index ? null : index);
    };
    
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editGsnData, setEditGsnData] = useState(null);
    const [editGrnData, setEditGrnData] = useState(null);
    const [editGsnTableData, setEditGsnTableData] = useState([]);
    const [editGrnTableData, setEditGrnTableData] = useState([]);

    // Delete Party Handler
    const handleDeleteParty = async (partyName) => {
        if (!window.confirm(`Are you sure you want to delete all records for party: ${partyName}?`)) return;
        try {
            const token = localStorage.getItem('authToken');
            await axios.delete(`${url}/gsn/upload-data/delete-by-party/${encodeURIComponent(partyName)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            await axios.delete(`${url}/entries/delete-by-party/${encodeURIComponent(partyName)}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setCombinedList(prev => prev.filter(item => item.partyName !== partyName));
            setFilteredCombinedList(prev => prev.filter(item => item.partyName !== partyName));
            alert('Party deleted successfully!');
        } catch (err) {
            let msg = 'Error deleting party.';
            if (err.response && err.response.data && err.response.data.message) {
                msg += ' ' + err.response.data.message;
            }
            alert(msg);
            console.error(err);
        }
    };
    // Edit Party Handler
    const handleEditParty = (partyName) => {
        console.log('=== EDIT PARTY HANDLER START ===');
        console.log('Party name to edit:', partyName);
        
        // Find the party data
        const party = combinedList.find(item => item.partyName === partyName);
        console.log('Found party data:', party);
        
        if (party) {
            // Get the first GSN and GRN documents for editing
            const gsnDoc = party.gsnDocuments[0] || null;
            const grnDoc = party.grnDocuments[0] || null;
            
            console.log('GSN document found:', gsnDoc);
            console.log('GRN document found:', grnDoc);
            console.log('GSN tableData:', gsnDoc?.tableData);
            console.log('GRN tableData:', grnDoc?.tableData);
            
            // Set GSN data
            if (gsnDoc) {
                const gsnDataCopy = { ...gsnDoc };
                console.log('Setting GSN data:', gsnDataCopy);
                setEditGsnData(gsnDataCopy);
                setEditGsnTableData(gsnDoc.tableData ? [...gsnDoc.tableData] : []);
            } else {
                console.log('No GSN document found, setting to null');
                setEditGsnData(null);
                setEditGsnTableData([]);
            }
            
            // Set GRN data
            if (grnDoc) {
                const grnDataCopy = { ...grnDoc };
                console.log('Setting GRN data:', grnDataCopy);
                setEditGrnData(grnDataCopy);
                setEditGrnTableData(grnDoc.tableData ? [...grnDoc.tableData] : []);
            } else {
                console.log('No GRN document found, setting to null');
                setEditGrnData(null);
                setEditGrnTableData([]);
            }
            
            console.log('=== EDIT PARTY HANDLER COMPLETE ===');
            setEditModalOpen(true);
        } else {
            console.error('Party not found in combinedList:', partyName);
        }
    };
    // Save Edit Handler
        const handleEditTableChange = (index, field, value, type) => {
        console.log(`Table change - Type: ${type}, Index: ${index}, Field: ${field}, Value: ${value}`);
        
        if (type === 'gsn') {
            console.log('GSN table change - Before update:', editGsnTableData);
            setEditGsnTableData(prev => {
                const updated = [...prev];
                updated[index] = { ...updated[index], [field]: value };
                // Calculate total for the row
                if (field === 'quantityValue' || field === 'priceValue') {
                    const quantityValue = parseFloat(updated[index].quantityValue) || 0;
                    const priceValue = parseFloat(updated[index].priceValue) || 0;
                    updated[index].total = quantityValue * priceValue;
                }
                console.log('GSN table change - After update:', updated);
                return updated;
            });
        } else if (type === 'grn') {
            console.log('GRN table change - Before update:', editGrnTableData);
            setEditGrnTableData(prev => {
                const updated = [...prev];
                updated[index] = { ...updated[index], [field]: value };
                // Calculate total for the row
                if (field === 'quantityValue' || field === 'priceValue') {
                    const quantityValue = parseFloat(updated[index].quantityValue) || 0;
                    const priceValue = parseFloat(updated[index].priceValue) || 0;
                    updated[index].total = quantityValue * priceValue;
                }
                console.log('GRN table change - After update:', updated);
                return updated;
            });
        } else {
            console.error('Unknown table type:', type);
        }
    };

    const handleSaveEdit = async () => {
        try {
            const token = localStorage.getItem('authToken');
            let backendUrl = process.env.REACT_APP_BACKEND_URL;
            
            // Fallback URL if environment variable is not set
            if (!backendUrl) {
                backendUrl = 'http://localhost:5001';
                console.warn('Backend URL not found in environment, using fallback:', backendUrl);
            }
            
            console.log('Backend URL:', backendUrl);
            console.log('Auth Token:', token ? 'Present' : 'Missing');
            console.log('Saving GSN data:', editGsnData);
            console.log('Saving GRN data:', editGrnData);
            
            if (!token) {
                throw new Error('Authentication token is missing');
            }
            
            // Check if we have any data to update
            if (!editGsnData && !editGrnData) {
                throw new Error('No data available for updating');
            }
            
            // Test API connectivity first
            try {
                const testResponse = await axios.get(`${backendUrl}/gsn/getdata`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
                console.log('API connectivity test successful:', testResponse.status);
            } catch (testErr) {
                console.error('API connectivity test failed:', testErr);
                throw new Error(`Cannot connect to backend server: ${testErr.message}`);
            }
            
            // Update GSN data if it exists
            if (editGsnData && editGsnData.partyName) {
                console.log('=== GSN UPDATE PROCESS START ===');
                
                // Clean and validate the data before sending
                const cleanedGsnData = {};
                
                // Only copy specific fields that we want to update
                const allowedFields = [
                    'partyName', 'companyName', 'address', 'gstNo', 'mobileNo',
                    'cgst', 'sgst', 'igst', 'grinNo', 'grinDate', 'gsn', 'gsnDate',
                    'poNo', 'poDate', 'innoviceno', 'innoviceDate', 'lrNo', 'lrDate',
                    'transName', 'vehicleNo', 'gstTax', 'materialTotal', 'totalAmount'
                ];
                
                // Remove any MongoDB-specific fields that might cause issues
                const forbiddenFields = ['_id', '__v', 'createdAt', 'updatedAt', 'isHidden', 'GeneralManagerSigned', 'StoreManagerSigned', 'PurchaseManagerSigned', 'AccountManagerSigned', 'AuditorSigned'];
                
                allowedFields.forEach(field => {
                    if (editGsnData[field] !== undefined && editGsnData[field] !== null && editGsnData[field] !== '' && !forbiddenFields.includes(field)) {
                        cleanedGsnData[field] = editGsnData[field];
                    }
                });
                
                // Ensure tableData is properly formatted
                if (editGsnTableData && Array.isArray(editGsnTableData)) {
                    cleanedGsnData.tableData = editGsnTableData.map(row => {
                        const cleanRow = {};
                        Object.keys(row).forEach(key => {
                            if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
                                cleanRow[key] = row[key];
                            }
                        });
                        return cleanRow;
                    });
                } else {
                    cleanedGsnData.tableData = [];
                }
                
                const updatedGsnData = cleanedGsnData;
                console.log('GSN - Original data:', editGsnData);
                console.log('GSN - Table data being used:', editGsnTableData);
                console.log('GSN - Final cleaned data:', updatedGsnData);
                console.log('GSN - Data type:', typeof updatedGsnData);
                
                // Test if data is serializable
                try {
                    const testStringify = JSON.stringify(updatedGsnData, null, 2);
                    console.log('GSN - Data stringified successfully:', testStringify);
                } catch (stringifyErr) {
                    console.error('GSN - Data serialization failed:', stringifyErr);
                    throw new Error('GSN: Data contains invalid characters or circular references');
                }
                
                // Validate GSN data
                if (!updatedGsnData.partyName || updatedGsnData.partyName.trim() === '') {
                    throw new Error('GSN: Party name is required');
                }
                
                try {
                    console.log('GSN - Making API call to:', `${backendUrl}/gsn/upload-data/update-by-party/${encodeURIComponent(editGsnData.partyName)}`);
                    const gsnResponse = await axios.put(`${backendUrl}/gsn/upload-data/update-by-party/${encodeURIComponent(editGsnData.partyName)}`, updatedGsnData, {
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log('GSN - Update response:', gsnResponse.data);
                    console.log('=== GSN UPDATE PROCESS COMPLETE ===');
                } catch (gsnErr) {
                    console.error('GSN - Update error:', gsnErr);
                    console.error('GSN - Error response:', gsnErr.response);
                    console.error('GSN - Error message:', gsnErr.message);
                    throw new Error(`GSN update failed: ${gsnErr.response?.data?.message || gsnErr.message}`);
                }
            }
            
            // Update GRN data if it exists
            if (editGrnData && editGrnData.partyName) {
                console.log('=== GRN UPDATE PROCESS START ===');
                
                // Clean and validate the data before sending
                const cleanedGrnData = {};
                
                // Only copy specific fields that we want to update
                const allowedFields = [
                    'partyName', 'companyName', 'address', 'gstNo', 'mobileNo',
                    'cgst', 'sgst', 'igst', 'grinNo', 'grinDate', 'gsn', 'gsnDate',
                    'poNo', 'poDate', 'innoviceno', 'innoviceDate', 'lrNo', 'lrDate',
                    'transName', 'vehicleNo', 'gstTax', 'materialTotal', 'totalAmount'
                ];
                
                // Remove any MongoDB-specific fields that might cause issues
                const forbiddenFields = ['_id', '__v', 'createdAt', 'updatedAt', 'isHidden', 'GeneralManagerSigned', 'StoreManagerSigned', 'PurchaseManagerSigned', 'AccountManagerSigned', 'AuditorSigned'];
                
                allowedFields.forEach(field => {
                    if (editGrnData[field] !== undefined && editGrnData[field] !== null && editGrnData[field] !== '' && !forbiddenFields.includes(field)) {
                        cleanedGrnData[field] = editGrnData[field];
                    }
                });
                
                // Ensure tableData is properly formatted
                if (editGrnTableData && Array.isArray(editGrnTableData)) {
                    cleanedGrnData.tableData = editGrnTableData.map(row => {
                        const cleanRow = {};
                        Object.keys(row).forEach(key => {
                            if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
                                cleanRow[key] = row[key];
                            }
                        });
                        return cleanRow;
                    });
                } else {
                    cleanedGrnData.tableData = [];
                }
                
                const updatedGrnData = cleanedGrnData;
                console.log('GRN - Original data:', editGrnData);
                console.log('GRN - Table data being used:', editGrnTableData);
                console.log('GRN - Final cleaned data:', updatedGrnData);
                console.log('GRN - Data type:', typeof updatedGrnData);
                
                // Test if data is serializable
                try {
                    const testStringify = JSON.stringify(updatedGrnData, null, 2);
                    console.log('GRN - Data stringified successfully:', testStringify);
                } catch (stringifyErr) {
                    console.error('GRN - Data serialization failed:', stringifyErr);
                    throw new Error('GRN: Data contains invalid characters or circular references');
                }
                
                // Validate GRN data
                if (!updatedGrnData.partyName || updatedGrnData.partyName.trim() === '') {
                    throw new Error('GRN: Party name is required');
                }
                
                try {
                    console.log('GRN - Making API call to:', `${backendUrl}/entries/update-by-party/${encodeURIComponent(editGrnData.partyName)}`);
                    const grnResponse = await axios.put(`${backendUrl}/entries/update-by-party/${encodeURIComponent(editGrnData.partyName)}`, updatedGrnData, {
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    console.log('GRN - Update response:', grnResponse.data);
                    console.log('=== GRN UPDATE PROCESS COMPLETE ===');
                } catch (grnErr) {
                    console.error('GRN - Update error:', grnErr);
                    console.error('GRN - Error response:', grnErr.response);
                    console.error('GRN - Error message:', grnErr.message);
                    throw new Error(`GRN update failed: ${grnErr.response?.data?.message || grnErr.message}`);
                }
            }
            
            setEditModalOpen(false);
            
            let successMessage = 'Party updated successfully!';
            if (editGsnData && editGrnData) {
                successMessage = 'Both GSN and GRIN documents updated successfully!';
            } else if (editGsnData) {
                successMessage = 'GSN document updated successfully!';
            } else if (editGrnData) {
                successMessage = 'GRIN document updated successfully!';
            }
            
            alert(successMessage);
            
            // Refresh the data instead of reloading the page
            window.location.reload();
        } catch (err) {
            console.error('Error updating party:', err);
            console.error('Error response:', err.response?.data);
            console.error('Error status:', err.response?.status);
            
            let errorMessage = 'Error updating party.';
            if (err.response?.data?.message) {
                errorMessage += ' ' + err.response.data.message;
            } else if (err.message) {
                errorMessage += ' ' + err.message;
            }
            
            alert(errorMessage);
        }
    };

    const handleGsnDataChange = (field, value) => {
        console.log(`GSN data change - Field: ${field}, Value: ${value}`);
        setEditGsnData(prev => {
            const updated = { ...prev, [field]: value };
            console.log('GSN data change - Updated data:', updated);
            return updated;
        });
    };

    const handleGrnDataChange = (field, value) => {
        console.log(`GRN data change - Field: ${field}, Value: ${value}`);
        setEditGrnData(prev => {
            const updated = { ...prev, [field]: value };
            console.log('GRN data change - Updated data:', updated);
            return updated;
        });
    };

    const renderDocument = (item, index) => {
        const { partyName, gsnDocuments, grnDocuments, 
                GeneralManagerSigned, StoreManagerSigned, 
                PurchaseManagerSigned, AccountManagerSigned, AuditorSigned } = item;
                
        console.log(`Rendering party: ${partyName}, Signatures:`, { GeneralManagerSigned, StoreManagerSigned, PurchaseManagerSigned, AccountManagerSigned, AuditorSigned });

        const isApprovedByAllFive = !!GeneralManagerSigned && !!StoreManagerSigned && !!PurchaseManagerSigned && !!AccountManagerSigned && !!AuditorSigned;
        const statusText = isApprovedByAllFive ? "(Approved)" : "(Pending Approval)";

        return (
            <div 
                key={index} 
                id={`div-${index}`} 
                className="generated-div" 
                style={{
                   
                }}
            >
                {/* Edit/Delete Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '5px' }}>
                    <button onClick={() => handleEditParty(item.partyName)} style={{ background: '#ffc107', color: '#333', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>Edit</button>
                    <button onClick={() => handleDeleteParty(item.partyName)} style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', padding: '5px 10px', cursor: 'pointer' }}>Delete</button>
                </div>
                <div className={styles.show}>
                    <h2 onClick={() => showHandler(index)} style={{ cursor: 'pointer', color:'black' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ 
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '5px',
                                borderRight: '1px solid #ccc',
                                paddingRight: '15px',
                                marginRight: '15px'
                            }}>
                                <span style={{ fontSize: '0.9em', color: '#666' }}>
                                    GSN: {gsnDocuments[0]?.gsn || 'N/A'}
                                </span>
                                <span style={{ fontSize: '0.9em', color: '#666' }}>
                                    GRIN: {gsnDocuments[0]?.grinNo || 'N/A'}
                            </span>
                                <span style={{ fontSize: '0.9em', color: '#666' }}>
                                    DATE: {gsnDocuments[0]?.grinDate ? formatDateOnly(gsnDocuments[0].grinDate) : 'N/A'}
                            </span>
                                <span style={{ fontSize: '0.9em', color: '#666' }}>
                                    TIME: {gsnDocuments[0]?.grinDate ? formatTimeOnly(gsnDocuments[0].grinDate) : 'N/A'}
                            </span>
                            </div>
                            <span style={{ 
                                fontSize: '1.1em',
                                fontWeight: '500'
                            }}>
                        Supplier Name: {partyName}
                            </span>
                        <span style={{ marginLeft: '10px', fontSize: '0.8em', color: isApprovedByAllFive ? 'green' : 'green' }}>
                            {statusText}
                        </span>
                        </div>
                    </h2>
                    <div className={styles.completeBlock} style={{ display: visibleItem === index ? 'block' : 'none' }}>
                        {/* Group GSN and GRIN documents by their order */}
                        {(() => {
                            const maxLength = Math.max(gsnDocuments.length, grnDocuments.length);
                            const groups = [];

                            for (let i = 0; i < maxLength; i++) {
                                const gsnDoc = gsnDocuments[i];
                                const grnDoc = grnDocuments[i];
                                
                                if (gsnDoc || grnDoc) {
                                    groups.push(
                                        <div key={`group-${i}`} id={`div-${index}-group-${i}`} className={styles.grinDetails}>
                                            <h3 style={{ textAlign: 'center', margin: '0 0 20px 0' }}>
                                                Group {i + 1} Documents
                                            </h3>

                                            {/* GSN Document */}
                                            {gsnDoc && (
                                                <div style={{ backgroundColor: 'rgba(218, 216, 224, 0.2)', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
                                                    <h4 style={{ textAlign: 'center', margin: '0 0 15px 0' }}>GSN Document</h4>
                                                    <div><label htmlFor=""><h5>GSN Details</h5></label></div>
                                                    <table>
                                                        <thead>
                                                            <tr>
                                                                <th>GRIN NO.</th>
                                                                <th>Date</th>
                                                                <th>GSN</th>
                                                                <th>Date</th>
                                                                <th>P.O. No.</th>
                                                                <th>Date</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                <td>{gsnDoc.grinNo}</td>
                                                                <td>{gsnDoc.grinDate}</td>
                                                                <td>{gsnDoc.gsn}</td>
                                                                <td>{gsnDoc.gsnDate}</td>
                                                                <td>{gsnDoc.poNo}</td>
                                                                <td>{gsnDoc.poDate}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>

                                                    <div className={styles.grinDetails}>
                                                        <label htmlFor=""><h5>Supplier Details</h5></label>
                                                        <table>
                                                            <thead>
                                                                <tr>
                                                                    <th>Supplier Name</th>
                                                                    <th>Supplier Name</th>
                                                                    <th>Supplier Invoice No.</th>
                                                                    <th>Date</th>
                                                                    <th>Address</th>
                                                                    <th>GST No</th>
                                                                    <th>Mobile No</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td>{gsnDoc.partyName}</td>
                                                                    <td>{gsnDoc.companyName || 'N/A'}</td>
                                                                    <td>{gsnDoc.innoviceno}</td>
                                                                    <td>{gsnDoc.innoviceDate}</td>
                                                                    <td>{gsnDoc.address || 'N/A'}</td>
                                                                    <td>{gsnDoc.gstNo || 'N/A'}</td>
                                                                    <td>{gsnDoc.mobileNo || 'N/A'}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    <div className={styles.grinDetails}>
                                                        <label htmlFor=""><h5>Transport Details</h5></label>
                                                        <table>
                                                            <thead>
                                                                <tr>
                                                                    <th>L.R. No.</th>
                                                                    <th>Transporter Name</th>
                                                                    <th>Vehicle No.</th>
                                                                    <th>L.R. Date</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td>{gsnDoc.lrNo}</td>
                                                                    <td>{gsnDoc.transName}</td>
                                                                    <td>{gsnDoc.vehicleNo}</td>
                                                                    <td>{gsnDoc.lrDate}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {gsnDoc.tableData && gsnDoc.tableData.length > 0 && (
                                                        <div style={{
                                                            border: "1px solid #ccc",
                                                            width: "90%",
                                                            margin: "2% auto",
                                                            padding: "20px",
                                                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                                                            borderRadius: "8px",
                                                            backgroundColor: 'rgba(218, 216, 224, 0.6)',
                                                            fontFamily: "'Arial', sans-serif",
                                                            fontSize: "16px",
                                                            lineHeight: "1.6",
                                                            boxSizing: "border-box",
                                                            maxWidth: "1200px",
                                                            overflowWrap: "break-word",
                                                        }}>
                                                            <h5 style={{ textAlign: "center" }}>Material List (GSN/GRIN)</h5>
                                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                                <thead>
                                                                    <tr>
                                                                        <th>Sr. No.</th>
                                                                        <th>Item</th>
                                                                        <th>Description</th>
                                                                        <th>Quantity</th>
                                                                        <th>Price / KG</th>
                                                                        <th>Type</th>
                                                                        <th>Total</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {gsnDoc.tableData.map((row, idx) => (
                                                                        <tr key={idx}>
                                                                            <td>{idx + 1}</td>
                                                                            <td>{row.item}</td>
                                                                            <td>{row.description}</td>
                                                                            <td>{row.quantityValue || 'N/A'}</td>
                                                                            <td>{row.priceValue !== undefined ? row.priceValue : 'N/A'}</td>
                                                                            <td>{row.priceType || 'N/A'}</td>
                                                                            <td>{row.total !== undefined ? row.total : ((parseFloat(row.quantityValue)||0)*(parseFloat(row.priceValue)||0)).toFixed(2)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                    {gsnDoc && (
                                                        <div style={{ marginTop: '20px' }}>
                                                            <label><h5>Amount Details</h5></label>
                                                            <table>
                                                                <thead>
                                                                    <tr>
                                                                        <th>CGST</th>
                                                                        <th>SGST</th>
                                                                        <th>IGST</th>
                                                                        <th>GST Tax</th>
                                                                        <th>Before Tax Total</th>
                                                                        <th>Total Amount</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    <tr>
                                                                        <td>{gsnDoc.cgst || 'N/A'}</td>
                                                                        <td>{gsnDoc.sgst || 'N/A'}</td>
                                                                        <td>{gsnDoc.igst || 'N/A'}</td>
                                                                        <td>{gsnDoc.gstTax !== undefined ? gsnDoc.gstTax : 'N/A'}</td>
                                                                        <td>{gsnDoc.materialTotal !== undefined ? gsnDoc.materialTotal : 'N/A'}</td>
                                                                        <td>{gsnDoc.totalAmount || 'N/A'}</td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}

                                                    {/* CREATED AT (GSN) Card */}
                                                    <div style={{
                                                        marginTop: '20px',
                                                        padding: '10px 15px',
                                                        backgroundColor: 'rgba(252, 185, 0, 0.2)', // A light orange/pinkish background
                                                        borderRadius: '8px',
                                                        textAlign: 'center',
                                                        fontSize: '0.9em',
                                                        color: '#333',
                                                        maxWidth: '250px',
                                                        margin: '20px auto 0 auto' // Center the block
                                                    }}>
                                                        <strong>CREATED AT (GSN)</strong><br/>
                                                        {formatDate(gsnDoc.createdAt) || 'N/A'}
                                                    </div>

                                                    {/* View/Download Bill Button for GSN */}
                                                    {gsnDoc.file && (
                                                        <div style={{ textAlign: 'center', margin: '20px 0' }}>
                                                            <button
                                                                onClick={() => window.open(`${url}/${gsnDoc.file}`, '_blank')}
                                                                style={{
                                                                    padding: '10px 20px',
                                                                    backgroundColor: '#17a2b8',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '5px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '16px',
                                                                    transition: 'background-color 0.3s ease'
                                                                }}
                                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#138496'}
                                                                onMouseLeave={(e) => e.target.style.backgroundColor = '#17a2b8'}
                                                            >
                                                                View/Download Bill (GSN)
                                                            </button>
                                                        </div>
                                                    )}

                                                    {gsnDoc.photoPath && (
                                                        <div style={{
                                                            width: "90%", margin: "20px auto", padding: "15px", 
                                                            border: "1px solid #ccc", borderRadius: "8px", textAlign: "center",
                                                            backgroundColor: 'rgba(218, 216, 224, 0.6)', 
                                                        }}>
                                                                <h2 style={{ color: "#007bff", fontSize: "24px", marginBottom: "15px" }}>Uploaded Photo (GSN)</h2>
                                                                <img src={`${url}/${gsnDoc.photoPath}`} alt="GSN Uploaded Photo" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '5px' }} />
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* GRIN Document */}
                                            {grnDoc && (
                                                <div style={{ backgroundColor: 'rgba(218, 216, 224, 0.2)', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
                                                    <h4 style={{ textAlign: 'center', margin: '0 0 15px 0' }}>GRIN Document</h4>
                                                    <div><label htmlFor=""><h5>GRIN Details</h5></label></div>
                                                    <table>
                                                        <thead>
                                                            <tr>
                                                                <th>GRIN NO.</th>
                                                                <th>Date</th>
                                                                <th>GSN</th>
                                                                <th>Date</th>
                                                                <th>P.O. No.</th>
                                                                <th>Date</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <tr>
                                                                <td>{grnDoc.grinNo}</td>
                                                                <td>{grnDoc.grinDate}</td>
                                                                <td>{grnDoc.gsn}</td>
                                                                <td>{grnDoc.gsnDate}</td>
                                                                <td>{grnDoc.poNo}</td>
                                                                <td>{grnDoc.poDate}</td>
                                                            </tr>
                                                        </tbody>
                                                    </table>

                                                    <div className={styles.grinDetails}>
                                                        <label htmlFor=""><h5>Supplier Details</h5></label>
                                                        <table>
                                                            <thead>
                                                                <tr>
                                                                    <th>Supplier Name</th>
                                                                    <th>Supplier Name</th>
                                                                    <th>Supplier Invoice No.</th>
                                                                    <th>Date</th>
                                                                    <th>Address</th>
                                                                    <th>GST No</th>
                                                                    <th>Mobile No</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td>{grnDoc.partyName}</td>
                                                                    <td>{grnDoc.companyName || 'N/A'}</td>
                                                                    <td>{grnDoc.innoviceno}</td>
                                                                    <td>{grnDoc.innoviceDate}</td>
                                                                    <td>{grnDoc.address || 'N/A'}</td>
                                                                    <td>{grnDoc.gstNo || 'N/A'}</td>
                                                                    <td>{grnDoc.mobileNo || 'N/A'}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    <div className={styles.grinDetails}>
                                                        <label htmlFor=""><h5>Transport Details</h5></label>
                                                        <table>
                                                            <thead>
                                                                <tr>
                                                                    <th>L.R. No.</th>
                                                                    <th>Transporter Name</th>
                                                                    <th>Vehicle No.</th>
                                                                    <th>L.R. Date</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <tr>
                                                                    <td>{grnDoc.lrNo}</td>
                                                                    <td>{grnDoc.transName}</td>
                                                                    <td>{grnDoc.vehicleNo}</td>
                                                                    <td>{grnDoc.lrDate}</td>
                                                                </tr>
                                                            </tbody>
                                                        </table>
                                                    </div>

                                                    {grnDoc.tableData && grnDoc.tableData.length > 0 && (
                                                        <div style={{
                                                            border: "1px solid #ccc",
                                                            width: "90%",
                                                            margin: "2% auto",
                                                            padding: "20px",
                                                            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
                                                            borderRadius: "8px",
                                                            backgroundColor: 'rgba(218, 216, 224, 0.6)',
                                                            fontFamily: "'Arial', sans-serif",
                                                            fontSize: "16px",
                                                            lineHeight: "1.6",
                                                            boxSizing: "border-box",
                                                            maxWidth: "1200px",
                                                            overflowWrap: "break-word",
                                                        }}>
                                                            <h5 style={{ textAlign: "center" }}>Material List (GSN/GRIN)</h5>
                                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                                <thead>
                                                                    <tr>
                                                                        <th>Sr. No.</th>
                                                                        <th>Item</th>
                                                                        <th>Description</th>
                                                                        <th>Quantity</th>
                                                                        <th>Price / KG</th>
                                                                        <th>Type</th>
                                                                        <th>Total</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {grnDoc.tableData.map((row, idx) => (
                                                                        <tr key={idx}>
                                                                            <td>{idx + 1}</td>
                                                                            <td>{row.item}</td>
                                                                            <td>{row.description}</td>
                                                                            <td>{row.quantityValue || 'N/A'}</td>
                                                                            <td>{row.priceValue !== undefined ? row.priceValue : 'N/A'}</td>
                                                                            <td>{row.priceType || 'N/A'}</td>
                                                                            <td>{row.total !== undefined ? row.total : ((parseFloat(row.quantityValue)||0)*(parseFloat(row.priceValue)||0)).toFixed(2)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                    {grnDoc && (
                                                        <div style={{ marginTop: '20px' }}>
                                                            <label><h5>Amount Details</h5></label>
                                                            <table>
                                                                <thead>
                                                                    <tr>
                                                                        <th>CGST</th>
                                                                        <th>SGST</th>
                                                                        <th>IGST</th>
                                                                        <th>GST Tax</th>
                                                                        <th>Before Tax Total</th>
                                                                        <th>Total Amount</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    <tr>
                                                                        <td>{grnDoc.cgst || 'N/A'}</td>
                                                                        <td>{grnDoc.sgst || 'N/A'}</td>
                                                                        <td>{grnDoc.igst || 'N/A'}</td>
                                                                        <td>{grnDoc.gstTax !== undefined ? grnDoc.gstTax : 'N/A'}</td>
                                                                        <td>{grnDoc.materialTotal !== undefined ? grnDoc.materialTotal : 'N/A'}</td>
                                                                        <td>{grnDoc.totalAmount || 'N/A'}</td>
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}

                                                    {/* CREATED AT (GRIN) Card */}
                                                    <div style={{
                                                        marginTop: '20px',
                                                        padding: '10px 15px',
                                                        backgroundColor: 'rgba(153, 0, 239, 0.2)', // A light purple/pinkish background
                                                        borderRadius: '8px',
                                                        textAlign: 'center',
                                                        fontSize: '0.9em',
                                                        color: '#333',
                                                        maxWidth: '250px',
                                                        margin: '20px auto 0 auto' // Center the block
                                                    }}>
                                                        <strong>CREATED AT (GRIN)</strong><br/>
                                                        {formatDate(grnDoc.createdAt) || 'N/A'}
                                                    </div>

                                                    {/* View/Download Bill Button for GRIN */}
                                                    {grnDoc.file && (
                                                        <div style={{ textAlign: 'center', margin: '20px 0' }}>
                                                            <button
                                                                onClick={() => window.open(`${url}/${grnDoc.file}`, '_blank')}
                                                                style={{
                                                                    padding: '10px 20px',
                                                                    backgroundColor: '#17a2b8',
                                                                    color: 'white',
                                                                    border: 'none',
                                                                    borderRadius: '5px',
                                                                    cursor: 'pointer',
                                                                    fontSize: '16px',
                                                                    transition: 'background-color 0.3s ease'
                                                                }}
                                                                onMouseEnter={(e) => e.target.style.backgroundColor = '#138496'}
                                                                onMouseLeave={(e) => e.target.style.backgroundColor = '#17a2b8'}
                                                            >
                                                                View/Download Bill (GRIN)
                                                            </button>
                                                        </div>
                                                    )}

                                                    {grnDoc.photoPath && (
                                                        <div style={{
                                                            width: "90%", margin: "20px auto", padding: "15px", 
                                                            border: "1px solid #ccc", borderRadius: "8px", textAlign: "center",
                                                            backgroundColor: 'rgba(218, 216, 224, 0.6)', 
                                                        }}>
                                                                <h2 style={{ color: "#007bff", fontSize: "24px", marginBottom: "15px" }}>Uploaded Photo (GRIN)</h2>
                                                                <img src={`${url}/${grnDoc.photoPath}`} alt="GRIN Uploaded Photo" style={{ maxWidth: '100%', maxHeight: '400px', objectFit: 'contain', borderRadius: '5px' }} />
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {/* Download button for this group */}
                                            {isApprovedByAllFive && (
                                                <button 
                                                    onClick={() => handleDownloadPDF(index, i)} 
                                                    className="download-pdf-button hide-in-pdf"
                                                    style={{ 
                                                        marginTop: "10px", 
                                                        padding: "5px 10px", 
                                                        marginBottom: "20px",
                                                        background: "#17a2b8",
                                                        color: "white", 
                                                        border: "none", 
                                                        cursor: "pointer",
                                                        display: "block" 
                                                    }}
                                                >
                                                    Download Group {i + 1} PDF
                                                </button>
                                            )}
                                        </div>
                                    );
                                }
                            }

                            return groups;
                        })()}
                    </div>

                    {/* Approval Section */}
                    <div className={`${styles.sign} hide-in-pdf`} style={{ 
                        backgroundColor: 'rgba(218, 216, 224, 0.2)', 
                        border: "1px solid #ccc",
                        borderRadius: "10px",
                        marginTop: "20px",
                        padding: '10px'
                    }}>
                        <form style={{ padding: '10px', display: 'flex', justifyContent: 'space-around', alignItems: "center", flexWrap: 'wrap' }}>
                            <div className={styles.submission} style={{ display: 'flex', justifyContent: 'space-around', width: '100%' }}>
                                <div style={{ textAlign: 'center', margin: '5px' }}>
                                    <label><h6>General Manager</h6></label><br/>
                                    <input type="checkbox" checked={!!GeneralManagerSigned} readOnly disabled style={{ transform: 'scale(1.5)', cursor: 'not-allowed' }}/>
                                </div>
                                <div style={{ textAlign: 'center', margin: '5px' }}>
                                    <label><h6>Store Manager</h6></label><br/>
                                    <input type="checkbox" checked={!!StoreManagerSigned} readOnly disabled style={{ transform: 'scale(1.5)', cursor: 'not-allowed' }}/>
                                </div>
                                <div style={{ textAlign: 'center', margin: '5px' }}>
                                    <label><h6>Purchase Manager</h6></label><br/>
                                    <input type="checkbox" checked={!!PurchaseManagerSigned} readOnly disabled style={{ transform: 'scale(1.5)', cursor: 'not-allowed' }}/>
                                </div>
                                <div style={{ textAlign: 'center', margin: '5px' }}>
                                    <label><h6>Account Manager</h6></label><br/>
                                    <input type="checkbox" checked={!!AccountManagerSigned} readOnly disabled style={{ transform: 'scale(1.5)', cursor: 'not-allowed' }}/>
                                </div>
                                <div style={{ textAlign: 'center', margin: '5px' }}>
                                    <label><h6>Auditor Manager</h6></label><br/>
                                    <input type="checkbox" checked={!!AuditorSigned} readOnly disabled style={{ transform: 'scale(1.5)', cursor: 'not-allowed' }}/>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    };

    console.log('Current combinedList:', combinedList);

    return (
        <>
            <LogOutComponent/>
            {/* Edit Modal */}
            <Modal
                isOpen={editModalOpen}
                onRequestClose={() => setEditModalOpen(false)}
                contentLabel="Edit Party"
                ariaHideApp={false}
                style={{
                    overlay: {
                        backgroundColor: 'rgba(30, 30, 30, 0.92)',
                        zIndex: 1000,
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        padding: 0,
                        margin: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    },
                    content: {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        width: '100vw',
                        height: '100vh',
                        minHeight: '100vh',
                        maxHeight: '100vh',
                        minWidth: '100vw',
                        maxWidth: '100vw',
                        margin: 0,
                        border: 'none',
                        borderRadius: 0,
                        background: 'linear-gradient(135deg, #fcb900 0%, #9900ef 100%)',
                        boxShadow: 'none',
                        padding: '2vw 2vw 2vw 2vw',
                        overflowY: 'auto',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        transition: 'all 0.3s',
                    }
                }}
            >
                <h2 style={{
                    color: '#fff',
                    textAlign: 'center',
                    marginBottom: '24px',
                    letterSpacing: '1px',
                    fontWeight: 700,
                    textShadow: '0 2px 8px rgba(0,0,0,0.18)'
                }}>Edit Supplier Details - GSN & GRIN</h2>
                <div style={{
                            width: '100%',
                    maxWidth: '1800px',
                            margin: '0 auto',
                    display: 'flex',
                    gap: '20px',
                    flexWrap: 'wrap'
                }}>
                                    {/* GSN Form - Left Side */}
                <div style={{
                    flex: '1 1 800px',
                    minWidth: '600px',
                            background: 'rgba(255,255,255,0.95)',
                            borderRadius: '16px',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
                            padding: '24px 18px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                }}>
                    <h3 style={{ textAlign: 'center', color: '#333', marginBottom: '20px', borderBottom: '2px solid #007bff', paddingBottom: '10px' }}>
                        GSN Document Details
                    </h3>
                    {editGsnData ? (
                        <>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ flex: '1 1 220px', minWidth: '180px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>Supplier Name:
                                        <input value={editGsnData.partyName || ''} onChange={e => handleGsnDataChange('partyName', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                            <div style={{ flex: '1 1 220px', minWidth: '180px' }}>
                                    <label style={{ color: '#333', fontWeight: 600 }}>Company Name:
                                        <input value={editGsnData.companyName || ''} onChange={e => handleGsnDataChange('companyName', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ flex: '1 1 220px', minWidth: '180px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>Address:
                                        <input value={editGsnData.address || ''} onChange={e => handleGsnDataChange('address', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                            <div style={{ flex: '1 1 220px', minWidth: '180px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>GST No:
                                        <input value={editGsnData.gstNo || ''} onChange={e => handleGsnDataChange('gstNo', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>Mobile No:
                                        <input value={editGsnData.mobileNo || ''} onChange={e => handleGsnDataChange('mobileNo', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>CGST:
                                        <input value={editGsnData.cgst || ''} onChange={e => handleGsnDataChange('cgst', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>SGST:
                                        <input value={editGsnData.sgst || ''} onChange={e => handleGsnDataChange('sgst', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>IGST:
                                        <input value={editGsnData.igst || ''} onChange={e => handleGsnDataChange('igst', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>GRIN NO:
                                        <input value={editGsnData.grinNo || ''} onChange={e => handleGsnDataChange('grinNo', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>GRIN Date:
                                        <input type="date" value={editGsnData.grinDate ? editGsnData.grinDate.substring(0,10) : ''} onChange={e => handleGsnDataChange('grinDate', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>GSN:
                                        <input value={editGsnData.gsn || ''} onChange={e => handleGsnDataChange('gsn', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>GSN Date:
                                        <input type="date" value={editGsnData.gsnDate ? editGsnData.gsnDate.substring(0,10) : ''} onChange={e => handleGsnDataChange('gsnDate', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>P.O. No:
                                        <input value={editGsnData.poNo || ''} onChange={e => handleGsnDataChange('poNo', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>P.O. Date:
                                        <input type="date" value={editGsnData.poDate ? editGsnData.poDate.substring(0,10) : ''} onChange={e => handleGsnDataChange('poDate', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>Supplier Invoice No:
                                        <input value={editGsnData.innoviceno || ''} onChange={e => handleGsnDataChange('innoviceno', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>Invoice Date:
                                        <input type="date" value={editGsnData.innoviceDate ? editGsnData.innoviceDate.substring(0,10) : ''} onChange={e => handleGsnDataChange('innoviceDate', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>L.R. No:
                                        <input value={editGsnData.lrNo || ''} onChange={e => handleGsnDataChange('lrNo', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>L.R. Date:
                                        <input type="date" value={editGsnData.lrDate ? editGsnData.lrDate.substring(0,10) : ''} onChange={e => handleGsnDataChange('lrDate', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>Transporter Name:
                                        <input value={editGsnData.transName || ''} onChange={e => handleGsnDataChange('transName', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>Vehicle No:
                                        <input value={editGsnData.vehicleNo || ''} onChange={e => handleGsnDataChange('vehicleNo', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                        </div>
                        <div style={{ margin: '20px 0' }}>
                                <label style={{ color: '#333', fontWeight: 600, marginBottom: '8px', display: 'block' }}>Material List (GSN Table Data):</label>
                                <TableEntry data={editGsnTableData} handleTableChange={(index, field, value) => handleEditTableChange(index, field, value, 'gsn')} />
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                    <label style={{ color: '#333', fontWeight: 600 }}>GST Tax:
                                        <input value={editGsnData.gstTax || ''} onChange={e => handleGsnDataChange('gstTax', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                    </label>
                                </div>
                                <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                    <label style={{ color: '#333', fontWeight: 600 }}>Before Tax Total:
                                        <input value={editGsnData.materialTotal || ''} onChange={e => handleGsnDataChange('materialTotal', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                    </label>
                                </div>
                                <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                    <label style={{ color: '#333', fontWeight: 600 }}>Total Amount:
                                        <input value={editGsnData.totalAmount || ''} onChange={e => handleGsnDataChange('totalAmount', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                    </label>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                            No GSN data available for editing
                        </div>
                    )}
                </div>

                {/* GRIN Form - Right Side */}
                <div style={{
                    flex: '1 1 800px',
                    minWidth: '600px',
                    background: 'rgba(255,255,255,0.95)',
                    borderRadius: '16px',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
                    padding: '24px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                }}>
                    <h3 style={{ textAlign: 'center', color: '#333', marginBottom: '20px', borderBottom: '2px solid #28a745', paddingBottom: '10px' }}>
                        GRIN Document Details
                    </h3>
                    {editGrnData ? (
                        <>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                <div style={{ flex: '1 1 220px', minWidth: '180px' }}>
                                    <label style={{ color: '#333', fontWeight: 600 }}>Supplier Name:
                                        <input value={editGrnData.partyName || ''} onChange={e => handleGrnDataChange('partyName', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                    </label>
                                </div>
                                <div style={{ flex: '1 1 220px', minWidth: '180px' }}>
                                    <label style={{ color: '#333', fontWeight: 600 }}>Company Name:
                                        <input value={editGrnData.companyName || ''} onChange={e => handleGrnDataChange('companyName', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                    </label>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                <div style={{ flex: '1 1 220px', minWidth: '180px' }}>
                                    <label style={{ color: '#333', fontWeight: 600 }}>Address:
                                        <input value={editGrnData.address || ''} onChange={e => handleGrnDataChange('address', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                    </label>
                                </div>
                                <div style={{ flex: '1 1 220px', minWidth: '180px' }}>
                                    <label style={{ color: '#333', fontWeight: 600 }}>GST No:
                                        <input value={editGrnData.gstNo || ''} onChange={e => handleGrnDataChange('gstNo', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                    </label>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                    <label style={{ color: '#333', fontWeight: 600 }}>Mobile No:
                                        <input value={editGrnData.mobileNo || ''} onChange={e => handleGrnDataChange('mobileNo', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                    </label>
                                </div>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>CGST:
                                        <input value={editGrnData.cgst || ''} onChange={e => handleGrnDataChange('cgst', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>SGST:
                                        <input value={editGrnData.sgst || ''} onChange={e => handleGrnDataChange('sgst', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>IGST:
                                        <input value={editGrnData.igst || ''} onChange={e => handleGrnDataChange('igst', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                    <label style={{ color: '#333', fontWeight: 600 }}>GRIN NO:
                                        <input value={editGrnData.grinNo || ''} onChange={e => handleGrnDataChange('grinNo', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                    </label>
                                </div>
                                <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                    <label style={{ color: '#333', fontWeight: 600 }}>GRIN Date:
                                        <input type="date" value={editGrnData.grinDate ? editGrnData.grinDate.substring(0,10) : ''} onChange={e => handleGrnDataChange('grinDate', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                    </label>
                                </div>
                                <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                    <label style={{ color: '#333', fontWeight: 600 }}>GSN:
                                        <input value={editGrnData.gsn || ''} onChange={e => handleGrnDataChange('gsn', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                    </label>
                                </div>
                                <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                    <label style={{ color: '#333', fontWeight: 600 }}>GSN Date:
                                        <input type="date" value={editGrnData.gsnDate ? editGrnData.gsnDate.substring(0,10) : ''} onChange={e => handleGrnDataChange('gsnDate', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                    </label>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                    <label style={{ color: '#333', fontWeight: 600 }}>P.O. No:
                                        <input value={editGrnData.poNo || ''} onChange={e => handleGrnDataChange('poNo', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                    </label>
                                </div>
                                <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                    <label style={{ color: '#333', fontWeight: 600 }}>P.O. Date:
                                        <input type="date" value={editGrnData.poDate ? editGrnData.poDate.substring(0,10) : ''} onChange={e => handleGrnDataChange('poDate', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                    </label>
                                </div>
                                <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                    <label style={{ color: '#333', fontWeight: 600 }}>Supplier Invoice No:
                                        <input value={editGrnData.innoviceno || ''} onChange={e => handleGrnDataChange('innoviceno', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                    </label>
                                </div>
                                <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                    <label style={{ color: '#333', fontWeight: 600 }}>Invoice Date:
                                        <input type="date" value={editGrnData.innoviceDate ? editGrnData.innoviceDate.substring(0,10) : ''} onChange={e => handleGrnDataChange('innoviceDate', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                    </label>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                    <label style={{ color: '#333', fontWeight: 600 }}>L.R. No:
                                        <input value={editGrnData.lrNo || ''} onChange={e => handleGrnDataChange('lrNo', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                    </label>
                                </div>
                                <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                    <label style={{ color: '#333', fontWeight: 600 }}>L.R. Date:
                                        <input type="date" value={editGrnData.lrDate ? editGrnData.lrDate.substring(0,10) : ''} onChange={e => handleGrnDataChange('lrDate', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                    </label>
                                </div>
                                <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                    <label style={{ color: '#333', fontWeight: 600 }}>Transporter Name:
                                        <input value={editGrnData.transName || ''} onChange={e => handleGrnDataChange('transName', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                    </label>
                                </div>
                                <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                    <label style={{ color: '#333', fontWeight: 600 }}>Vehicle No:
                                        <input value={editGrnData.vehicleNo || ''} onChange={e => handleGrnDataChange('vehicleNo', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                    </label>
                                </div>
                            </div>
                            <div style={{ margin: '20px 0' }}>
                                <label style={{ color: '#333', fontWeight: 600, marginBottom: '8px', display: 'block' }}>Material List (GRIN Table Data):</label>
                                <TableEntry data={editGrnTableData} handleTableChange={(index, field, value) => handleEditTableChange(index, field, value, 'grn')} />
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>GST Tax:
                                        <input value={editGrnData.gstTax || ''} onChange={e => handleGrnDataChange('gstTax', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>Before Tax Total:
                                        <input value={editGrnData.materialTotal || ''} onChange={e => handleGrnDataChange('materialTotal', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                            <div style={{ flex: '1 1 120px', minWidth: '120px' }}>
                                <label style={{ color: '#333', fontWeight: 600 }}>Total Amount:
                                        <input value={editGrnData.totalAmount || ''} onChange={e => handleGrnDataChange('totalAmount', e.target.value)}
                                        style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbb', marginTop: '4px' }} />
                                </label>
                            </div>
                        </div>
                        </>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                            No GRIN data available for editing
                        </div>
                    )}
                </div>
            </div>

            {/* Save/Cancel Buttons */}
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '20px', 
                marginTop: '30px',
                width: '100%'
            }}>
                <button 
                    type="button" 
                    onClick={() => setEditModalOpen(false)} 
                    style={{ 
                        background: '#6c757d', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '8px', 
                        padding: '15px 30px', 
                        cursor: 'pointer', 
                        fontWeight: 600, 
                        fontSize: '1.1rem' 
                    }}
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSaveEdit} 
                    style={{ 
                        background: 'linear-gradient(90deg, #ff6900 0%, #00ff07 100%)', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '8px', 
                        padding: '15px 30px', 
                        cursor: 'pointer', 
                        fontWeight: 600, 
                        fontSize: '1.1rem', 
                        boxShadow: '0 2px 8px rgba(0,0,0,0.10)' 
                    }}
                >
                    Save All Changes
                </button>
            </div>
            </Modal>
            <div className={styles.outer} style={{minHeight:"150vh"}}>
                {/* Search Input */}
                <div style={{ padding: '10px 20px', backgroundColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '8px', margin: '10px 0' }}>
                    <input 
                        type="text"
                        placeholder="Search by Supplier Name, GSN or GRIN number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ 
                            width: '100%', 
                            padding: '12px',
                            borderRadius: '5px',
                            border: '1px solid #ccc',
                            fontSize: '16px',
                            outline: 'none',
                            transition: 'border-color 0.3s ease'
                        }}
                    />
                </div>

                {/* Render Filtered List */}
                {filteredCombinedList && filteredCombinedList.length > 0 ? (
                    filteredCombinedList.map((item, index) => renderDocument(item, index))
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <h2>{searchTerm ? 'No matching documents found' : 'No documents found'}</h2>
                        {!searchTerm && <p>Please check if the backend server is running and data is available.</p>}
                    </div>
                )}
        </div>
        </>
    );
}
