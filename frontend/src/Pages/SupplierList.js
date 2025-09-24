import React, { useEffect, useState } from 'react';

export default function SupplierList() {
  const url = process.env.REACT_APP_BACKEND_URL;
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expanded, setExpanded] = useState(null); // partyName of expanded row
  const [details, setDetails] = useState({}); // { [partyName]: [{gsn, grinNo}] }
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState(null);
  const [editIdx, setEditIdx] = useState(null); // index of row being edited
  const [editData, setEditData] = useState({}); // temp data for editing
  const [actionLoading, setActionLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    partyName: '',
    address: '',
    gstNo: '',
    mobileNo: ''
  });
  const [addLoading, setAddLoading] = useState(false);

  // Search/Filter states
  const [searchFilters, setSearchFilters] = useState({
    partyName: '',
    address: '',
    gstNo: '',
    mobileNo: ''
  });

  useEffect(() => {
    const url = process.env.REACT_APP_BACKEND_URL;
    fetch(`${url}/api/suppliers`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch');
        return res.json();
      })
      .then(data => {
        // Unique filter: only by partyName (ignore case and spaces)
        const uniqueSuppliers = data.filter((supplier, index, self) => {
          const currName = (supplier.partyName || '').trim().toLowerCase();
          return index === self.findIndex(s =>
            (s.partyName || '').trim().toLowerCase() === currName
          );
        });

        // Sort alphabetically by partyName
        uniqueSuppliers.sort((a, b) => {
          const nameA = (a.partyName || '').trim().toLowerCase();
          const nameB = (b.partyName || '').trim().toLowerCase();
          return nameA.localeCompare(nameB);
        });

        setSuppliers(uniqueSuppliers);
        setFilteredSuppliers(uniqueSuppliers);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Filter suppliers based on search criteria
  useEffect(() => {
    let filtered = suppliers.filter(supplier => {
      const partyNameMatch = (supplier.partyName || '').toLowerCase().includes(searchFilters.partyName.toLowerCase());
      const addressMatch = (supplier.address || '').toLowerCase().includes(searchFilters.address.toLowerCase());
      const gstNoMatch = (supplier.gstNo || '').toLowerCase().includes(searchFilters.gstNo.toLowerCase());
      const mobileNoMatch = (supplier.mobileNo || '').toLowerCase().includes(searchFilters.mobileNo.toLowerCase());

      return partyNameMatch && addressMatch && gstNoMatch && mobileNoMatch;
    });

    setFilteredSuppliers(filtered);
  }, [suppliers, searchFilters]);

  // Handle search input changes
  const handleSearchChange = (field, value) => {
    setSearchFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchFilters({
      partyName: '',
      address: '',
      gstNo: '',
      mobileNo: ''
    });
  };

  const handlePartyClick = (partyName) => {
    if (expanded === partyName) {
      setExpanded(null);
      return;
    }
    setExpanded(partyName);
    if (!details[partyName]) {
      setDetailsLoading(true);
      setDetailsError(null);
      fetch(`${url}/api/supplier-details?partyName=${encodeURIComponent(partyName)}`)
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch details');
          return res.json();
        })
        .then(data => {
          setDetails(prev => ({ ...prev, [partyName]: data }));
          setDetailsLoading(false);
        })
        .catch(err => {
          setDetailsError(err.message);
          setDetailsLoading(false);
        });
    }
  };

  const handleEdit = (idx) => {
    setEditIdx(idx);
    setEditData({ ...filteredSuppliers[idx] });
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEditSave = async (oldPartyName) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${url}/api/supplier/${encodeURIComponent(oldPartyName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update');
      }
      
      // Update local state
      setSuppliers(suppliers.map((s, i) => i === editIdx ? editData : s));
      setFilteredSuppliers(filteredSuppliers.map((s, i) => i === editIdx ? editData : s));
      setEditIdx(null);
      alert('Supplier updated successfully!');
    } catch (err) {
      console.error('Update error:', err);
      alert('Update failed: ' + err.message);
    }
    setActionLoading(false);
  };

  const handleDelete = async (partyName) => {
    if (!window.confirm('Are you sure you want to delete this supplier?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${url}/api/supplier/${encodeURIComponent(partyName)}`, {
        method: 'DELETE'
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete');
      }
      
      setSuppliers(suppliers.filter(s => s.partyName !== partyName));
      setFilteredSuppliers(filteredSuppliers.filter(s => s.partyName !== partyName));
      alert('Supplier deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err);
      alert('Delete failed: ' + err.message);
    }
    setActionLoading(false);
  };

  // Handle add supplier modal
  const handleAddSupplier = () => {
    setShowAddModal(true);
    setNewSupplier({
      partyName: '',
      address: '',
      gstNo: '',
      mobileNo: ''
    });
  };

  const handleNewSupplierChange = (e) => {
    setNewSupplier({ ...newSupplier, [e.target.name]: e.target.value });
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await fetch(`${url}/api/suppliers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSupplier)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add supplier');
      }
      
      // Add to local state
      const updatedSuppliers = [...suppliers, data].sort((a, b) => {
        const nameA = (a.partyName || '').trim().toLowerCase();
        const nameB = (b.partyName || '').trim().toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      setSuppliers(updatedSuppliers);
      setFilteredSuppliers(updatedSuppliers);
      setShowAddModal(false);
      setNewSupplier({
        partyName: '',
        address: '',
        gstNo: '',
        mobileNo: ''
      });
      alert('Supplier added successfully!');
    } catch (err) {
      console.error('Add supplier error:', err);
      alert('Add failed: ' + err.message);
    }
    setAddLoading(false);
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setNewSupplier({
      partyName: '',
      address: '',
      gstNo: '',
      mobileNo: ''
    });
  };

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (error) return <div style={{ padding: '2rem', color: 'red' }}>Error: {error}</div>;

  // Gradient background style (copied from Gsn.js)
  const containerStyle = {
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

  const globalStyles = `
    @keyframes gradientAnimation {
        0% { background-position: 0% 50%; }
        25% { background-position: 50% 100%; }
        50% { background-position: 100% 50%; }
        75% { background-position: 50% 0%; }
        100% { background-position: 0% 50%; }
    }
  `;

  // Table container style
  const tableContainerStyle = {
    width: '90%',
    marginTop: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    backgroundColor: '#f5f5f5',
    overflow: 'hidden',
  };

  // Header table style (fixed)
  const headerTableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#f5f5f5',
    display: 'table',
  };

  // Body wrapper style (scrollable)
  const bodyWrapperStyle = {
    maxHeight: '60vh', // Limit height to enable scrolling
    overflowY: 'auto', // Enable vertical scrolling
    overflowX: 'hidden', // Hide horizontal scrolling
  };

  // Body table style
  const bodyTableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#f5f5f5',
    display: 'table',
  };
  const cellStyle = {
    border: '1px solid #ccc',
    padding: '8px',
    backgroundColor: '#f5f5f5', // light gray for all cells
  };
  const theadCellStyle = {
    ...cellStyle,
    backgroundColor: 'rgba(174, 145, 253, 0.8)',
    fontWeight: 'bold',
    color: '#fff', // white text
  };
  const buttonStyle = {
    backgroundColor: 'rgba(190, 190, 191, 0.8)',
    border: 'none',
    borderRadius: '6px',
    padding: '6px 16px',
    margin: 0,
    cursor: 'pointer',
    fontSize: '15px',
    fontFamily: 'inherit',
    transition: 'background 0.2s',
  };
  const editButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#007bff',
    color: '#fff'
  };
  const deleteButtonStyle = {
    ...buttonStyle,
    backgroundColor: '#dc3545',
    color: '#fff'
  };
  const buttonGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  };

  // Search container style
  const searchContainerStyle = {
    width: '90%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  };

  // Search input style
  const searchInputStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    fontSize: '14px',
    marginBottom: '8px',
  };

  // Search label style
  const searchLabelStyle = {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    color: '#333',
    fontSize: '14px',
  };

  // Clear button style
  const clearButtonStyle = {
    backgroundColor: '#ff6b6b',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '8px 16px',
    cursor: 'pointer',
    fontSize: '14px',
    marginTop: '10px',
  };

  return (
    <div style={containerStyle}>
      <style>{globalStyles}</style>
      <h2 style={{ color: '#fff', marginTop: '2rem' }}>Supplier List</h2>
      
      {/* Add Supplier Button */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={handleAddSupplier}
          style={{
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 24px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            transition: 'background-color 0.3s ease'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#218838'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#28a745'}
        >
          + Add New Supplier
        </button>
      </div>

      {/* Search and Filter Section */}
      <div style={searchContainerStyle}>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Search & Filter Suppliers</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <label style={searchLabelStyle}>Supplier Name:</label>
            <input
              type="text"
              style={searchInputStyle}
              placeholder="Search by Supplier name..."
              value={searchFilters.partyName}
              onChange={(e) => handleSearchChange('partyName', e.target.value)}
            />
          </div>
          <div>
            <label style={searchLabelStyle}>Address:</label>
            <input
              type="text"
              style={searchInputStyle}
              placeholder="Search by address..."
              value={searchFilters.address}
              onChange={(e) => handleSearchChange('address', e.target.value)}
            />
          </div>
          <div>
            <label style={searchLabelStyle}>GST No:</label>
            <input
              type="text"
              style={searchInputStyle}
              placeholder="Search by GST number..."
              value={searchFilters.gstNo}
              onChange={(e) => handleSearchChange('gstNo', e.target.value)}
            />
          </div>
          <div>
            <label style={searchLabelStyle}>Mobile Number:</label>
            <input
              type="text"
              style={searchInputStyle}
              placeholder="Search by mobile number..."
              value={searchFilters.mobileNo}
              onChange={(e) => handleSearchChange('mobileNo', e.target.value)}
            />
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <button style={clearButtonStyle} onClick={clearAllFilters}>
            Clear All Filters
          </button>
          <div style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
            Showing {filteredSuppliers.length} of {suppliers.length} suppliers
          </div>
        </div>
      </div>

      <div style={tableContainerStyle}>
        {/* Fixed Header */}
        <table style={headerTableStyle}>
          <thead>
            <tr>
              <th style={{...theadCellStyle, width: '25%'}}>Supplier Name</th>
              <th style={{...theadCellStyle, width: '35%'}}>Address</th>
              <th style={{...theadCellStyle, width: '20%'}}>GST No</th>
              <th style={{...theadCellStyle, width: '20%'}}>Mobile No</th>
              <th style={{...theadCellStyle, width: '20%'}}>Actions</th>
            </tr>
          </thead>
        </table>

        {/* Scrollable Body */}
        <div style={bodyWrapperStyle}>
          <table style={bodyTableStyle}>
            <tbody>
          {filteredSuppliers.map((s, idx) => (
            <React.Fragment key={idx}>
              <tr>
                {editIdx === idx ? (
                  <>
                    <td style={{...cellStyle, width: '25%'}}>
                      <input name="partyName" value={editData.partyName} onChange={handleEditChange} style={{width: '100%', padding: '4px'}} />
                    </td>
                    <td style={{...cellStyle, width: '35%'}}>
                      <input name="address" value={editData.address} onChange={handleEditChange} style={{width: '100%', padding: '4px'}} />
                    </td>
                    <td style={{...cellStyle, width: '20%'}}>
                      <input name="gstNo" value={editData.gstNo} onChange={handleEditChange} style={{width: '100%', padding: '4px'}} />
                    </td>
                    <td style={{...cellStyle, width: '20%'}}>
                      <input name="mobileNo" value={editData.mobileNo} onChange={handleEditChange} style={{width: '100%', padding: '4px'}} />
                    </td>
                    <td style={{...cellStyle, width: '20%'}}>
                      <button style={buttonStyle} onClick={() => handleEditSave(s.partyName)} disabled={actionLoading}>Save</button>
                      <button style={buttonStyle} onClick={() => setEditIdx(null)} disabled={actionLoading}>Cancel</button>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ ...cellStyle, color: 'blue', cursor: 'pointer', textDecoration: 'underline', backgroundColor: '#f5f5f5', width: '25%' }}
                      onClick={() => handlePartyClick(s.partyName)}
                    >
                      {s.partyName}
                    </td>
                    <td style={{...cellStyle, width: '35%'}}>{s.address || 'N/A'}</td>
                    <td style={{...cellStyle, width: '20%'}}>{s.gstNo || 'N/A'}</td>
                    <td style={{...cellStyle, width: '20%'}}>{s.mobileNo || 'N/A'}</td>
                    <td style={{...cellStyle, width: '20%'}}>
                      <div style={buttonGroupStyle}>
                        <button
                          style={editButtonStyle}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#0069d9'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#007bff'; }}
                          onClick={() => handleEdit(idx)}
                          disabled={actionLoading}
                        >
                          Edit
                        </button>
                        <button
                          style={deleteButtonStyle}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#c82333'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#dc3545'; }}
                          onClick={() => handleDelete(s.partyName)}
                          disabled={actionLoading}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
              {expanded === s.partyName && (
                <tr>
                  <td colSpan={5} style={{ ...cellStyle, background: '#f9f9f9', width: '100%' }}>
                    {detailsLoading && <div>Loading details...</div>}
                    {detailsError && <div style={{ color: 'red' }}>Error: {detailsError}</div>}
                    {details[s.partyName] && details[s.partyName].length > 0 ? (
                      <div>
                        <b>GSN/GRIN Numbers:</b>
                        <ul style={{ margin: '8px 0 0 0' }}>
                          {details[s.partyName].map((entry, i) => (
                            <li key={i}>
                              GSN: {entry.gsn || '-'} | GRIN: {entry.grinNo || '-'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : details[s.partyName] && details[s.partyName].length === 0 ? (
                      <div>No GSN/GRIN numbers found for this party.</div>
                    ) : null}
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '30px',
            width: '90%',
            maxWidth: '500px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            position: 'relative'
          }}>
            <h3 style={{ 
              margin: '0 0 20px 0', 
              color: '#333', 
              textAlign: 'center',
              borderBottom: '2px solid #28a745',
              paddingBottom: '10px'
            }}>
              Add New Supplier
            </h3>
            
            <form onSubmit={handleAddSubmit}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#333',
                  fontSize: '14px'
                }}>
                  Supplier Name *
                </label>
                <input
                  type="text"
                  name="partyName"
                  value={newSupplier.partyName}
                  onChange={handleNewSupplierChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter supplier name"
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#333',
                  fontSize: '14px'
                }}>
                  Address
                </label>
                <textarea
                  name="address"
                  value={newSupplier.address}
                  onChange={handleNewSupplierChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                  placeholder="Enter supplier address"
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#333',
                  fontSize: '14px'
                }}>
                  GST No
                </label>
                <input
                  type="text"
                  name="gstNo"
                  value={newSupplier.gstNo}
                  onChange={handleNewSupplierChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter GST number"
                />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '5px',
                  fontWeight: 'bold',
                  color: '#333',
                  fontSize: '14px'
                }}>
                  Mobile Number
                </label>
                <input
                  type="tel"
                  name="mobileNo"
                  value={newSupplier.mobileNo}
                  onChange={handleNewSupplierChange}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '6px',
                    fontSize: '14px',
                    boxSizing: 'border-box'
                  }}
                  placeholder="Enter mobile number"
                />
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: '15px' 
              }}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={addLoading}
                  style={{
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  style={{
                    backgroundColor: addLoading ? '#6c757d' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '10px 20px',
                    cursor: addLoading ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold'
                  }}
                >
                  {addLoading ? 'Adding...' : 'Add Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 