import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const consumerLinks = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/subscriptions', icon: '📦', label: 'My Subscription' },
  { to: '/deliveries', icon: '🚚', label: 'Deliveries' },
  { to: '/customizations', icon: '🔄', label: 'Box Customization' },
  { to: '/produce', icon: '🥦', label: 'Browse Produce' },
  { to: '/notifications', icon: '🔔', label: 'Notifications' },
];

const farmerLinks = [
  { to: '/farmer', icon: '🏡', label: 'Dashboard' },
  { to: '/farmer/inventory', icon: '🌾', label: 'My Inventory' },
  { to: '/notifications', icon: '🔔', label: 'Notifications' },
];

const adminLinks = [
  { to: '/admin', icon: '📊', label: 'Dashboard' },
  { to: '/admin/users', icon: '👥', label: 'Users' },
  { to: '/admin/deliveries', icon: '🚚', label: 'Deliveries' },
  { to: '/admin/manifests', icon: '📋', label: 'Manifests' },
  { to: '/admin/customizations', icon: '🔄', label: 'Swap Requests' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const links = user?.role === 'admin' ? adminLinks
    : user?.role === 'farmer' ? farmerLinks
    : consumerLinks;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div style={{ fontSize: '1.5rem', marginBottom: 6 }}>🌿</div>
        <h2>Local Food Loop</h2>
        <span>Farm-to-Table Platform</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">
          {user?.role === 'admin' ? 'Administration'
            : user?.role === 'farmer' ? 'Farm Management'
            : 'My Account'}
        </div>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/dashboard' || link.to === '/farmer' || link.to === '/admin'}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <span className="icon">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-badge">
          <div className="name">{user?.first_name} {user?.last_name}</div>
          <div className="role">{user?.role}</div>
        </div>
        <button className="logout-btn" onClick={handleLogout}>Sign out</button>
      </div>
    </aside>
  );
}