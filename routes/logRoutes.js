const express = require('express');
const router = express.Router();
const { getProductivityData } = require('../controllers/logController');

router.get('/productivity', getProductivityData);

module.exports = router;