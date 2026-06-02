const express = require('express');
const router = express.Router();
const Coupon = require('../models/coupon.js'); 
const path = require('path');
const User = require('../models/utente.js')
const { authMiddleware } = require("../utils.js")

router.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/consult_coupon.html"));
});

// restituisce tutti i coupon
router.get('/api/', authMiddleware, async (req, res) => {
    try {
        const coupons = await Coupon.find()
            .populate('attivitaId', 'nome') 
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

router.post('/api/acquista/:code', authMiddleware, async (req, res) => {
  try {
    const { code } = req.params;
    const userId = req.user.userId;
    if (!code) {
      return res.status(400).json({message: "Codice è null"})
    } 

    const coupon = await Coupon.findOne({codice: code});
    if (!coupon) {
      return res.status(404).json({message: "Coupon non trovato"})
    }

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        currentPoints: { $gte: coupon.costoInPunti }
      },
      {
        $inc: {
          currentPoints: -coupon.costoInPunti
        }
      },
      {
        new: true
      }
    );
    if (!updatedUser) {
      return res.status(400).json({message: "Punti insufficienti"})
    }
      
    return res.status(200).json({message: "Acquisto completato"})
  } catch (e) {
    return res.status(500).json({message: "Errore nell'acquisto"})
  }
})

module.exports = router;