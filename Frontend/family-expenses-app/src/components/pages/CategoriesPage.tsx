import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { CategoryService } from '../../services/CategoryService';
import { useNotification } from '../../contexts/NotificationContext';
import type { Category, CategoryFormData } from '../../types/Category';

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: ''
  });
  const { showNotification } = useNotification();

  const loadCategories = async () => {
    try {
      const loadedCategories = await CategoryService.getAll();
      setCategories(loadedCategories);
    } catch (error) {
      showNotification('Error al cargar las categorías', 'error');
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleAddCategory = () => {
    setSelectedCategory(null);
    setFormData({ name: '', description: '' });
    setIsFormOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setSelectedCategory(category);
    setFormData(category);
    setIsFormOpen(true);
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!window.confirm('¿Está seguro de eliminar esta categoría?')) {
      return;
    }

    try {
      await CategoryService.delete(category.id);
      showNotification('Categoría eliminada correctamente', 'success');
      loadCategories();
    } catch (error) {
      showNotification('Error al eliminar la categoría', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (selectedCategory) {
        await CategoryService.update(selectedCategory.id, formData);
        showNotification('Categoría actualizada correctamente', 'success');
      } else {
        await CategoryService.add(formData);
        showNotification('Categoría agregada correctamente', 'success');
      }
      setIsFormOpen(false);
      loadCategories();
    } catch (error) {
      showNotification('Error al guardar la categoría', 'error');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Categorías</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddCategory}
        >
          Nueva Categoría
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.description}</TableCell>
                <TableCell align="center">
                  <IconButton
                    color="primary"
                    onClick={() => handleEditCategory(category)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteCategory(category)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {categories.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No hay categorías registradas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={isFormOpen} onClose={() => setIsFormOpen(false)}>
        <form onSubmit={handleSubmit}>
          <DialogTitle>
            {selectedCategory ? 'Editar Categoría' : 'Nueva Categoría'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <TextField
                label="Nombre"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                fullWidth
              />
              <TextField
                label="Descripción"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsFormOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedCategory ? 'Actualizar' : 'Guardar'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default CategoriesPage;