const express = require('express');
const { addMember } = require('../controllers/boardController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);
router.post('/members', addMember);

module.exports = router;
