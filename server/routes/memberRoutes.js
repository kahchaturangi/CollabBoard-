const express = require('express');
const { inviteMember, acceptInvite, getMembers } = require('../controllers/memberController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, getMembers);
router.post('/invite', inviteMember);
router.post('/accept', acceptInvite);

module.exports = router;
