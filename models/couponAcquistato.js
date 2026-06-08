const mongoose = require("mongoose")

const CATEGORIES = ['ScontoPercentuale', 'ScontoInDenaro', 'Omaggio'];

const couponAcquistatoSchema = new mongoose.Schema({
    utenteId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Utente',
        required: true
    },
    couponId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        required: true
    },
    statoUtilizzo: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

module.exports = mongoose.model("CouponAcquistato", couponAcquistatoSchema)