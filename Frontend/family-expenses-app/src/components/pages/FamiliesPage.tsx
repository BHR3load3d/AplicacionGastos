import React, { useEffect, useState, useRef } from 'react';
import { Box, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography, TextField, Stack } from '@mui/material';
import { FamilyService } from '../../services/FamilyService';
import { useNotification } from '../../contexts/NotificationContext';

interface RemoteFamily {
  id: string;
  name: string;
}

const FamiliesPage: React.FC = () => {
  const [families, setFamilies] = useState<RemoteFamily[]>([]);
  const [currentRemoteId, setCurrentRemoteId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const { showNotification } = useNotification();
  const loadingRef = useRef(false);

  const load = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      // 1) Local-first
      const localList = await FamilyService.getLocalFamilies();
      setFamilies(localList);
      const ridLocal = await FamilyService.getRemoteFamilyId();
      setCurrentRemoteId(ridLocal);

      // 2) Background refresh if online
      if (navigator.onLine) {
        try {
          const list = await FamilyService.fetchRemoteFamilies();
          setFamilies(list);
          const rid = await FamilyService.getRemoteFamilyId();
          setCurrentRemoteId(rid);
        } catch (e) {
          // keep local data; do not spam notifications
          console.warn('No se pudo refrescar familias desde el servidor', e);
        }
      } else {
        showNotification('Trabajando sin conexión', 'warning');
      }
    } catch (e) {
      showNotification('Error al cargar familias', 'error');
      console.error(e);
    } finally {
      loadingRef.current = false;
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectFamily = async (fam: RemoteFamily) => {
    try {
      await FamilyService.setCurrentRemoteFamily(fam.id, fam.name);
      setCurrentRemoteId(fam.id);
      showNotification('Familia seleccionada', 'success');
    } catch (e) {
      showNotification('No se pudo seleccionar la familia', 'error');
    }
  };

  const createFamily = async () => {
    const name = newName.trim() || 'Nueva Familia';
    try {
      const res = await fetch('http://localhost:5272/api/families', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const created = await res.json();
      showNotification('Familia creada', 'success');
      setNewName('');
      await FamilyService.setCurrentRemoteFamily(created.id, created.name);
      setCurrentRemoteId(created.id);
      await load();
    } catch (e) {
      showNotification('No se pudo crear la familia', 'error');
      console.error(e);
    }
  };

  const deleteFamily = async (fam: RemoteFamily) => {
    if (!window.confirm('¿Eliminar esta familia?')) return;
    try {
      const res = await fetch(`http://localhost:5272/api/families/${fam.id}`, { method: 'DELETE' });
      if (res.status === 204) {
        showNotification('Familia eliminada', 'success');
        if (currentRemoteId === fam.id) {
          await FamilyService.setCurrentRemoteFamily('', '');
          setCurrentRemoteId(null);
        }
        await load();
      } else if (res.status === 409) {
        const body = await res.json().catch(() => ({}));
        showNotification(body.message || 'No se puede eliminar: tiene datos relacionados', 'warning');
      } else {
        showNotification(`Error al eliminar (HTTP ${res.status})`, 'error');
      }
    } catch (e) {
      showNotification('No se pudo eliminar la familia', 'error');
      console.error(e);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Familias
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <TextField label="Nombre de familia" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Button variant="contained" onClick={createFamily}>Crear</Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Actual</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {families.map(f => (
              <TableRow key={f.id} selected={currentRemoteId === f.id}>
                <TableCell>{f.name}</TableCell>
                <TableCell>{currentRemoteId === f.id ? 'Sí' : ''}</TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={1} justifyContent="flex-end">
                    <Button variant="outlined" onClick={() => selectFamily(f)} disabled={currentRemoteId === f.id}>
                      Seleccionar
                    </Button>
                    <Button color="error" variant="outlined" onClick={() => deleteFamily(f)}>
                      Eliminar
                    </Button>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {families.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">No hay familias</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default FamiliesPage;
