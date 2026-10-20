import React from 'react';
import { Link } from 'react-router-dom';
import { lastRoute } from '../lib/lastRoute';

const NotFound: React.FC = () => (
  <div className="fatal-screen">
    <h1 className="skyrim-font">LOST IN THE FOG</h1>
    <div className="menu-separator" style={{ margin: '1rem auto', width: '260px' }} />
    <p className="skyrim-serif">No road leads here. The map does not know this place.</p>
    <Link to={lastRoute()} className="btn-ghost skyrim-font">{lastRoute() === '/today' ? 'RETURN TO TODAY' : 'BACK TO WHERE YOU WERE'}</Link>
  </div>
);

export default NotFound;
