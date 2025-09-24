import React, { useEffect, useState } from 'react';
import axios from 'axios';
import LogOutComponent from '../../Components/LogOut/LogOutComponent';
import { useNavigate } from 'react-router-dom';

export default function DropdownView() {
    const [inventoryData, setInventoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItem, setSelectedItem] = useState('');
    const navigate = useNavigate();
    const url = process.env.REACT_APP_BACKEND_URL;

    // Create a map to store unique items and their details
    const [itemsMap, setItemsMap] = useState(new Map());
    const [displayData, setDisplayData] = useState([]);
    const [consolidatedItems, setConsolidatedItems] = useState([]);
    const [showDetailView, setShowDetailView] = useState(false);

    useEffect(() => {
        const fetchInventoryData = async () => {
            setLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem('authToken');
                const response = await axios.get(`${url}/gsn/getdata`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setInventoryData(response.data);

                // Process data to create unique items map and consolidated view
                const newItemsMap = new Map();
                const itemTotals = new Map();
                
                response.data.forEach(entry => {
                    if (entry.tableData && Array.isArray(entry.tableData)) {
                        entry.tableData.forEach(item => {
                            if (item.item) {
                                // Add to items map for detailed view
                                if (!newItemsMap.has(item.item)) {
                                    newItemsMap.set(item.item, []);
                                }
                                
                                const processedItem = {
                                    ...item,
                                    partyName: entry.partyName || 'N/A',
                                    gsn: entry.gsn || 'N/A',
                                    grinNo: entry.grinNo || 'N/A',
                                    createdAt: entry.createdAt,
                                    quantity: parseFloat(item.quantity) || 0,
                                    pricePerUnit: parseFloat(item.pricePerUnit) || 0
                                };
                                
                                newItemsMap.get(item.item).push(processedItem);

                                // Update consolidated totals
                                if (!itemTotals.has(item.item)) {
                                    itemTotals.set(item.item, {
                                        item: item.item,
                                        totalQuantity: 0,
                                        totalValue: 0,
                                        count: 0,
                                        description: item.description
                                    });
                                }
                                
                                const totals = itemTotals.get(item.item);
                                const quantity = parseFloat(item.quantity) || 0;
                                const price = parseFloat(item.pricePerUnit) || 0;
                                
                                totals.totalQuantity += quantity;
                                totals.totalValue += quantity * price;
                                totals.count++;
                            }
                        });
                    }
                });

                // Create consolidated items array
                const consolidatedArray = Array.from(itemTotals.values()).map(totals => ({
                    ...totals,
                    totalQuantity: totals.totalQuantity.toFixed(2),
                    totalValue: totals.totalValue.toFixed(2)
                }));

                setItemsMap(newItemsMap);
                setConsolidatedItems(consolidatedArray);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to fetch inventory data.");
            } finally {
                setLoading(false);
            }
        };

        fetchInventoryData();
    }, [url]);

    // Handle item selection from dropdown
    const handleItemSelect = (itemName) => {
        setSelectedItem(itemName);
        setShowDetailView(false);
        if (itemName) {
            const itemDetails = itemsMap.get(itemName) || [];
            // Sort by date before setting the data
            const sortedDetails = [...itemDetails].sort((a, b) => 
                new Date(b.createdAt) - new Date(a.createdAt)
            );
            setDisplayData(sortedDetails);
        } else {
            setDisplayData([]);
        }
    };

    // Handle item click from consolidated view
    const handleItemClick = (itemName) => {
        const itemDetails = itemsMap.get(itemName) || [];
        const sortedDetails = [...itemDetails].sort((a, b) => 
            new Date(b.createdAt) - new Date(a.createdAt)
        );
        setDisplayData(sortedDetails);
        setSelectedItem(itemName);
        setShowDetailView(true);
    };

    // Main container style
    const mainContainerStyle = {
        minHeight: '100vh',
        width: '100vw',
        overflow: 'auto',
        textAlign: 'center',
        padding: '20px',
        background: 'linear-gradient(-45deg, #fcb900, #9900ef, #ff6900, #00ff07)',
        backgroundSize: '400% 400%',
        animation: 'gradientAnimation 12s ease infinite',
        borderRadius: '10px',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
        marginLeft: 'auto',
        marginRight: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
    };

    // Table container style
    const tableContainerStyle = {
        width: '90%',
        marginTop: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        backgroundColor: '#f5f5f5',
        overflow: 'hidden',
    };

    // Add gradient animation keyframes
    const gradientAnimation = `
        @keyframes gradientAnimation {
            0% { background-position: 0% 50%; }
            25% { background-position: 50% 100%; }
            50% { background-position: 100% 50%; }
            75% { background-position: 50% 0%; }
            100% { background-position: 0% 50%; }
        }
    `;

    // Table styles
    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        backgroundColor: 'white',
    };

    const thStyle = {
        padding: '12px',
        backgroundColor: '#f8f9fa',
        borderBottom: '2px solid #dee2e6',
        position: 'sticky',
        top: 0,
        zIndex: 1,
    };

    return (
        <div style={mainContainerStyle}>
            <style>{gradientAnimation}</style>
            <LogOutComponent />
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Dropdown View</h2>

            {/* Back button */}
            <button
                onClick={() => navigate('/inventory-view')}
                style={{
                    position: 'absolute',
                    left: '20px',
                    top: '20px',
                    padding: '8px 16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Back to Inventory
            </button>

            {/* Dropdown for items */}
            <select
                value={selectedItem}
                onChange={(e) => handleItemSelect(e.target.value)}
                style={{
                    padding: '8px',
                    marginBottom: '20px',
                    width: '300px',
                    borderRadius: '4px',
                    border: '1px solid #ddd'
                }}
            >
                <option value="">Select an Item</option>
                {Array.from(itemsMap.keys()).sort().map((itemName) => (
                    <option key={itemName} value={itemName}>
                        {itemName}
                    </option>
                ))}
            </select>

            {loading && <p>Loading...</p>}
            {error && <p style={{ color: 'red' }}>Error: {error}</p>}

            {selectedItem ? (
                showDetailView ? (
                    // Detailed view
                    <div style={tableContainerStyle}>
                        <button 
                            onClick={() => setShowDetailView(false)}
                            style={{
                                padding: '8px 16px',
                                marginBottom: '20px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Back to Summary
                        </button>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Sr. No.</th>
                                    <th style={thStyle}>Supplier Name</th>
                                    <th style={thStyle}>GSN No.</th>
                                    <th style={thStyle}>GRIN No.</th>
                                    <th style={thStyle}>Description</th>
                                    <th style={thStyle}>Quantity No.</th>
                                    <th style={thStyle}>Quantity in Kgs.</th>
                                    <th style={thStyle}>Price</th>
                                    <th style={thStyle}>Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {displayData
                                    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                                    .map((item, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                                            <td style={{ padding: '12px' }}>{index + 1}</td>
                                            <td style={{ padding: '12px' }}>{item.partyName}</td>
                                            <td style={{ padding: '12px' }}>{item.gsn}</td>
                                            <td style={{ padding: '12px' }}>{item.grinNo}</td>
                                            <td style={{ padding: '12px' }}>{item.description}</td>
                                            <td style={{ padding: '12px' }}>{item.quantityNo}</td>
                                            <td style={{ padding: '12px' }}>{item.quantityKg}</td>
                                            <td style={{ padding: '12px' }}>{item.price ? `₹${parseFloat(item.price).toFixed(2)}` : '-'}</td>
                                            <td style={{ padding: '12px' }}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { 
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            }) : '-'}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    // Consolidated view
                    <div style={tableContainerStyle}>
                        <table style={tableStyle}>
                            <thead>
                                <tr>
                                    <th style={thStyle}>Item</th>
                                    <th style={thStyle}>Description</th>
                                    <th style={thStyle}>Total Quantity</th>
                                    <th style={thStyle}>Total Value</th>
                                    <th style={thStyle}>Number of Entries</th>
                                    <th style={thStyle}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {consolidatedItems
                                    .filter(item => item.item === selectedItem)
                                    .map((item, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                                            <td style={{ padding: '12px' }}>{item.item}</td>
                                            <td style={{ padding: '12px' }}>{item.description}</td>
                                            <td style={{ padding: '12px' }}>{item.totalQuantity}</td>
                                            <td style={{ padding: '12px' }}>₹{item.totalValue}</td>
                                            <td style={{ padding: '12px' }}>{item.count}</td>
                                            <td style={{ padding: '12px' }}>
                                                <button 
                                                    onClick={() => handleItemClick(item.item)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: '#007bff',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                )
            ) : (
                // Display all items when nothing is selected
                <div style={tableContainerStyle}>
                    <table style={tableStyle}>
                        <thead>
                            <tr>
                                <th style={thStyle}>Item</th>
                                <th style={thStyle}>Description</th>
                                <th style={thStyle}>Total Quantity</th>
                                <th style={thStyle}>Total Value</th>
                                <th style={thStyle}>Number of Entries</th>
                                <th style={thStyle}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {consolidatedItems.map((item, index) => (
                                <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                                    <td style={{ padding: '12px' }}>{item.item}</td>
                                    <td style={{ padding: '12px' }}>{item.description}</td>
                                    <td style={{ padding: '12px' }}>{item.totalQuantity}</td>
                                    <td style={{ padding: '12px' }}>₹{item.totalValue}</td>
                                    <td style={{ padding: '12px' }}>{item.count}</td>
                                    <td style={{ padding: '12px' }}>
                                        <button 
                                            onClick={() => handleItemClick(item.item)}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: '#007bff',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            View Details
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
