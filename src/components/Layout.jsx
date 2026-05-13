import React, { memo, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  ChartBar, List, X, Stack, Checks, CaretLeft, CaretRight,
} from './icons';
import { useTenant } from '../hooks/useTenant';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: ChartBar, end: true },
  { to: '/tasks', label: 'Tasks', icon: Checks, end: false },
  { to: '/skills', label: 'Skills', icon: Stack, end: false },
];

const Layout = memo(() => {
  const tenant = useTenant();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const renderNav = (onClickClose, collapsed = false) => (
    <>
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <WireNavItem
          key={to}
          to={to}
          end={end}
          icon={<Icon size={20} />}
          label={label}
          onClick={onClickClose}
          collapsed={collapsed}
        />
      ))}
    </>
  );

  const sidebarContent = (onClickClose, collapsed) => (
    <>
      <div className="h-16 flex items-center px-3 mb-6 overflow-hidden">
        <img
          src={tenant.logo_path}
          alt={tenant.tenant_name}
          className={`${collapsed ? 'h-[19px] translate-y-px' : 'h-[22px]'} w-auto object-contain flex-shrink-0`}
        />
      </div>
      <nav className={`flex-1 space-y-1 ${collapsed ? 'overflow-visible' : 'overflow-hidden'}`}>
        {renderNav(onClickClose, collapsed)}
      </nav>
    </>
  );

  return (
    <div className="h-screen font-sans antialiased bg-white text-black">
      {/* Sidebar */}
      <aside
        className={`hidden lg:flex fixed left-0 top-0 h-full flex-col px-4 pb-4 z-50 ${sidebarCollapsed ? 'w-[76px]' : 'w-[260px]'}`}
        style={{ backgroundColor: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setSidebarCollapsed(c => !c)}
          className="absolute bg-white flex items-center justify-center transition-all z-[60] text-gray-600 hover:text-gray-900 hover:bg-gray-50 cursor-pointer"
          style={{
            width: '28px',
            height: '28px',
            right: '-14px',
            top: '20px',
            borderRadius: '50%',
            border: '1px solid #D1D5DB',
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          {sidebarCollapsed ? <CaretRight size={14} weight="bold" /> : <CaretLeft size={14} weight="bold" />}
        </button>
        {sidebarContent(null, sidebarCollapsed)}
      </aside>

      {/* Mobile drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <aside
            className="absolute left-0 top-0 bottom-0 w-[280px] flex flex-col p-4 space-y-2"
            style={{ backgroundColor: 'var(--sidebar-bg)' }}
          >
            <div className="flex items-center justify-between mb-8 px-3">
              <img src={tenant.logo_path} alt={tenant.tenant_name} className="h-5 w-auto object-contain" />
              <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-gray-500" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <nav className="flex-1 space-y-1">
              {renderNav(() => setMobileMenuOpen(false))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <main
        className={`h-screen overflow-y-auto bg-white transition-[margin] duration-200 ${sidebarCollapsed ? 'lg:ml-[76px]' : 'lg:ml-[260px]'}`}
        style={{ overscrollBehavior: 'none' }}
      >
        {/* Header */}
        <header
          className="h-16 sticky top-0 flex justify-between items-center w-full px-4 sm:px-6 lg:px-8 z-40"
          style={{
            backgroundColor: 'rgba(255,255,255,0.55)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          }}
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 text-gray-500"
              aria-label="Open menu"
            >
              <List size={20} />
            </button>
            <div className="flex flex-col">
              <span className="text-[15px] font-semibold text-black leading-tight">{tenant.tenant_name}</span>
              {tenant.tagline && (
                <span className="text-[12px] leading-tight" style={{ color: 'var(--text-tertiary)' }}>
                  {tenant.tagline}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <LiveStatusDot />
            <span className="hidden sm:inline text-[11px]" style={{ color: 'var(--text-tertiary)' }}>
              Live
            </span>
          </div>
        </header>

        <div className="flex-1 flex flex-col">
          <Outlet />
        </div>
      </main>
    </div>
  );
});

const LiveStatusDot = memo(() => (
  <span
    className="inline-block w-2 h-2 rounded-full"
    style={{
      backgroundColor: 'var(--color-positive)',
      boxShadow: '0 0 0 3px rgba(4, 120, 87, 0.15)',
    }}
    aria-label="Live"
  />
));

const WireNavItem = memo(({ to, icon, label, onClick, end, collapsed }) => (
  <NavLink
    to={to}
    end={end}
    onClick={onClick}
    title={collapsed ? label : undefined}
    className={({ isActive }) =>
      `flex items-center space-x-3 px-3 h-10 transition-all overflow-hidden whitespace-nowrap rounded-[6px] ${
        isActive
          ? 'text-black font-semibold'
          : 'text-gray-700'
      }`
    }
    style={({ isActive }) => isActive ? { backgroundColor: 'var(--sidebar-active)' } : undefined}
  >
    {({ isActive }) => (
      <>
        <span
          className="flex-shrink-0"
          style={{ color: isActive ? 'var(--brand-primary)' : undefined }}
        >
          {icon}
        </span>
        {!collapsed && <span className="text-[15px]">{label}</span>}
      </>
    )}
  </NavLink>
));

Layout.displayName = 'Layout';
WireNavItem.displayName = 'WireNavItem';
LiveStatusDot.displayName = 'LiveStatusDot';

export default Layout;
