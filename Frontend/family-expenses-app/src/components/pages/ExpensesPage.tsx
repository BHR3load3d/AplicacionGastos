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
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import type { Expense } from '../../types/Expense';
import { ExpenseService } from '../../services/ExpenseService';
import { CategoryService } from '../../services/CategoryService';
import { useNotification } from '../../contexts/NotificationContext';
import ExpenseForm from '../expenses/ExpenseForm';
import type { Category } from '../../types/Category';

const ExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Record<string, Category>>({});
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const { showNotification } = useNotification();

  const loadExpenses = async () => {
    try {
      const loadedExpenses = await ExpenseService.getAll();
      setExpenses(loadedExpenses);
    } catch (error) {
      showNotification('Error al cargar los gastos', 'error');
    }
  };

  const loadCategories = async () => {
    try {
      const loadedCategories = await CategoryService.getAll();
      const categoriesMap = loadedCategories.reduce((acc, category) => {
        acc[category.id] = category;
        return acc;
      }, {} as Record<string, Category>);
      setCategories(categoriesMap);
    } catch (error) {
      showNotification('Error al cargar las categorías', 'error');
    }
  };

  useEffect(() => {
    loadExpenses();
    loadCategories();
  }, []);

  const handleAddExpense = () => {
    setSelectedExpense(null);
    setIsFormOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsFormOpen(true);
  };

  const handleDeleteExpense = async (expense: Expense) => {
    if (!window.confirm('¿Está seguro de eliminar este gasto?')) {
      return;
    }

    try {
      await ExpenseService.delete(expense.id);
      showNotification('Gasto eliminado correctamente', 'success');
      loadExpenses();
    } catch (error) {
      showNotification('Error al eliminar el gasto', 'error');
    }
  };

  const handleSubmit = async (expenseData: Omit<Expense, 'id'>) => {
    try {
      if (selectedExpense) {
        await ExpenseService.update(selectedExpense.id, expenseData);
        showNotification('Gasto actualizado correctamente', 'success');
      } else {
        await ExpenseService.add(expenseData);
        showNotification('Gasto agregado correctamente', 'success');
      }
      loadExpenses();
      setIsFormOpen(false);
    } catch (error) {
      showNotification('Error al guardar el gasto', 'error');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };

  const formatAmount = (amount: number) => {
    return amount.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS'
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gastos</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddExpense}
        >
          Nuevo Gasto
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell align="right">Monto</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {expenses.map((expense) => (
              <TableRow key={expense.id}>
                <TableCell>{formatDate(expense.date)}</TableCell>
                <TableCell>{categories[expense.categoryId]?.name || 'N/A'}</TableCell>
                <TableCell>{expense.description}</TableCell>
                <TableCell align="right">{formatAmount(expense.amount)}</TableCell>
                <TableCell align="center">
                  <IconButton
                    color="primary"
                    onClick={() => handleEditExpense(expense)}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDeleteExpense(expense)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {expenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No hay gastos registrados
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <ExpenseForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleSubmit}
        initialData={selectedExpense || undefined}
      />
    </Box>
  );
};

export default ExpensesPage;