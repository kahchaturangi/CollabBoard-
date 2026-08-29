const express = require('express');
const { inviteMember, acceptInvite } = require('../controllers/memberController');

const router = express.Router();

router.post('/invite', inviteMember);
router.post('/accept', acceptInvite);

module.exports = router;
