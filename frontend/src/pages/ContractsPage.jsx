import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  Grid,
  FormControl,
  InputLabel,
  Select
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { api } from '../services/api';

const ContractsPage = () => {
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [formData, setFormData] = useState({
    client_id: '',
    contract_number: '',
    description: '',
    start_date: '',
    end_date: '',
    total_value: '',
    status: 'draft'
  });

  const statusOptions = [
    { value: 'draft', label: 'Rascunho', color: 'default' },
    { value: 'active', label: 'Ativo', color: 'success' },
    { value: 'completed', label: 'Concluído', color: 'info' },
    { value: 'cancelled', label: 'Cancelado', color: 'error' }
  ];

  useEffect(() => {
    fetchContracts();
    fetchClients();
  }, []);

  const fetchContracts = async () => {
    try {
      const response = await api.get('/contracts');
      if (response.data.success) {
        setContracts(response.data.data.contracts);
      }
    } catch (error) {
      setError('Erro ao carregar contratos');
      console.error('Erro ao carregar contratos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      if (response.data.success) {
        setClients(response.data.data.clients);
      }
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const handleOpenDialog = (contract = null) => {
    if (contract) {
      setEditingContract(contract);
      setFormData({
        client_id: contract.client_id,
        contract_number: contract.contract_number,
        description: contract.description,
        start_date: contract.start_date?.split('T')[0] || '',
        end_date: contract.end_date?.split('T')[0] || '',
        total_value: contract.total_value,
        status: contract.status
      });
    } else {
      setEditingContract(null);
      setFormData({
        client_id: '',
        contract_number: '',
        description: '',
        start_date: '',
        end_date: '',
        total_value: '',
        status: 'draft'
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingContract(null);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    try {
      setError('');
      
      if (editingContract) {
        const response = await api.put(`/contracts/${editingContract.id}`, formData);
        if (response.data.success) {
          fetchContracts();
          handleCloseDialog();
        }
      } else {
        const response = await api.post('/contracts', formData);
        if (response.data.success) {
          fetchContracts();
          handleCloseDialog();
        }
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao salvar contrato');
    }
  };

  const handleDelete = async (contractId) => {
    if (window.confirm('Tem certeza que deseja excluir este contrato?')) {
      try {
        const response = await api.delete(`/contracts/${contractId}`);
        if (response.data.success) {
          fetchContracts();
        }
      } catch (error) {
        setError('Erro ao excluir contrato', error);
      }
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = statusOptions.find(opt => opt.value === status);
    return (
      <Chip
        label={statusConfig?.label || status}
        color={statusConfig?.color || 'default'}
        size="small"
      />
    );
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Carregando contratos...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Contratos
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Novo Contrato
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Número</TableCell>
              <TableCell>Cliente</TableCell>
              <TableCell>Descrição</TableCell>
              <TableCell>Data Início</TableCell>
              <TableCell>Data Fim</TableCell>
              <TableCell>Valor Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {contracts.map((contract) => (
              <TableRow key={contract.id}>
                <TableCell>{contract.contract_number}</TableCell>
                <TableCell>{contract.client_name}</TableCell>
                <TableCell>{contract.description}</TableCell>
                <TableCell>{formatDate(contract.start_date)}</TableCell>
                <TableCell>{formatDate(contract.end_date)}</TableCell>
                <TableCell>{formatCurrency(contract.total_value)}</TableCell>
                <TableCell>{getStatusChip(contract.status)}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(contract)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(contract.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {contracts.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Nenhum contrato encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para criar/editar contrato */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingContract ? 'Editar Contrato' : 'Novo Contrato'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Cliente</InputLabel>
                <Select
                  name="client_id"
                  value={formData.client_id}
                  onChange={handleInputChange}
                  label="Cliente"
                >
                  {clients.map((client) => (
                    <MenuItem key={client.id} value={client.id}>
                      {client.company_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Número do Contrato"
                name="contract_number"
                value={formData.contract_number}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descrição"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data de Início"
                name="start_date"
                type="date"
                value={formData.start_date}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Data de Fim"
                name="end_date"
                type="date"
                value={formData.end_date}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Valor Total"
                name="total_value"
                type="number"
                value={formData.total_value}
                onChange={handleInputChange}
                inputProps={{ step: "0.01" }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  label="Status"
                >
                  {statusOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingContract ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ContractsPage;

