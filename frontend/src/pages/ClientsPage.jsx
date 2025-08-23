import React, { useState, useEffect } from "react";
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
  IconButton,
  Alert,
  Grid,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as BusinessIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import { api } from "../services/api";

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    zip_code: "",
    cnpj: "",
    notes: "",
  });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.getClients({ limit: 20, offset: 0 });
      console.log("RESPOSTA: ", response);
      if (response.success) {
        setClients(response.data.clients);
        console.log("CLIENTES: ", response.data.clients);
      }
    } catch (error) {
      setError("Erro ao carregar clientes");
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (client = null) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        company_name: client.company_name || "",
        contact_name: client.contact_name || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        city: client.city || "",
        state: client.state || "",
        zip_code: client.zip_code || "",
        cnpj: client.cnpj || "",
        notes: client.notes || "",
      });
    } else {
      setEditingClient(null);
      setFormData({
        company_name: "",
        contact_name: "",
        email: "",
        phone: "",
        address: "",
        city: "",
        state: "",
        zip_code: "",
        cnpj: "",
        notes: "",
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingClient(null);
    setError("");
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async () => {
    console.log("Form data before submit:", formData);
    try {
      setError("");

      const submitData = {
        company_name: formData.company_name.trim(),
        contact_name: formData.contact_name,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        city: formData.city.city.trim(),
        state: formData.state.state.trim(),
        zip_code: formData.zip_code.zip_code.trim(),
        cnpj: formData.cnpj.cnpj.trim(),
        notes: formData.notes.notes.trim(),
      };
      let response;
      if (editingClient) {
        response = await api.updateClient(editingClient.id, submitData);
        if (response.success) {
          fetchClients();
          handleCloseDialog();
        }
      } else {
        response = await api.createClient(submitData);

        if (response.success) {
          fetchClients();
          handleCloseDialog();
        }
      }
    } catch (error) {
      setError(
        error.response?.data?.message || "Erro de Submit ao salvar cliente"
      );
    }
  };

  const handleDelete = async (clientId) => {
    if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
      try {
        const response = await api.deleteClient(clientId);
        if (response.data.success) {
          fetchClients();
        }
      } catch (error) {
        setError("Erro ao excluir cliente", error);
      }
    }
  };

  const formatPhone = (phone) => {
    if (!phone) return "-";
    // Formato básico para telefone brasileiro
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(
        7
      )}`;
    }
    return phone;
  };

  const formatCNPJ = (cnpj) => {
    if (!cnpj) return "-";
    const cleaned = cnpj.replace(/\D/g, "");
    if (cleaned.length === 14) {
      return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(
        5,
        8
      )}/${cleaned.slice(8, 12)}-${cleaned.slice(12)}`;
    }
    return cnpj;
  };

  if (loading) {
    return (
      <Box p={3}>
        <Typography>Carregando clientes...</Typography>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          Clientes
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Novo Cliente
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
              <TableCell>Empresa</TableCell>
              <TableCell>Contato</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Telefone</TableCell>
              <TableCell>Cidade</TableCell>
              <TableCell>CNPJ</TableCell>
              <TableCell>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <BusinessIcon sx={{ mr: 1, color: "primary.main" }} />
                    {client.company_name}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box display="flex" alignItems="center">
                    <PersonIcon sx={{ mr: 1, color: "text.secondary" }} />
                    {client.contact_name || "-"}
                  </Box>
                </TableCell>
                <TableCell>{client.email || "-"}</TableCell>
                <TableCell>{formatPhone(client.phone)}</TableCell>
                <TableCell>{client.city || "-"}</TableCell>
                <TableCell>{formatCNPJ(client.cnpj)}</TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(client)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDelete(client.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {clients.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Nenhum cliente encontrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog para criar/editar cliente */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingClient ? "Editar Cliente" : "Novo Cliente"}
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
                label="Nome da Empresa *"
                name="company_name"
                value={formData.company_name}
                onChange={handleInputChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nome do Contato"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Telefone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Endereço"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Cidade"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Estado"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="CEP"
                name="zip_code"
                value={formData.zip_code}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="CNPJ"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleInputChange}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Observações"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingClient ? "Atualizar" : "Criar"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClientsPage;
