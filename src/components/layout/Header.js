import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Button,
  Avatar,
  Menu,
  MenuItem,
  Switch,
  Tooltip,
  Alert,
  Collapse,
  useTheme,
  useMediaQuery,
  InputBase,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  NotificationsActive as NotificationIcon,
  AccountCircle,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';

const Header = ({ onDrawerToggle, role = 'admin' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { mode, toggleMode } = useCustomTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [showDemoAlert, setShowDemoAlert] = useState(true);

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const SearchBox = () => (
    <Box
      sx={{
        position: 'relative',
        borderRadius: 3,
        backgroundColor: alpha(theme.palette.common.black, 0.05),
        '&:hover': {
          backgroundColor: alpha(theme.palette.common.black, 0.08),
        },
        marginRight: theme.spacing(2),
        marginLeft: 0,
        width: '100%',
        [theme.breakpoints.up('sm')]: {
          marginLeft: theme.spacing(3),
          width: 'auto',
        },
      }}
    >
      <Box
        sx={{
          padding: theme.spacing(0, 2),
          height: '100%',
          position: 'absolute',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <SearchIcon sx={{ color: theme.palette.text.secondary }} />
      </Box>
      <InputBase
        placeholder="Search employees, customers..."
        inputProps={{ 'aria-label': 'search' }}
        sx={{
          color: 'inherit',
          '& .MuiInputBase-input': {
            padding: theme.spacing(1, 1, 1, 0),
            paddingLeft: `calc(1em + ${theme.spacing(4)})`,
            transition: theme.transitions.create('width'),
            width: '100%',
            [theme.breakpoints.up('md')]: {
              width: '25ch',
            },
          },
        }}
      />
    </Box>
  );

  return (
    <Box>
      <AppBar 
        position="sticky" 
        elevation={1}
        sx={{ 
          zIndex: theme.zIndex.drawer + 1,
          backdropFilter: 'blur(10px)',
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
        }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={onDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo and Title */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  background: 'linear-gradient(135deg, #6a1b9a 0%, #00bcd4 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 1.5,
                  fontSize: '1.5rem',
                }}
              >
                🏢
              </Box>
              {!isMobile && (
                <Box>
                  <Typography 
                    variant="h6" 
                    noWrap 
                    component="div"
                    sx={{ 
                      fontWeight: 700,
                      background: 'linear-gradient(135deg, #6a1b9a 0%, #00bcd4 100%)',
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Qatar Payroll
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: theme.palette.text.secondary,
                      display: 'block',
                      lineHeight: 1,
                      mt: -0.5,
                    }}
                  >
                    Management System
                  </Typography>
                </Box>
              )}
            </Box>
          </motion.div>

          {/* Search Box */}
          {!isMobile && <SearchBox />}

          <Box sx={{ flexGrow: 1 }} />

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton color="inherit">
                <NotificationIcon />
              </IconButton>
            </Tooltip>

            {/* Theme Toggle */}
            <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
              <IconButton onClick={toggleMode} color="inherit">
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
              </IconButton>
            </Tooltip>

            {/* Profile Menu */}
            <Tooltip title="Account settings">
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="primary-search-account-menu"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                color="inherit"
                sx={{ ml: 1 }}
              >
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32,
                    background: 'linear-gradient(135deg, #6a1b9a 0%, #00bcd4 100%)',
                  }}
                >
                  {role.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>

        {/* Mobile Search */}
        {isMobile && (
          <Box sx={{ px: 2, pb: 1 }}>
            <SearchBox />
          </Box>
        )}
      </AppBar>

      {/* Demo Alert */}
      <Collapse in={showDemoAlert}>
        <Alert 
          severity="info"
          variant="filled"
          sx={{
            backgroundColor: theme.palette.secondary.main,
            color: 'white',
            '& .MuiAlert-icon': { color: 'white' },
            borderRadius: 0,
          }}
          action={
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={() => setShowDemoAlert(false)}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          }
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            🚀 <strong style={{ marginLeft: 8, marginRight: 8 }}>Demo Mode Active</strong> 
            - All features are accessible without Firebase configuration
          </Box>
        </Alert>
      </Collapse>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        keepMounted
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 200,
            borderRadius: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          },
        }}
      >
        <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="subtitle2" color="text.secondary">
            Signed in as
          </Typography>
          <Typography variant="body1" fontWeight={600}>
            {role.charAt(0).toUpperCase() + role.slice(1)} User
          </Typography>
        </Box>
        
        <MenuItem onClick={handleMenuClose}>
          <AccountCircle sx={{ mr: 2 }} />
          Profile Settings
        </MenuItem>
        
        <MenuItem 
          onClick={() => {
            // Demo logout
            alert('Logout functionality disabled in demo mode');
            handleMenuClose();
          }}
        >
          <Typography color="error">Sign Out</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Header;
