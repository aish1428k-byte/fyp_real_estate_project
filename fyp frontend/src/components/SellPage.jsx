import React, { useState, useEffect } from 'react';
import './SellPage.css';
import MyProfile from './MyProfile'

const GET_API_URL = "http://127.0.0.1:8000/property/view/";
const CREATE_API_URL = "http://127.0.0.1:8000/property/create/";
const UPDATE_API_URL = "http://127.0.0.1:8000/property/update/";
const DELETE_API_URL = "http://127.0.0.1:8000/property/delete/";

const getToken = () => localStorage.getItem("access");

const SellPage = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [properties, setProperties] = useState([]);
  const [errors, setErrors] = useState({});
  const [geocodingError, setGeocodingError] = useState(null);

  // Lease Modal states
  const [showLeaseModal, setShowLeaseModal] = useState(false);
  const [leaseData, setLeaseData] = useState({
    tenant: '',
    landlord: '',
    premises: '',
    startDate: '',
    endDate: '',
    rentAmount: '',
    leaseDocument: null
  });

  const [formData, setFormData] = useState({
    title: '',
    city: '',
    location: '',
    address: '', // New field for exact address
    latitude: '', // New field for generated latitude
    longitude: '', // New field for generated longitude
    price: '',
    type: '',
    bedrooms: '',
    bathrooms: '',
    area_size: '',
    full_address:'',

    status: 'available',  // default value
    description: '',
    image: null
  });

  // ================= GET =================
  const loadProperties = async () => {
    try {
      const token = getToken();
      if (!token) return; // Handle no token case

      const res = await fetch(GET_API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setProperties(data);
    } catch (err) {
      console.error("Load error", err);
    }
  };
  useEffect(() => {
  loadProperties();
}, []);

  useEffect(() => {
  if (!formData.full_address) return;

  const fetchCoordinates = async () => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.full_address)}`
      );

      const data = await response.json();

      if (data.length > 0) {
        setFormData(prev => ({
          ...prev,
          latitude: data[0].lat,
          longitude: data[0].lon
        }));
      }
    } catch (err) {
      console.log(err);
    }
  };

  fetchCoordinates();
}, [formData.full_address]);
  // ================= GEOCODING (New Feature) =================
  
  // ================= FORM HANDLERS =================
  const handleChange = (e) => {
  const { name, value } = e.target;

  setFormData(prev => {
    const updated = {
      ...prev,
      [name]: value
    };

   const fullAddress =
      [updated.location, updated.city]
        .filter(Boolean)
        .join(", ");

    updated.address = fullAddress;
    updated.full_address = fullAddress;

    

    return updated;
  });
};

  const handleFileChange = (e) => {
    setFormData({ ...formData, image: e.target.files[0] });
  };

  // ================= ADD / UPDATE =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const form = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null && value !== "") {
        if (['price', 'bedrooms', 'bathrooms'].includes(key)) {
          form.append(key, Number(value)); // numeric fields
        } else if (key === 'status') {
          form.append('status', value || 'available'); // default
        } else {
          form.append(key === "image" ? "main_image" : key, value);
        }
      }
    });
    form.set("full_address", formData.full_address);

    const url = editingId ? `${UPDATE_API_URL}${editingId}/` : CREATE_API_URL;
    const method = editingId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${getToken()}` },
        body: form
      });

      const data = await res.json();
      console.log("Response:", data);  // debug backend response

      if (!res.ok) {
        setErrors(data.errors || data);  // show serializer errors
        return;
      }

      // Reset form
      setFormData({
        title: '', city: '', location: '', address: '', latitude: '', longitude: '',
        price: '', type: '', bedrooms: '',
        bathrooms: '', area_size: '', status: 'available', description: '', image: null
      });
      setEditingId(null);
      setShowForm(false);
      setErrors({});
      setGeocodingError(null);
      loadProperties();
    } catch (err) {
      console.error("Submit error", err);
    }
  };

  // ================= EDIT =================
  const handleEdit = (propertyId) => {
    fetch(`http://127.0.0.1:8000/property/view/${propertyId}/`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    })
      .then(res => res.json())
      .then(data => {
        setFormData({
          title: data.title || "",
          city: data.city || "",
          location: data.location || "",
          address: data.address || "", // Check if backend returns address
          latitude: data.latitude || "",
          longitude: data.longitude || "",
          price: data.price || "",
          type: data.type || "",
          bedrooms: data.bedrooms || "",
          bathrooms: data.bathrooms || "",
          area_size: data.area_size || "",
          status: data.status || "available",
          description: data.description || "",
          image: null
        });
        setEditingId(data.id);
        setShowForm(true);
      });
  };

  // ================= DELETE =================
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;

    await fetch(`${DELETE_API_URL}${id}/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    loadProperties();
  };

  // ================= RENDER =================
  return (
  <div className="sell-page">

    <div className="sell-page-header text-center">

      {/* PROFILE */}
      <div
  className="sell-page-header text-center"
  style={{
    position: 'relative'
  }}
>
  {/* PROFILE - RIGHT SIDE */}
  <div
    style={{
      position: 'absolute',
      top: '0',
      right: '0',
      zIndex: 10
    }}
  >
    <MyProfile />
  </div>

  {/* PAGE CONTENT */}
  <h1 className="text-gradient">
    Sell Your Property
  </h1>

  <p>
    Showcase your property to serious buyers. Provide accurate details,
    high-quality photos, and get the best offers.
  </p>

  <button
    className="btn-primary"
    onClick={() => setShowForm(true)}
  >
    + List New Property
  </button>
</div>
    </div>

      {showForm && (
        <div className="form-overlay" onClick={() => setShowForm(false)}>
          <div className="form-dialog glass-panel" onClick={(e) => e.stopPropagation()}>
            <div className="form-header">
              <h2>{editingId ? 'Edit Property' : 'Add Property'}</h2>
              <button className="close-button" onClick={() => setShowForm(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit} className="property-form">
              {/* Title & City */}
              <div className="form-row">
                <div className="form-group">
                  <label>Property Title *</label>
                  <input type="text" name="title" value={formData.title} onChange={handleChange} className={`glass-input ${errors.title ? 'error' : ''}`} />
                  {errors.title && <span className="error-message">{errors.title}</span>}
                </div>
                <div className="form-group">
                  <label>City *</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} className={`glass-input ${errors.city ? 'error' : ''}`} />
                  {errors.city && <span className="error-message">{errors.city}</span>}
                </div>
              </div>

              {/* Location & Address (NEW) */}
              <div className="form-row">
                <div className="form-group">
                  <label>Location (Area/Sector) *</label>
                  <input type="text" name="location" value={formData.location} onChange={handleChange} className={`glass-input ${errors.location ? 'error' : ''}`} />
                  {errors.location && <span className="error-message">{errors.location}</span>}
                </div>
                <div className="form-group">
                  <label>Exact Address (for Map) *</label>
                  <input
  type="text"
  name="address"
  value={formData.address}
  readOnly
  className="glass-input"
/>
                  {formData.latitude && formData.longitude && (
                    <span style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '4px' }}>
                      ✓ Location found (Lat: {formData.latitude}, Lng: {formData.longitude})
                    </span>
                  )}
                  {geocodingError && <span className="error-message">{geocodingError}</span>}
                </div>
              </div>

              {/* Price & Type */}
              <div className="form-row">
                <div className="form-group">
                  <label>Price ($) *</label>
                  <input type="number" name="price" value={formData.price} onChange={handleChange} className={`glass-input ${errors.price ? 'error' : ''}`} />
                  {errors.price && <span className="error-message">{errors.price}</span>}
                </div>
                <div className="form-group">
                  <label>Property Type *</label>
                  <select name="type" value={formData.type} onChange={handleChange} className={`glass-input ${errors.type ? 'error' : ''}`}>
                    <option value="">Select type</option>
                    <option value="house">House</option>
                    <option value="apartment">Apartment</option>
                    <option value="commercial">Commercial</option>
                    <option value="plot">Plot</option>
                  </select>
                  {errors.type && <span className="error-message">{errors.type}</span>}
                </div>
              </div>

              {/* Bedrooms, Bathrooms, Area */}
              <div className="form-row">
                <div className="form-group">
                  <label>Area Size (sq ft) *</label>
                  <input type="text" name="area_size" value={formData.area_size} onChange={handleChange} className={`glass-input ${errors.area_size ? 'error' : ''}`} />
                  {errors.area_size && <span className="error-message">{errors.area_size}</span>}
                </div>
                <div className="form-group">
                  <label>Bedrooms *</label>
                  <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleChange} className={`glass-input ${errors.bedrooms ? 'error' : ''}`} />
                  {errors.bedrooms && <span className="error-message">{errors.bedrooms}</span>}
                </div>
                <div className="form-group">
                  <label>Bathrooms *</label>
                  <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleChange} className={`glass-input ${errors.bathrooms ? 'error' : ''}`} />
                  {errors.bathrooms && <span className="error-message">{errors.bathrooms}</span>}
                </div>
              </div>

              {/* Status */}
              <div className="form-row">
                <div className="form-group">
                  <label>Status *</label>
                  <select name="status" value={formData.status} onChange={handleChange} className={`glass-input ${errors.status ? 'error' : ''}`}>
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                  </select>
                  {errors.status && <span className="error-message">{errors.status}</span>}
                </div>
              </div>

              {/* Image & Lease */}
              <div className="form-row">
                <div className="form-group">
                  <label>Property Images</label>
                  <input type="file" name="image" accept="image/*" onChange={handleFileChange} className="glass-input" />
                </div>
                <div className="form-group" style={{ justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ height: '48px', padding: '12px 24px', fontWeight: 'bold' }}
                    onClick={() => setShowLeaseModal(true)}
                  >
                    Lease
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="form-group">
                <label>Description *</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className={`glass-input ${errors.description ? 'error' : ''}`} />
                {errors.description && <span className="error-message">{errors.description}</span>}
              </div>

              {/* Buttons */}
              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary">{editingId ? 'Save Changes' : 'Add Property'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lease Modal */}
      {showLeaseModal && (
        <div className="form-overlay" style={{ zIndex: 2100 }} onClick={() => setShowLeaseModal(false)}>
          <div className="form-dialog glass-panel" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="form-header">
              <h2>Add Lease Details</h2>
              <button className="close-button" onClick={() => setShowLeaseModal(false)}>×</button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              // Save lease details to localStorage
              const key = editingId ? `lease_property_${editingId}` : `lease_property_temp`;
              localStorage.setItem(key, JSON.stringify({
                tenant: leaseData.tenant,
                landlord: leaseData.landlord,
                premises: leaseData.premises,
                startDate: leaseData.startDate,
                endDate: leaseData.endDate,
                rentAmount: leaseData.rentAmount,
                leaseDocumentName: leaseData.leaseDocument ? leaseData.leaseDocument.name : null
              }));
              alert('Lease details submitted successfully!');
              setShowLeaseModal(false);
            }} className="property-form">
              
              {/* Tenant & Landlord */}
              <div className="form-row">
                <div className="form-group">
                  <label>Tenant *</label>
                  <input
                    type="text"
                    required
                    className="glass-input"
                    value={leaseData.tenant}
                    onChange={(e) => setLeaseData(prev => ({ ...prev, tenant: e.target.value }))}
                    placeholder="Tenant Full Name"
                  />
                </div>
                <div className="form-group">
                  <label>Landlord *</label>
                  <input
                    type="text"
                    required
                    className="glass-input"
                    value={leaseData.landlord}
                    onChange={(e) => setLeaseData(prev => ({ ...prev, landlord: e.target.value }))}
                    placeholder="Landlord Full Name"
                  />
                </div>
              </div>

              {/* Premises & Rent Amount */}
              <div className="form-row">
                <div className="form-group">
                  <label>Premises *</label>
                  <input
                    type="text"
                    required
                    className="glass-input"
                    value={leaseData.premises}
                    onChange={(e) => setLeaseData(prev => ({ ...prev, premises: e.target.value }))}
                    placeholder="e.g. Apartment 4B"
                  />
                </div>
                <div className="form-group">
                  <label>Rent Amount per Month ($) *</label>
                  <input
                    type="number"
                    required
                    className="glass-input"
                    value={leaseData.rentAmount}
                    onChange={(e) => setLeaseData(prev => ({ ...prev, rentAmount: e.target.value }))}
                    placeholder="e.g. 1500"
                  />
                </div>
              </div>

              {/* Start Date & End Date */}
              <div className="form-row">
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    required
                    className="glass-input"
                    value={leaseData.startDate}
                    onChange={(e) => setLeaseData(prev => ({ ...prev, startDate: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label>End Date *</label>
                  <input
                    type="date"
                    required
                    className="glass-input"
                    value={leaseData.endDate}
                    onChange={(e) => setLeaseData(prev => ({ ...prev, endDate: e.target.value }))}
                  />
                </div>
              </div>

              {/* Lease Document */}
              <div className="form-group">
                <label>Lease Document *</label>
                <input
                  type="file"
                  required={!leaseData.leaseDocument}
                  accept=".pdf,.doc,.docx,image/*"
                  onChange={(e) => setLeaseData(prev => ({ ...prev, leaseDocument: e.target.files[0] }))}
                  className="glass-input"
                />
              </div>

              <div className="form-actions" style={{ marginTop: '20px' }}>
                <button type="button" className="btn-secondary" onClick={() => setShowLeaseModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Submit Lease</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Properties Table */}
      <div className="properties-table-container glass-panel">
        <h2>Your Listed Properties</h2>
        {properties.length === 0 ? (
          <div className="empty-state">
            <p>No properties listed yet. Click "List New Property" to get started.</p>
          </div>
        ) : (
          <div className="properties-table-wrapper">
            <table className="properties-table">
              <thead>
                <tr>
                  <th>Title</th><th>Location</th><th>Type</th><th>Price</th>
                  <th>Beds</th><th>Status</th><th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.id}>
                    <td>{property.title}</td>
                    <td>{property.full_address}</td>
                    <td>{property.type}</td>
                    <td>${property.price?.toLocaleString('en-US')}</td>
                    <td>{property.bedrooms}</td>
                    <td><span className={`status-pill ${property.status.toLowerCase().replace(' ', '-')}`}>{property.status}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="actions-wrapper">
                        <button className="action-button edit" onClick={() => handleEdit(property.id)}>Edit</button>
                        <button className="action-button delete" onClick={() => handleDelete(property.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default SellPage;
