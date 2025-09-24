import React from 'react';
import styles from './Table.module.css';

const TableComponent = ({data, handleTableChange }) => {
    const calculateRowTotal = (row) => {
        const quantity = parseFloat(row.quantityValue || 0);
        const price = parseFloat(row.priceValue || 0);
        return (quantity * price).toFixed(2);
    };

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            margin: '20px 0'
        }}>
        <table className={styles.table} style={{
            backgroundColor: 'rgba(218, 216, 224, 0.6)',
            borderRadius: '15px',
            border: 'none',
            borderCollapse: 'collapse',
            width: '100%',
            maxWidth: '1200px'
        }}>
            <thead>
                <tr>
                    <th style={{ width: '1%', border: 'none' }}>Sr. No.</th>
                    <th style={{ width: '20%', border: 'none' }}>Item</th>
                    <th style={{ width: '35%', border: 'none' }}>Description</th>
                    <th style={{ width: '15%', border: 'none' }}>Quantity</th>
                    <th style={{ width: '15%', border: 'none' }}>Price</th>
                    <th style={{ width: '12%', border: 'none' }}>Total</th>
                </tr>
            </thead>
            <tbody>
                {data.map((row, index) => (
                    <tr key={index}>
                        <td style={{ border: 'none' }}>{index + 1}</td>
                        <td style={{ border: 'none' }}>
                            <textarea
                                style={{
                                    width:"100%",
                                    marginLeft:"0px",
                                    backgroundColor: 'rgba(218, 216, 224, 0.6)',
                                    borderRadius: '20px',
                                    border: 'none',
                                    padding: '12px',
                                    fontSize: '14px',
                                    minHeight: '60px',
                                    resize: 'vertical',
                                    minWidth: '150px'
                                }}
                                value={row.item}
                                onChange={(e) => handleTableChange(index, 'item', e.target.value)}
                            />
                        </td>
                        <td style={{ border: 'none' }}>
                            <textarea 
                                style={{
                                    resize:"vertical",
                                    width:"100%", 
                                    backgroundColor: 'rgba(218, 216, 224, 0.6)',
                                    borderRadius: '20px',
                                    border: 'none',
                                    padding: '12px',
                                    fontSize: '14px',
                                    minHeight: '60px',
                                    minWidth: '200px'
                                }}
                                value={row.description}
                                onChange={(e) => handleTableChange(index, 'description', e.target.value)}
                                className={styles.textarea}
                            />
                        </td>
                        <td style={{ border: 'none' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <select 
                                    style={{
                                        width: "100%",
                                        backgroundColor: 'rgba(218, 216, 224, 0.6)',
                                        borderRadius: '20px',
                                        border: 'none',
                                        padding: '5px',
                                        fontSize: '14px',
                                        height: '30px'
                                    }}
                                    value={row.quantityType || ""}
                                    onChange={(e) => handleTableChange(index, 'quantityType', e.target.value)}
                                >
                                    <option value="">Select Type</option>
                                    <option value="kgs">Kgs</option>
                                    <option value="pieces">Pieces</option>
                                </select>
                                <input
                                    style={{
                                        width:"100%",
                                        marginLeft:"0px", 
                                        backgroundColor: 'rgba(218, 216, 224, 0.6)',
                                        borderRadius: '20px',
                                        border: 'none',
                                        padding: '12px',
                                        fontSize: '14px',
                                        height: '30px'
                                    }}
                                    type="number"
                                    value={row.quantityValue || ""}
                                    onChange={(e) => handleTableChange(index, 'quantityValue', e.target.value)}
                                    placeholder="Enter quantity"
                                />
                            </div>
                        </td>
                        <td style={{ border: 'none' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                <select 
                                    style={{
                                        width: "100%",
                                        backgroundColor: 'rgba(218, 216, 224, 0.6)',
                                        borderRadius: '20px',
                                        border: 'none',
                                        padding: '5px',
                                        fontSize: '14px',
                                        height: '30px'
                                    }}
                                    value={row.priceType || ""}
                                    onChange={(e) => handleTableChange(index, 'priceType', e.target.value)}
                                >
                                   <option value="">Select Type</option>
                                    <option value="perKg">Per Kg</option>
                                    <option value="perPiece">Per Piece</option>
                                </select>
                                <input
                                    style={{
                                        width:"100%",
                                        marginLeft:"0px", 
                                        backgroundColor: 'rgba(218, 216, 224, 0.6)',
                                        borderRadius: '20px',
                                        border: 'none',
                                        padding: '12px',
                                        fontSize: '14px',
                                        height: '30px'
                                    }}
                                    type="number"
                                    value={row.priceValue || ""}
                                    onChange={(e) => handleTableChange(index, 'priceValue', e.target.value)}
                                    placeholder="Enter price"
                                />
                            </div>
                        </td>
                        <td style={{ border: 'none', textAlign: 'center', fontWeight: 'bold' }}>
                            {calculateRowTotal(row)}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        </div>
    );
};

export default TableComponent;
