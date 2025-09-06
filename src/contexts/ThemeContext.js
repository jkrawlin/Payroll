import React, { createContext, useContext, useState, useEffect } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CssBaseline, useMediaQuery } from '@mui/material';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeContextProvider');
  }
  return context;
};

const createAppTheme = (mode) => createTheme({
  palette: {
    mode,
    primary: {
      main: mode === 'light' ? '#6a1b9a' : '#ab47bc',
      light: '#9c27b0',
      dark: '#4a148c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: mode === 'light' ? '#00bcd4' : '#4dd0e1',
      light: '#26c6da',
      dark: '#0097a7',
    },
    background: {
      default: mode === 'light' ? '#f8fafc' : '#0f0f0f',
      paper: mode === 'light' ? '#ffffff' : '#1a1a1a',
      surface: mode === 'light' ? '#f1f5f9' : '#262626',
    },
    text: {
      primary: mode === 'light' ? '#1e293b' : '#ffffff',
      secondary: mode === 'light' ? '#64748b' : '#b0b0b0',
      disabled: mode === 'light' ? '#94a3b8' : '#666666',
    },
    divider: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
    action: {
      hover: mode === 'light' ? 'rgba(0, 0, 0, 0.04)' : 'rgba(255, 255, 255, 0.08)',
      selected: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.12)',
    },
    qatar: {
      maroon: '#800000',
      gold: '#FFD700',
    }
  },
  typography: {
    fontFamily: '"Inter", "Roboto", -apple-system, BlinkMacSystemFont, sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.025em',
      color: mode === 'light' ? '#1e293b' : '#ffffff',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.025em',
      color: mode === 'light' ? '#1e293b' : '#ffffff',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      color: mode === 'light' ? '#334155' : '#f1f5f9',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      color: mode === 'light' ? '#475569' : '#e2e8f0',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: mode === 'light' ? '#475569' : '#cbd5e1',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: mode === 'light' ? '#64748b' : '#94a3b8',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: mode === 'light' ? '#f8fafc' : '#0f0f0f',
          color: mode === 'light' ? '#1e293b' : '#ffffff',
          transition: 'background-color 0.3s ease, color 0.3s ease',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? '#ffffff' : '#1a1a1a',
          color: mode === 'light' ? '#1e293b' : '#ffffff',
          borderRadius: 16,
          boxShadow: mode === 'light' 
            ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
          border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
          transition: 'background-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: mode === 'light'
              ? '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
              : '0 10px 15px -3px rgba(0, 0, 0, 0.8), 0 4px 6px -2px rgba(0, 0, 0, 0.5)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? '#ffffff' : '#1a1a1a',
          color: mode === 'light' ? '#1e293b' : '#ffffff',
          border: mode === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          color: mode === 'light' ? '#374151' : '#f9fafb',
          borderBottomColor: mode === 'light' ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.08)',
        },
        head: {
          backgroundColor: mode === 'light' ? '#f8fafc' : '#262626',
          color: mode === 'light' ? '#1f2937' : '#ffffff',
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: mode === 'light' ? '#ffffff' : '#1a1a1a',
            color: mode === 'light' ? '#1e293b' : '#ffffff',
            '& fieldset': {
              borderColor: mode === 'light' ? '#d1d5db' : '#374151',
            },
            '&:hover fieldset': {
              borderColor: mode === 'light' ? '#6b7280' : '#6b7280',
            },
            '&.Mui-focused fieldset': {
              borderColor: mode === 'light' ? '#6a1b9a' : '#ab47bc',
            },
          },
          '& .MuiInputLabel-root': {
            color: mode === 'light' ? '#6b7280' : '#9ca3af',
            '&.Mui-focused': {
              color: mode === 'light' ? '#6a1b9a' : '#ab47bc',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          fontWeight: 600,
          padding: '10px 24px',
          boxShadow: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.15)',
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          background: mode === 'light' 
            ? 'linear-gradient(45deg, #6a1b9a 30%, #ab47bc 90%)'
            : 'linear-gradient(45deg, #ab47bc 30%, #ce93d8 90%)',
          color: '#ffffff',
          '&:hover': {
            background: mode === 'light'
              ? 'linear-gradient(45deg, #4a148c 30%, #8e24aa 90%)'
              : 'linear-gradient(45deg, #9c27b0 30%, #ba68c8 90%)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: mode === 'light' ? '#e2e8f0' : '#374151',
          color: mode === 'light' ? '#1e293b' : '#f9fafb',
          '&:hover': {
            backgroundColor: mode === 'light' ? '#cbd5e1' : '#4b5563',
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          padding: 8,
          '& .MuiSwitch-track': {
            borderRadius: 22 / 2,
            backgroundColor: mode === 'light' ? '#e2e8f0' : '#374151',
            '&:before, &:after': {
              content: '""',
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 16,
              height: 16,
            },
          },
          '& .MuiSwitch-thumb': {
            boxShadow: 'none',
            width: 16,
            height: 16,
            margin: 2,
            backgroundColor: mode === 'light' ? '#ffffff' : '#f1f5f9',
          },
        },
      },
    },
  },
  shape: {
    borderRadius: 12,
  },
});

export const ThemeContextProvider = ({ children }) => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('themeMode');
    return saved || (prefersDarkMode ? 'dark' : 'light');
  });

  useEffect(() => {
    localStorage.setItem('themeMode', mode);
  }, [mode]);

  const toggleMode = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  const theme = createAppTheme(mode);

  const contextValue = {
    mode,
    toggleMode,
    theme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeContextProvider;
