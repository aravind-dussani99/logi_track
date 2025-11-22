import React, { useState } from 'react';
import { Typography, Paper, TextField, Button, Grid, Table, TableBody, TableCell, TableHead, TableRow, Box } from '@mui/material';
import { Material } from '../types';

// NOTE: Using Material UI components for rapid implementation of the user-provided design.
// These components are not part of the existing design system but are used here to match the requested layout.
// A future refactor could replace these with native Tailwind components.

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [form, setForm] = useState({ name: '', costPerTon: '', costPerCubicMeter: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.costPerTon || !form.costPerCubicMeter) return;
    setMaterials([...materials, { ...form, id: Date.now() }]);
    setForm({ name: '', costPerTon: '', costPerCubicMeter: '' });
  };

  return (
    <Box sx={{ mt: 0, p: 3, backgroundColor: 'transparent' }} className="dark:text-gray-200">
      <Typography variant="h4" gutterBottom component="h1" className="text-gray-800 dark:text-white">Material Types</Typography>
      <Paper sx={{ p: 2, mb: 3 }} className="bg-white dark:bg-gray-800">
        <form onSubmit={handleAdd}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField label="Material Name" name="name" value={form.name} onChange={handleChange} fullWidth required />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Cost per Ton" name="costPerTon" value={form.costPerTon} onChange={handleChange} type="number" fullWidth required />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField label="Cost per Cubic Meter" name="costPerCubicMeter" value={form.costPerCubicMeter} onChange={handleChange} type="number" fullWidth required />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button type="submit" variant="contained" className="bg-primary hover:bg-primary-dark">Add Material</Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
      <Paper sx={{ p: 2, width: '100%', overflow: 'hidden' }} className="bg-white dark:bg-gray-800">
        <Typography variant="h6" component="h2" gutterBottom className="text-gray-800 dark:text-white">Material List</Typography>
        <Box sx={{ overflowX: 'auto' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell className="dark:text-gray-300">Name</TableCell>
              <TableCell className="dark:text-gray-300">Cost per Ton (₹)</TableCell>
              <TableCell className="dark:text-gray-300">Cost per Cubic Meter (₹)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {materials.map((mat) => (
              <TableRow key={mat.id}>
                <TableCell className="dark:text-gray-200">{mat.name}</TableCell>
                <TableCell className="dark:text-gray-200">{mat.costPerTon}</TableCell>
                <TableCell className="dark:text-gray-200">{mat.costPerCubicMeter}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </Box>
      </Paper>
    </Box>
  );
}
