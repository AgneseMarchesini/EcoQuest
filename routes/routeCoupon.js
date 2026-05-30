const express = require('express');
const router = express.Router();
const Coupon = require('../models/coupon.js'); 
const path = require('path');

const { authMiddleware } = require("../utils.js")

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/consult_coupon.html"));
});

// restituisce tutti i coupon
router.get('/api/', authMiddleware, async (req, res) => {
  try {
    const coupons = await Coupon.find()
      .populate('attivita', 'nome') 
      .sort({ createdAt: -1 });
    
    res.status(200).json({ success: true, count: coupons.length, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Errore nel recupero di tutti i coupon' });
  }
});

// restituisce i coupon legati a un'attività -> per la ricerca spaziale
router.get('/api/attivita/:idAttivita', authMiddleware, async (req, res) => {
  try {
    const { idAttivita } = req.params;

    const coupons = await Coupon.find({ attivita: idAttivita })
      .populate('attivita', 'nome');

    res.status(200).json({ success: true, count: coupons.length, data: coupons });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Errore nel recupero dei coupon dell\'attività' });
  }
});


module.exports = router;