import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar.jsx'
import Navbar from './Navbar.jsx'
import { SidebarProvider, useSidebar } from '../context/SidebarContext.jsx'

function LayoutContent() {
  const { isOpen } = useSidebar()
  
  return (
    <div className={`app-shell ${isOpen ? 'sidebar-open' : 'sidebar-closed'} bg-mesh`}>
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
      
      {/* Overlay for mobile when sidebar is open */}
      {isOpen && window.innerWidth <= 1024 && (
        <div 
          className="sidebar-overlay"
          onClick={close}
          style={{ cursor: 'pointer' }}
        />
      )}
    </div>
  )
}

export default function Layout() {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  )
}
