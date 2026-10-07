import React, { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import './BuyPage.css'
import MyProfile from './MyProfile'
import PageHeader from './PageHeader'

const BuyPage = () => {
  const navigate = useNavigate()

  const [properties, setProperties] = useState([])

  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [priceRange, setPriceRange] = useState('any')
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('')
  const [bedroomsFilter, setBedroomsFilter] = useState('')
  const [areaSizeFilter, setAreaSizeFilter] = useState('')

  // 🔄 FETCH FROM BACKEND
  useEffect(() => {
    const params = new URLSearchParams()

    if (searchQuery) params.append('search', searchQuery)
    if (locationFilter) params.append('city', locationFilter)
    if (propertyTypeFilter) params.append('type', propertyTypeFilter)
    if (bedroomsFilter) params.append('bedrooms', bedroomsFilter)
    if (areaSizeFilter) params.append('min_area', areaSizeFilter)

    if (priceRange === 'low') {
      params.append('max_price', 300000)
    } else if (priceRange === 'mid') {
      params.append('min_price', 300000)
      params.append('max_price', 600000)
    } else if (priceRange === 'high') {
      params.append('min_price', 600000)
    }

    fetch(`http://127.0.0.1:8000/property/search/?${params}`)
      .then(res => res.json())
      .then(data => {
         console.log('API DATA:', data)

        setProperties(Array.isArray(data) ? data : data.results || [])
      })
      .catch(err => console.error('API ERROR:', err))
  }, [searchQuery, locationFilter, priceRange, propertyTypeFilter, bedroomsFilter, areaSizeFilter])

  // ✅ THIS WAS MISSING
  const filteredProperties = properties

  // Dropdown values
  const uniqueLocations = useMemo(
    () => [...new Set(properties.map(p => p.city).filter(Boolean))],
    [properties]
  )

  const uniquePropertyTypes = useMemo(
    () => [...new Set(properties.map(p => p.type).filter(Boolean))],
    [properties]
  )

  const handleViewProperty = (property) => {
    navigate(`/property/${property.id}`)
  }
    return (
    <div className="buy-page">
      <div className="buy-page-container">
        {/* Header Section */}
       <PageHeader
  title="Buy Properties"
  subtitle={`${filteredProperties.length} results`}
/>

        {/* Search and Filters */}
        <div className="glass-panel search-filters-section">
          <div className="search-bar enhanced-search-bar">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <path d="m21 21-4.35-4.35" strokeWidth="2" />
            </svg>
            <input
              type="text"
              placeholder="Search by city, neighborhood or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="glass-input-transparent"
            />
          </div>

          <div className="filters-row">
            {/* Location */}
            <div className="filter-group">
              <label>Location</label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="glass-select"
              >
                <option value="">Any</option>
                {uniqueLocations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div className="filter-group">
              <label>Price Range</label>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="glass-select"
              >
                <option value="any">Any</option>
                <option value="low">Below PKR 300k</option>
                <option value="mid">PKR 300k - PKR 600k</option>
                <option value="high">Above PKR 600k</option>
              </select>
            </div>

            {/* Property Type */}
            <div className="filter-group">
              <label>Property Type</label>
              <select
                value={propertyTypeFilter}
                onChange={(e) => setPropertyTypeFilter(e.target.value)}
                className="glass-select"
              >
                <option value="">Any</option>
                {uniquePropertyTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* Bedrooms */}
            <div className="filter-group">
              <label>Bedrooms</label>
              <select
                value={bedroomsFilter}
                onChange={(e) => setBedroomsFilter(e.target.value)}
                className="glass-select"
              >
                <option value="">Any</option>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5+</option>
              </select>
            </div>

            {/* Area Size */}
            <div className="filter-group">
              <label>Min Area (sq ft)</label>
              <input
                type="number"
                min="0"
                placeholder="e.g. 1000"
                value={areaSizeFilter}
                onChange={(e) => setAreaSizeFilter(e.target.value)}
                className="glass-input-small"
              />
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="properties-grid">
          {filteredProperties.map((property) => (
            <div key={property.id} className="glass-panel property-card">
              <div className="property-image-wrapper">
                <img
                  src={
                    property.main_image
                      ? `http://127.0.0.1:8000${property.main_image}`
                      : '/placeholder.jpg'
                  }
                  alt={property.title}
                  className="property-card-image"
                />
                <span className="property-type-pill">{property.propertyType || property.type}</span>
              </div>
              <div className="property-content-wrapper">
                <div className="property-info-main">
                  <h3 className="property-title">{property.name || property.title}</h3>
                  <p className="property-location">{property.full_address || property.location}</p>
                </div>
                <div className="property-price-specs-row">
                  <span className="property-price">
                    PKR {property.price ? property.price.toLocaleString('en-US') : '0'}
                  </span>
                  <div className="property-specs">
                    <span className="spec-item" title="Bedrooms">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spec-icon"><path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9m0-4V5a2 2 0 0 1 2-2h2" /></svg>
                      {property.bedrooms} Beds
                    </span>
                    <span className="spec-item" title="Bathrooms">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spec-icon"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                      {property.bathrooms} Baths
                    </span>
                    <span className="spec-item" title="Area size">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="spec-icon"><path d="M3 21h18M5 21V7l8-4 8 4v14" /></svg>
                      {Number(property.areaSize || property.area_size || 0).toLocaleString('en-US')} sq ft
                    </span>
                  </div>
                </div>
                <button
                  className="btn-primary view-property-button"
                  onClick={() => handleViewProperty(property)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
          {filteredProperties.length === 0 && (
            <div className="no-results glass-panel">
              <p>No properties match your filters. Try adjusting your search.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BuyPage

