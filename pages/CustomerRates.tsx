import React, { useState } from 'react';
import { Typography, Paper, TextField, Button, Grid, Table, TableBody, TableCell, TableHead, TableRow, Checkbox, IconButton, Box, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import { CustomerRate } from '../types';

// NOTE: Using Material UI components for rapid implementation of the user-provided design.
// These components are not part of the existing design system but are used here to match the requested layout.
// A future refactor could replace these with native Tailwind components.

export default function CustomerMaterialRatesPage() {
  const [rates, setRates] = useState<CustomerRate[]>([]);
  const [form, setForm] = useState({
    customer: '',
    material: '',
    rate: '',
    from: '',
    to: '',
    active: false,
    rejectionPercent: '',
    rejectionRemarks: '',
    locationFrom: '',
    locationTo: '',
  });
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<Partial<CustomerRate>>({});
  const [selected, setSelected] = useState<(number|string)[]>([]);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.customer || !form.material || !form.rate || !form.from) return;
    // Duplicate check
    const duplicate = rates.some(r =>
      r.customer.trim().toLowerCase() === form.customer.trim().toLowerCase() &&
      r.material.trim().toLowerCase() === form.material.trim().toLowerCase() &&
      r.from === form.from &&
      r.to === form.to
    );
    if (duplicate) {
      setError('A rate for this customer, material, and date duration already exists. Please check your info.');
      return;
    }
    setRates([
      ...rates.map(r => ({ ...r, active: form.active ? false : r.active })),
      { ...form, id: Date.now() }
    ]);
    setForm({ customer: '', material: '', rate: '', from: '', to: '', active: false, rejectionPercent: '', rejectionRemarks: '', locationFrom: '', locationTo: '' });
    setOpen(false);
  };

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setEditRow({ ...rates[idx] });
    setError('');
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setEditRow({ ...editRow, [name]: type === 'checkbox' ? checked : value });
  };

  const handleUpdate = (idx: number) => {
    setError('');
    // Duplicate check (ignore current row)
    const duplicate = rates.some((r, i) =>
      i !== idx &&
      r.customer.trim().toLowerCase() === editRow.customer?.trim().toLowerCase() &&
      r.material.trim().toLowerCase() === editRow.material?.trim().toLowerCase() &&
      r.from === editRow.from &&
      r.to === editRow.to
    );
    if (duplicate) {
      setError('A rate for this customer, material, and date duration already exists. Please check your info.');
      return;
    }
    setRates(rates.map((r, i) => i === idx ? { ...(editRow as CustomerRate) } : (editRow.active ? { ...r, active: false } : r)));
    setEditIdx(null);
    setEditRow({});
  };

  const handleCancel = () => {
    setEditIdx(null);
    setEditRow({});
    setError('');
  };

  const handleDelete = (id: number | string) => {
    setRates(rates.filter(r => r.id !== id));
    setSelected(selected.filter(sId => sId !== id));
  };

  const handleSelect = (id: number | string) => {
    setSelected(selected.includes(id) ? selected.filter(i => i !== id) : [...selected, id]);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelected(rates.map(r => r.id));
    } else {
      setSelected([]);
    }
  };

  const handleBulkDelete = () => {
    setRates(rates.filter(r => !selected.includes(r.id)));
    setSelected([]);
  };

  const handleDialogOpen = () => {
    setForm({ customer: '', material: '', rate: '', from: '', to: '', active: false, rejectionPercent: '', rejectionRemarks: '', locationFrom: '', locationTo: '' });
    setError('');
    setOpen(true);
  };
  const handleDialogClose = () => {
    setOpen(false);
    setError('');
  };

  return (
    <Box sx={{ mt: 0, p:3, backgroundColor: 'transparent' }} className="dark:text-gray-200">
      <Typography variant="h4" gutterBottom component="h1" className="text-gray-800 dark:text-white">Customer Material Rates</Typography>
      {rates.length === 0 ? (
        <Paper sx={{ p: 2, mb: 3, textAlign: 'center' }} className="bg-white dark:bg-gray-800">
          <Typography variant="body1" sx={{ mb: 2 }}>There are no customer material rates. Please click <b>Add Customer Rate</b> to add customer details.</Typography>
          <Button variant="contained" onClick={handleDialogOpen} className="bg-primary hover:bg-primary-dark">Add Customer Rate</Button>
        </Paper>
      ) : (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" onClick={handleDialogOpen} className="bg-primary hover:bg-primary-dark">Add Customer Rate</Button>
          </Box>
          <Paper sx={{ p: 2, width: '100%', overflow: 'hidden' }} className="bg-white dark:bg-gray-800">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6" component="h2" className="text-gray-800 dark:text-white">Rates List</Typography>
              <Button variant="outlined" color="error" disabled={selected.length === 0} onClick={handleBulkDelete}>Delete Selected</Button>
            </Box>
            <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox sx={{color: '#9ca3af'}} checked={selected.length === rates.length && rates.length > 0} indeterminate={selected.length > 0 && selected.length < rates.length} onChange={handleSelectAll} />
                  </TableCell>
                  <TableCell className="dark:text-gray-300">Customer</TableCell>
                  <TableCell className="dark:text-gray-300">Material</TableCell>
                  <TableCell className="dark:text-gray-300">Rate (₹/ton)</TableCell>
                  <TableCell className="dark:text-gray-300">Date From</TableCell>
                  <TableCell className="dark:text-gray-300">Date To</TableCell>
                  <TableCell className="dark:text-gray-300">Rejection %</TableCell>
                  <TableCell className="dark:text-gray-300">Rejection Remarks</TableCell>
                  <TableCell className="dark:text-gray-300">Location From</TableCell>
                  <TableCell className="dark:text-gray-300">Location To</TableCell>
                  <TableCell className="dark:text-gray-300">Active</TableCell>
                  <TableCell className="dark:text-gray-300">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rates.map((rate, idx) => (
                  <TableRow key={rate.id} selected={selected.includes(rate.id)}>
                    <TableCell padding="checkbox">
                      <Checkbox sx={{color: '#9ca3af'}} checked={selected.includes(rate.id)} onChange={() => handleSelect(rate.id)} />
                    </TableCell>
                    {editIdx === idx ? (
                      <>
                        <TableCell><TextField name="customer" value={editRow.customer || ''} onChange={handleEditChange} size="small" variant="standard" /></TableCell>
                        <TableCell><TextField name="material" value={editRow.material || ''} onChange={handleEditChange} size="small" variant="standard" /></TableCell>
                        <TableCell><TextField name="rate" value={editRow.rate || ''} onChange={handleEditChange} type="number" size="small" variant="standard" /></TableCell>
                        <TableCell><TextField name="from" value={editRow.from || ''} onChange={handleEditChange} type="date" size="small" InputLabelProps={{ shrink: true }} variant="standard" /></TableCell>
                        <TableCell><TextField name="to" value={editRow.to || ''} onChange={handleEditChange} type="date" size="small" InputLabelProps={{ shrink: true }} variant="standard" /></TableCell>
                        <TableCell><TextField name="rejectionPercent" value={editRow.rejectionPercent || ''} onChange={handleEditChange} type="number" size="small" variant="standard" /></TableCell>
                        <TableCell><TextField name="rejectionRemarks" value={editRow.rejectionRemarks || ''} onChange={handleEditChange} size="small" variant="standard" /></TableCell>
                        <TableCell><TextField name="locationFrom" value={editRow.locationFrom || ''} onChange={handleEditChange} size="small" variant="standard" /></TableCell>
                        <TableCell><TextField name="locationTo" value={editRow.locationTo || ''} onChange={handleEditChange} size="small" variant="standard" /></TableCell>
                        <TableCell><Checkbox name="active" checked={editRow.active || false} onChange={handleEditChange} /></TableCell>
                        <TableCell>
                          <IconButton color="primary" onClick={() => handleUpdate(idx)}><SaveIcon /></IconButton>
                          <IconButton onClick={handleCancel}><CancelIcon /></IconButton>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell className="dark:text-gray-200">{rate.customer}</TableCell>
                        <TableCell className="dark:text-gray-200">{rate.material}</TableCell>
                        <TableCell className="dark:text-gray-200">{rate.rate}</TableCell>
                        <TableCell className="dark:text-gray-200">{rate.from}</TableCell>
                        <TableCell className="dark:text-gray-200">{rate.to}</TableCell>
                        <TableCell className="dark:text-gray-200">{rate.rejectionPercent}</TableCell>
                        <TableCell className="dark:text-gray-200">{rate.rejectionRemarks}</TableCell>
                        <TableCell className="dark:text-gray-200">{rate.locationFrom}</TableCell>
                        <TableCell className="dark:text-gray-200">{rate.locationTo}</TableCell>
                        <TableCell className="dark:text-gray-200">{rate.active ? '✔️' : ''}</TableCell>
                        <TableCell>
                          <IconButton color="primary" onClick={() => handleEdit(idx)}><EditIcon /></IconButton>
                          <IconButton color="error" onClick={() => handleDelete(rate.id)}><DeleteIcon /></IconButton>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </Box>
          </Paper>
        </>
      )}
      <Dialog open={open} onClose={handleDialogClose} maxWidth="xl" fullWidth>
        <DialogTitle className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white">Add Customer Rate</DialogTitle>
        <DialogContent className="bg-white dark:bg-gray-800">
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <form id="customer-info-form" onSubmit={handleAdd}>
            <Grid container spacing={2} sx={{pt: 2}} alignItems="center">
                <Grid item xs={12} sm={6} md={4} lg={2}><TextField label="Customer Name" name="customer" value={form.customer} onChange={handleChange} fullWidth required /></Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}><TextField label="Material Type" name="material" value={form.material} onChange={handleChange} fullWidth required /></Grid>
                <Grid item xs={12} sm={6} md={4} lg={1.5}><TextField label="Rate (₹/ton)" name="rate" value={form.rate} onChange={handleChange} type="number" fullWidth required /></Grid>
                <Grid item xs={12} sm={6} md={4} lg={1.5}><TextField label="Date From" name="from" value={form.from} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} fullWidth required /></Grid>
                <Grid item xs={12} sm={6} md={4} lg={1.5}><TextField label="Date To" name="to" value={form.to} onChange={handleChange} type="date" InputLabelProps={{ shrink: true }} fullWidth /></Grid>
                <Grid item xs={12} sm={6} md={4} lg={1}><TextField label="Rejection %" name="rejectionPercent" value={form.rejectionPercent} onChange={handleChange} type="number" fullWidth /></Grid>
                <Grid item xs={12} sm={6} md={4} lg={2}><TextField label="Rejection Remarks" name="rejectionRemarks" value={form.rejectionRemarks} onChange={handleChange} fullWidth /></Grid>
                <Grid item xs={12} sm={6} md={4} lg={1.5}><TextField label="Location From" name="locationFrom" value={form.locationFrom} onChange={handleChange} fullWidth /></Grid>
                <Grid item xs={12} sm={6} md={4} lg={1.5}><TextField label="Location To" name="locationTo" value={form.locationTo} onChange={handleChange} fullWidth /></Grid>
                <Grid item xs={12} sm={6} md={4} lg={2} sx={{ display: 'flex', alignItems: 'center' }}>
                    <Checkbox name="active" checked={form.active} onChange={handleChange} />
                    <Typography>Active</Typography>
                </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions className="bg-white dark:bg-gray-800">
          <Button onClick={handleDialogClose}>Cancel</Button>
          <Button type="submit" form="customer-info-form" variant="contained" className="bg-primary hover:bg-primary-dark">Add Rate</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
