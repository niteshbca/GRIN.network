import React, { useEffect, useState } from 'react';
import axios from 'axios';
import styles from './InventoryView.module.css';
import LogOutComponent from '../../Components/LogOut/LogOutComponent';
import TableRenderingComponent from '../../Components/Table/Table.rendering';
import { useNavigate } from 'react-router-dom';

export default function InventoryView() {
    const navigate = useNavigate();
    const [inventoryData, setInventoryData] = useState([]);
    const [allTableData, setAllTableData] = useState([]);
    const [filteredTableData, setFilteredTableData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [dateSearch, setDateSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const url = process.env.REACT_APP_BACKEND_URL;

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
                // Combine all tableData into a single array
                const combinedData = response.data.reduce((acc, entry) => {
                    if (entry.tableData && Array.isArray(entry.tableData)) {
                        const itemsWithParty = entry.tableData.map(item => ({
                           ...item,
                           partyName: entry.partyName || 'N/A',
                           gsn: entry.gsn || 'N/A',
                           grinNo: entry.grinNo || 'N/A',
                           createdAt: entry.createdAt
                        }));
                        return acc.concat(itemsWithParty);
                    }
                    return acc;
                }, []);
                setAllTableData(combinedData);
            } catch (err) {
                setError(err.response?.data?.message || "Failed to fetch inventory data.");
            } finally {
                setLoading(false);
            }
        };
        fetchInventoryData();
    }, [url]);

    // Filter and sort data whenever allTableData or searchTerm changes
    useEffect(() => {
        let filtered = allTableData;
        
        // Filter by item name
        if (searchTerm.trim() !== "") {
            filtered = filtered.filter(item =>
                (item.item || "").toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filter by date
        if (dateSearch) {
            const searchDate = new Date(dateSearch);
            searchDate.setHours(0, 0, 0, 0); // Reset time part for date comparison
            
            filtered = filtered.filter(item => {
                if (!item.createdAt) return false;
                const itemDate = new Date(item.createdAt);
                itemDate.setHours(0, 0, 0, 0);
                return itemDate.getTime() === searchDate.getTime();
            });
        }

        // Sort alphabetically by item name
        filtered = filtered.sort((a, b) => {
            const nameA = (a.item || "").toLowerCase();
            const nameB = (b.item || "").toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
        });

        setFilteredTableData(filtered);
    }, [allTableData, searchTerm, dateSearch]);

    // This formatDate function might not be needed here anymore unless TableRenderingComponent uses it
    // Or if you add a date column directly in this component's table rendering logic
    // const formatDate = (dateString) => {
    //     if (!dateString) return "N/A";
    //     const date = new Date(dateString);
    //     return date.toLocaleDateString('en-GB', { 
    //         day: '2-digit', 
    //         month: '2-digit', 
    //         year: 'numeric' 
    //     });
    // };

    // Inline style for main background
    const mainContainerStyle = {
        minHeight: '100vh',
        width: '100vw',
        overflow: 'auto', // Allow scrolling
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

    // Inline style for table container
    const tableContainerStyle = {
        width: '96%', // make table area bigger
        marginTop: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        backgroundColor: 'transparent', // transparent table container
        overflow: 'hidden',
        fontSize: '16px' // slightly larger text inside table
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

    return (
        <div style={mainContainerStyle}>
            <style>{gradientAnimation}</style>
            {/* Force table backgrounds with semi-transparency inside this page */}
            <style>{`
                .inventory-table-container table { background-color: rgba(255,255,255,0.75) !important; }
                .inventory-table-container tbody { background-color: rgba(255,255,255,0.75) !important; }
                .inventory-table-container td { background-color: rgba(255,255,255,0.75) !important; }
                .inventory-table-container thead { background-color: rgba(128,128,128,0.35) !important; }
                .inventory-table-container th { background-color: rgba(128,128,128,0.35) !important; }
            `}</style>
            <LogOutComponent />
            
            {/* Dropdown View Button */}
            <button
                onClick={() => navigate('/dropdown-view')}
                style={{
                    position: 'absolute',
                    left: '20px',
                    top: '80px',
                    padding: '8px 16px',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
            >
                Dropdown View
            </button>

            <h2 className={styles.title}>Item Inward Register</h2>

            {/* Search inputs for item name and date */}
            <div style={{ 
                marginBottom: '20px', 
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                gap: '20px'
            }}>
                <input
                    type="text"
                    placeholder="Search by Item Name..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ 
                        padding: '8px', 
                        width: '250px', 
                        borderRadius: '5px', 
                        border: '1px solid #ccc' 
                    }}
                />
                <input
                    type="date"
                    value={dateSearch}
                    onChange={e => setDateSearch(e.target.value)}
                    style={{ 
                        padding: '8px', 
                        width: '200px', 
                        borderRadius: '5px', 
                        border: '1px solid #ccc' 
                    }}
                />
            </div>

            {loading && <p className={styles.loading}>Loading inventory data...</p>}
            {error && <p className={styles.error}>Error: {error}</p>}

            {/* Display message if no items found after loading */}
            {!loading && !error && filteredTableData.length === 0 && (
                <p className={styles.noData}>No inventory items found.</p>
            )}

            {/* Render the single table with all combined items */}
            {!loading && !error && filteredTableData.length > 0 && (
                <div style={tableContainerStyle} className="inventory-table-container">
                    <TableRenderingComponent tableData={filteredTableData} />
                </div>
            )}
        </div>
    );
} 