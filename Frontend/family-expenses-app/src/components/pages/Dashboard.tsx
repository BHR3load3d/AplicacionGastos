import React from 'react';
import { Box, Typography } from '@mui/material';

const Dashboard: React.FC = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography>
        Bienvenido a la aplicación de gastos familiares
      </Typography>
    </Box>
  );
};

export default Dashboard;