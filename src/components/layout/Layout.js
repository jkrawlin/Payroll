import React, { useState } from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import { motion } from 'framer-motion';

const Layout = ({ children, role = 'admin' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateAreas: isMobile ? "'main'" : "'sidebar main'",
        gridTemplateColumns: isMobile ? '1fr' : '280px 1fr',
        gridTemplateRows: 'auto 1fr',
        minHeight: '100vh',
        overflow: 'hidden',
        backgroundColor: theme.palette.background.default,
      }}
      className="app-layout"
    >
      {/* Sidebar */}
      <Box
        sx={{
          gridArea: 'sidebar',
          position: isMobile ? 'fixed' : 'relative',
          top: 0,
          left: 0,
          zIndex: 1000,
          width: '280px',
          height: '100vh',
          transform: isMobile && !mobileOpen ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 0.3s ease-in-out',
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Sidebar
          open={mobileOpen}
          onClose={handleDrawerToggle}
          role={role}
        />
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        role="main"
        aria-label="Employee Management"
        sx={{
          gridArea: 'main',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
          backgroundColor: theme.palette.background.default,
          marginLeft: isMobile ? 0 : 0,
        }}
      >
        {/* Header */}
        <Header
          onDrawerToggle={handleDrawerToggle}
          role={role}
        />

        {/* Page Content */}
        <Box
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            mt: 0,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            style={{ height: '100%' }}
          >
            {children}
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
