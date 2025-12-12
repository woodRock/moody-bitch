// src/pages/NotFound.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/NotFound.css';

const NotFound: React.FC = () => {
  return (
    <div className="not-found-container">
      <div className="text-center">
        <h1 className="not-found-title">404</h1>
        <p className="not-found-text">Page Not Found</p>
        <Link 
          to="/" 
          className="btn btn-primary"
          style={{ textDecoration: 'none' }}
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
