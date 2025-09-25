import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  MenuItem,
  FormControl,
} from '@mui/material';
import type { Category } from '../../types/Category';
import type { ExpenseFormData } from '../../types/Expense';
import { CategoryService } from '../../services/CategoryService';
import { useNotification } from '../../contexts/NotificationContext';

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (expense: ExpenseFormData) => Promise<void>;
  initialData?: ExpenseFormData;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({
  open,
  onClose,
  onSubmit,
  initialData
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const { showNotification } = useNotification();
  
  const [formData, setFormData] = useState<ExpenseFormData>({
    categoryId: '',
    amount: 0,
    date: new Date(),
    description: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const loadedCategories = await CategoryService.getAll();
        setCategories(loadedCategories);
        
        // Si no hay datos iniciales y hay categorías, seleccionar la primera
        if (!initialData && loadedCategories.length > 0 && formData.categoryId === '') {
          setFormData(prev => ({ ...prev, categoryId: loadedCategories[0].id }));
        }
      } catch (error) {
        showNotification('Error al cargar las categorías', 'error');
      }
    };

    loadCategories();
  }, [formData.categoryId, initialData, showNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      showNotification('El monto debe ser mayor a 0', 'error');
      return;
    }

    if (!formData.categoryId) {
      showNotification('Debe seleccionar una categoría', 'error');
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      showNotification('Error al guardar el gasto', 'error');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialData ? 'Editar Gasto' : 'Nuevo Gasto'}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControl fullWidth>
              <TextField
                select
                label="Categoría"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: String(e.target.value) })}
                required
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </TextField>
            </FormControl>

            <TextField
              label="Monto"
              type="number"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
              required
              inputProps={{ step: '0.01' }}
            />

            <TextField
              label="Fecha"
              type="date"
              value={formData.date.toISOString().split('T')[0]}
              onChange={(e) => setFormData({ ...formData, date: new Date(e.target.value) })}
              fullWidth
              InputLabelProps={{
                shrink: true,
              }}
            />

            <TextField
              label="Descripción"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancelar</Button>
          <Button type="submit" variant="contained" color="primary">
            {initialData ? 'Actualizar' : 'Guardar'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ExpenseForm;