import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import './PropertyDetails.css'
import PageHeader from './PageHeader'

const PropertyDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()

  const [property, setProperty] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [isContactOpen, setIsContactOpen] = useState(false)

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })

  // Images array safe
  const images = property?.gallery_images?.length > 0
    ? property.gallery_images
    : property?.main_image
      ? [`http://127.0.0.1:8000${property.main_image}`]
      : []

  // Fetch property
  useEffect(() => {
    fetch(`http://127.0.0.1:8000/property/singleview/${id}/`)
      .then(res => res.json())
      .then(data => {
        setProperty(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  if (loading) return <p style={{ padding: 40 }}>Loading property details...</p>

  
  if (!property) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Property not found</h2>
        <button onClick={() => navigate('/buy')} className="btn-primary">
          Back to Listings
        </button>
      </div>
    )
  }

  //  const mapQuery = encodeURIComponent(property.address || property.location)
  const mapSrc =
  property.latitude && property.longitude
    ? `https://maps.google.com/maps?q=${property.latitude},${property.longitude}&z=15&output=embed`
    : property.full_address
      ? `https://maps.google.com/maps?q=${encodeURIComponent(property.full_address)}&output=embed`
      : null;
  return (
    <div className="property-details-page">
      <div className="property-details-container">
        

        {/* Header */}
        <div className="details-header mb-6">
          
          <div className="flex justify-between items-end mt-4 flex-wrap gap-4">
            
<PageHeader
  title="Property Details"
/>
            <div>
              <h1 className="text-gradient text-4xl font-bold mb-2">
                {property.name || property.title}
              </h1>
              <p className="text-xl text-muted">
  {property.full_address || property.city}
              </p>
            </div>
            <div className="price-tag text-3xl font-bold text-primary">
              PKR {Number(property.price || 0).toLocaleString('en-US')}
            </div>
          </div>
        </div>

        <div className="property-details-layout">
          <div className="property-main">
            <div className="glass-panel property-gallery">
              <div className="property-hero-image">
                {images.length > 0 ? (
                  <img src={images[activeImageIndex]} alt={property.name} />
                ) : (
                  <div className="no-image-placeholder">No Image Available</div>
                )}
                <div className="img-overlay"></div>
              </div>

              {images.length > 1 && (
                <div className="property-thumbnails">
                  {images.map((img, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`thumbnail-button ${index === activeImageIndex ? 'active' : ''}`}
                      onClick={() => setActiveImageIndex(index)}
                    >
                      <img src={img} alt={`${property.name} ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-panel mt-8 p-6">
              <h2 className="section-title">Description</h2>
              <p className="details-description">{property.description}</p>
            </div>

            <div className="glass-panel mt-8 p-6">
              <h2 className="section-title">Location</h2>
              <p className="map-address mb-4">  {property.full_address}</p>
              <div className="map-frame-wrapper">
                {mapSrc ? (
  <iframe
    title="Property Location"
    src={mapSrc}
    loading="lazy"
    allowFullScreen
  />
) : (
  <p>Location not available</p>
)}

              </div>
            </div>
          </div>

          <div className="property-sidebar">
            <div className="glass-panel p-6">
              <h2 className="section-title mb-4">Quick Summary</h2>
              <div className="features-grid">
                <div className="feature-item">
                  <span className="label">Type</span>
                  <span className="value">{property.propertyType || property.type}</span>
                </div>
                <div className="feature-item">
                  <span className="label">Bedrooms</span>
                  <span className="value">{property.bedrooms}</span>
                </div>
                <div className="feature-item">
                  <span className="label">Bathrooms</span>
                  <span className="value">{property.bathrooms}</span>
                </div>
                <div className="feature-item">
                  <span className="label">Area</span>
                  <span className="value">
                    {Number(property.areaSize || property.area_size || 0).toLocaleString('en-US')} sq ft
                  </span>
                </div>
              </div>
          {localStorage.getItem('userRole') === 'buyer' && (

              <div className="contact-section">
                <h3 className="text-xl font-bold mb-2">Interested?</h3>
                <p className="text-muted mb-4">Contact an agent to schedule a viewing.</p>
                <button
                  className="btn-primary w-full"
                  type="button"
                  onClick={() => setIsContactOpen(true)}
                >
                  Contact 
                </button>
              </div>
          )}
            </div>
          </div>
        </div>

      </div>

      {/* ✅ CONTACT MODAL FIXED */}
      {isContactOpen && (
        <div className="contact-modal-overlay">
          <div className="contact-modal glass-panel">
            <div className="contact-modal-header">
              <h2 className="text-xl font-bold">Contact Agent</h2>
              <button
                type="button"
                className="modal-close-button"
                onClick={() => setIsContactOpen(false)}
              >
                ✕
              </button>
            </div>
            <p className="text-muted mb-6">Regarding: {property.name || property.title}</p>

            <form
              className="contact-form"
              onSubmit={(e) => {
                e.preventDefault()

                const token = localStorage.getItem('access') // JWT token

                fetch('http://127.0.0.1:8000/messages/send/', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    property: property.id,          // ✅ property ID
                    message: contactForm.message,   // ✅ actual message
                  }),
                })
                  .then(async (res) => {
                    if (!res.ok) {
                      const err = await res.json()
                      throw err
                    }
                    return res.json()
                  })
                  .then(() => {
                    alert('Message sent successfully')
                    setIsContactOpen(false)
                    setContactForm({
                      name: '',
                      email: '',
                      phone: '',
                      message: '',
                    })
                  })
                  .catch((err) => {
                    console.error(err)
                    alert('Please login to send message')
                  })
              }}
            >
             
              <div className="form-group mb-6">
                <label>Message</label>
                <textarea
                  rows="4"
                  className="glass-input w-full"
                  value={contactForm.message}
                  onChange={(e) =>
                    setContactForm((prev) => ({ ...prev, message: e.target.value }))
                  }
                />
              </div>
              <div className="modal-actions">
                <button type="submit" className="btn-primary w-full">
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default PropertyDetails
