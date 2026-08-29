const express = require('express');
const { inviteMember } = require('../controllers/memberController');

const router = express.Router();

router.post('/invite', inviteMember);

module.exports = router;
