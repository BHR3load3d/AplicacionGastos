import React from 'react';
import { Box, Card, CardContent, Container, Grid, Typography } from '@mui/material';
import { useApp } from '../contexts/AppContext';

const Dashboard: React.FC = () => {
  const { isOnline, lastSyncTime } = useApp();

  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>

      <Grid container spacing={3}>
        <Grid component="div" xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total de Gastos
              </Typography>
              <Typography variant="h4">
                $0.00
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid component="div" xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Estado del Sistema
              </Typography>
              <Box>
                <Typography>
                  Estado: {isOnline ? 'En línea' : 'Fuera de línea'}
                </Typography>
                <Typography>
                  Última sincronización: {lastSyncTime ? new Date(lastSyncTime).toLocaleString() : 'Nunca'}
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;