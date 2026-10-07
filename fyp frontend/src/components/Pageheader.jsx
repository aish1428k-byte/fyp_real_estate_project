import React from 'react'
import MyProfile from './MyProfile'

const PageHeader = ({ title, subtitle, children }) => {
  return (
    <div
      className="page-header"
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: '30px'
      }}
    >
      {/* LEFT */}
      <div className="header-left">
        <h1 className="text-gradient">{title}</h1>

        {subtitle && (
          <span className="property-count">
            {subtitle}
          </span>
        )}
      </div>

      {/* RIGHT */}
      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <MyProfile />
      </div>

      {children}
    </div>
  )
}

export default PageHeader