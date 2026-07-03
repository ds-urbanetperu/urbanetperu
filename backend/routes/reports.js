import express from 'express';
import { verifyToken } from '../middleware/auth.js';
import { ReportService } from '../patterns/facades/ReportService.js';

const router = express.Router();

router.post('/', verifyToken, async (req, res) => {
  if (!req.body.title || !req.body.description || !req.body.location) {
    return res.status(400).json({ message: 'Título, descripción y ubicación son obligatorios' });
  }

  try {
    const report = await ReportService.createReport(req.body, req.user);
    res.status(201).json({ message: 'Reporte creado exitosamente', report });
  } catch (error) {
    if (error.message.includes('obligatori')) {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: 'Error al crear el reporte' });
  }
});

router.get('/user', verifyToken, async (req, res) => {
  try {
    const reports = await ReportService.getReportsByUser(req.user.userId);
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener reportes' });
  }
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const reports = await ReportService.getAllReports(req.query);
    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener reportes' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const report = await ReportService.getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }
    res.json(report);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener el reporte' });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const report = await ReportService.updateReport(req.params.id, req.body);
    if (!report) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }
    res.json({ message: 'Reporte actualizado', report });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar el reporte' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const deleted = await ReportService.deleteReport(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Reporte no encontrado' });
    }
    res.json({ message: 'Reporte eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar el reporte' });
  }
});

export default router;