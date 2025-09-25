import React from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { NotificationProvider } from './contexts/NotificationContext';
import { AppProvider } from './contexts/AppContext';
import { BrowserRouter } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationProvider>
          <AppProvider>
            <MainLayout />
          </AppProvider>
        </NotificationProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default App;
