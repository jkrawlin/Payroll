import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  Divider,
  Collapse,
  IconButton,
  useTheme,
  useMediaQuery,
  Avatar,
  Chip,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  AccountBalance as PayrollIcon,
  Business as BusinessIcon,
  Receipt as ReceiptIcon,
  Analytics as AnalyticsIcon,
  Person as PersonIcon,
  AccountBalanceWallet as AccountsIcon,
  ExpandLess,
  ExpandMore,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const DRAWER_WIDTH = 280;

const menuItems = [
  {
    title: 'Dashboard',
    path: '/',
    icon: <DashboardIcon />,
    roles: ['admin', 'hr', 'accountant', 'employee'],
  },
  {
    title: 'HR Management',
    icon: <PeopleIcon />,
    roles: ['admin', 'hr'],
    children: [
      { title: 'Employees', path: '/employees', icon: <PeopleIcon /> },
      { title: 'Payroll', path: '/payroll', icon: <PayrollIcon /> },
    ],
  },
  {
    title: 'Finance',
    icon: <AccountsIcon />,
    roles: ['admin', 'accountant'],
    children: [
      { title: 'Customers', path: '/customers', icon: <BusinessIcon /> },
      { title: 'Accounts', path: '/accounts', icon: <AccountsIcon /> },
      { title: 'Receipts', path: '/receipts', icon: <ReceiptIcon /> },
    ],
  },
  // Removed "Insights" and "Self Service" for streamlined navigation
];

const Sidebar = ({ open, onClose, role = 'admin' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState({});

  const handleItemClick = (item) => {
    if (item.children) {
      setExpandedItems(prev => ({
        ...prev,
        [item.title]: !prev[item.title]
      }));
    } else if (item.path) {
      navigate(item.path);
      if (isMobile) onClose();
    }
  };

  const isActive = (path) => location.pathname === path;

  const accessibleItems = menuItems.filter(item => 
    item.roles.includes(role)
  );

  const sidebarContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ 
        p: 3, 
        background: theme.palette.mode === 'light' 
          ? 'linear-gradient(135deg, #6a1b9a 0%, #00bcd4 100%)'
          : 'linear-gradient(135deg, #ab47bc 0%, #4dd0e1 100%)',
        color: 'white',
        position: 'relative',
      }}>
        {isMobile && (
          <IconButton
            onClick={onClose}
            sx={{ 
              position: 'absolute', 
              right: 8, 
              top: 8, 
              color: 'white' 
            }}
          >
            <ChevronLeftIcon />
          </IconButton>
        )}
        
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Avatar 
            sx={{ 
              width: 56, 
              height: 56, 
              mb: 2,
              background: 'rgba(255, 255, 255, 0.2)',
              fontSize: '1.5rem'
            }}
          >
            <BusinessIcon sx={{ fontSize: 32, color: 'white' }} />
          </Avatar>
        </motion.div>
        
        <Typography variant="h6" fontWeight={700} gutterBottom>
          Qatar Payroll
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
          Management System
        </Typography>
        <Chip 
          label={role.charAt(0).toUpperCase() + role.slice(1)}
          size="small"
          sx={{ 
            background: 'rgba(255, 255, 255, 0.2)',
            color: 'white',
            fontWeight: 600,
          }}
        />
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, px: 1, py: 2 }}>
        {accessibleItems.map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <ListItem disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleItemClick(item)}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  backgroundColor: (item.path && isActive(item.path)) 
                    ? theme.palette.primary.main + '15' 
                    : 'transparent',
                  color: (item.path && isActive(item.path))
                    ? theme.palette.primary.main
                    : theme.palette.text.primary,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main + '10',
                    transform: 'translateX(4px)',
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                <ListItemIcon 
                  sx={{ 
                    color: (item.path && isActive(item.path))
                      ? theme.palette.primary.main
                      : theme.palette.text.secondary,
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.title}
                  primaryTypographyProps={{ 
                    fontWeight: (item.path && isActive(item.path)) ? 600 : 500,
                    fontSize: '0.95rem',
                  }}
                />
                {item.children && (
                  expandedItems[item.title] ? <ExpandLess /> : <ExpandMore />
                )}
              </ListItemButton>
            </ListItem>

            {/* Submenu */}
            {item.children && (
              <Collapse in={expandedItems[item.title]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((child) => (
                    <ListItem key={child.title} disablePadding>
                      <ListItemButton
                        onClick={() => {
                          navigate(child.path);
                          if (isMobile) onClose();
                        }}
                        sx={{
                          pl: 4,
                          mx: 1,
                          borderRadius: 2,
                          backgroundColor: isActive(child.path)
                            ? theme.palette.primary.main + '15'
                            : 'transparent',
                          color: isActive(child.path)
                            ? theme.palette.primary.main
                            : theme.palette.text.primary,
                          '&:hover': {
                            backgroundColor: theme.palette.primary.main + '10',
                            transform: 'translateX(4px)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <ListItemIcon 
                          sx={{ 
                            color: isActive(child.path)
                              ? theme.palette.primary.main
                              : theme.palette.text.secondary,
                            minWidth: 40,
                          }}
                        >
                          {child.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={child.title}
                          primaryTypographyProps={{
                            fontWeight: isActive(child.path) ? 600 : 500,
                            fontSize: '0.9rem',
                          }}
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            )}
          </motion.div>
        ))}
      </List>

      <Divider />
      
      {/* Footer */}
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          © 2025 Qatar Payroll System
        </Typography>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        variant="temporary"
        open={open}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: DRAWER_WIDTH,
            border: 0,
          },
        }}
      >
        {sidebarContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          border: 0,
          background: theme.palette.background.paper,
        },
      }}
    >
      {sidebarContent}
    </Drawer>
  );
};

export default Sidebar;
