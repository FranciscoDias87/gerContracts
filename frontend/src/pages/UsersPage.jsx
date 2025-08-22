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
  Select,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AdminPanelSettings as AdminIcon,
  ManageAccounts as ManagerIcon,
  RecordVoiceOver as LocutorIcon
} from '@mui/icons-material';
import { api } from '../services/api';
import useAuth from '../contexts/useAuth';

const UsersPage = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'locutor',
    is_active: true
  });

  const roleOptions = [
    { value: 'admin', label: 'Administrador', icon: AdminIcon, color: 'error' },
    { value: 'gerente', label: 'Gerente', icon: ManagerIcon, color: 'warning' },
    { value: 'locutor', label: 'Locutor', icon: LocutorIcon, color: 'info' }
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers({limit: 20, offset: 0});
      if (response.data.success) {
        setUsers(response.data.data.users);
      }
    } catch (error) {
      setError('Erro ao carregar usuários');
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (userToEdit = null) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        username: userToEdit.username || '',
        email: userToEdit.email || '',
        password: '', // Não preencher senha ao editar
        full_name: userToEdit.full_name || '',
        role: userToEdit.role || 'locutor',
        is_active: userToEdit.is_active !== undefined ? userToEdit.is_active : true
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'locutor',
        is_active: true
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    try {
      setError('');
      if (!formData.username || !formData.email || !formData.full_name) {
        setError('Preencha todos os campos obrigatórios');
        return;
      }
      if (!editingUser && !formData.password) {
        setError('Senha é obrigatória para novos usuários');
        return;
      }
      const submitData = { ...formData };
      if (editingUser && !formData.password) {
        delete submitData.password;
      }
      let response;
      if (editingUser) {
        response = await api.updateUser(editingUser.id, submitData);
      } else {
        response = await api.createUser(submitData);
      }
      if (response.data.success) {
        fetchUsers();
        handleCloseDialog();
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Erro ao salvar usuário');
    }
  };

  const handleDelete = async (userId) => {
    if (userId === user.id) {
      setError('Você não pode excluir seu próprio usuário');
      return;
    }
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        const response = await api.deleteUser(userId);
        if (response.data.success) {
          fetchUsers();
        }
      } catch (error) {
        setError('Erro ao excluir usuário', error);
      }
    }
  };

  const getRoleChip = (role) => {
    const roleConfig = roleOptions.find(opt => opt.value === role);
    const IconComponent = roleConfig?.icon || LocutorIcon;
    
    return (
      <Chip
        icon={<IconComponent />}
        label={roleConfig?.label || role}
        color={roleConfig?.color || 'default'}
        size="small"
      />
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Verificar se o usuário atual tem permissão para gerenciar usuários
  const canManageUsers = user?.role === 'admin';

  if (!canManageUsers) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          Você não tem permissão para acessar esta página.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Carregando usuários...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Usuários
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Novo Usuário
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
              <TableCell>Nome de Usuário</TableCell>
              <TableCell>Nome Completo</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Perfil</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Criado em</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((userItem) => (
              <TableRow key={userItem.id}>
                <TableCell>{userItem.username}</TableCell>
                <TableCell>{userItem.full_name}</TableCell>
                <TableCell>{userItem.email}</TableCell>
                <TableCell>{getRoleChip(userItem.role)}</TableCell>
                <TableCell>
                  <Chip
                    label={userItem.is_active ? 'Ativo' : 'Inativo'}
                    color={userItem.is_active ? 'success' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>{formatDate(userItem.created_at)}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(userItem)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  {userItem.id !== user.id && (
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(userItem.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {users.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nenhum usuário encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para criar/editar usuário */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome de Usuário *"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                required
                disabled={!!editingUser} // Não permitir editar username
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome Completo *"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email *"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label={editingUser ? "Nova Senha (deixe vazio para manter)" : "Senha *"}
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!editingUser}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Perfil *</InputLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  label="Perfil *"
                >
                  {roleOptions.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      <Box display="flex" alignItems="center">
                        <option.icon sx={{ mr: 1 }} />
                        {option.label}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.is_active}
                    onChange={handleInputChange}
                    name="is_active"
                  />
                }
                label="Usuário Ativo"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? 'Atualizar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UsersPage;

