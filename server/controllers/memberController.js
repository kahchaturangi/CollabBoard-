const jwt = require('jsonwebtoken');
const { getModels } = require('../utils/dbProvider');
const { sendInvitationEmail } = require('../utils/emailService');

// In-memory pending invitations store for quick validation & lookup
const pendingInvitations = new Map();

// @desc    Invite a new team member via Email
// @route   POST /api/members/invite
// @access  Public / Protected
exports.inviteMember = async (req, res) => {
  try {
    const { email, name, role, boardId } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: 'Recipient email is required' });
    }

    const emailTrimmed = email.trim().toLowerCase();
    const recipientName = name?.trim() || emailTrimmed.split('@')[0];
    const assignedRole = role || 'Member';

    const inviterName = req.user?.username || 'Team Lead';
    const inviterEmail = req.user?.email || 'admin@collabboard.io';

    // Generate secure invite token valid for 7 days
    const jwtSecret = process.env.JWT_SECRET || 'yoursecretkey123';
    const inviteToken = jwt.sign(
      { email: emailTrimmed, name: recipientName, role: assignedRole },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Save in memory cache for instant lookup
    pendingInvitations.set(emailTrimmed, {
      email: emailTrimmed,
      name: recipientName,
      role: assignedRole,
      token: inviteToken,
      status: 'pending',
      invitedAt: new Date().toISOString(),
    });

    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
    const inviteLink = `${clientOrigin}/accept-invite?token=${encodeURIComponent(inviteToken)}&email=${encodeURIComponent(emailTrimmed)}`;

    // Dispatch the invitation email
    const emailResult = await sendInvitationEmail({
      toEmail: emailTrimmed,
      recipientName,
      inviterName,
      inviterEmail,
      role: assignedRole,
      boardName: 'CollabBoard Workspace',
      inviteLink,
    });

    const newMember = {
      id: `mem-${Date.now()}`,
      name: recipientName,
      email: emailTrimmed,
      role: assignedRole,
      status: 'pending',
      online: false,
      invitedAt: new Date().toISOString(),
      inviteToken,
    };

    // Emit Socket.io event so all connected clients (e.g. board owner) see the new pending member live
    const io = req.app.get('io');
    if (io) {
      io.emit('member_invited', newMember);
    }

    res.status(200).json({
      success: true,
      message: `Invitation email sent to ${emailTrimmed}`,
      emailResult,
      member: newMember,
    });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Accept an invitation (from email link or browser)
// @route   POST /api/members/accept
// @access  Public
exports.acceptInvite = async (req, res) => {
  try {
    const { token, email } = req.body;

    let emailToAccept = email ? email.trim().toLowerCase() : null;
    let nameToAccept = emailToAccept ? emailToAccept.split('@')[0] : 'Team Member';
    let roleToAccept = 'Member';

    // Verify JWT token if passed
    if (token) {
      try {
        const jwtSecret = process.env.JWT_SECRET || 'yoursecretkey123';
        const decoded = jwt.verify(token, jwtSecret);
        if (decoded.email) emailToAccept = decoded.email.toLowerCase();
        if (decoded.name) nameToAccept = decoded.name;
        if (decoded.role) roleToAccept = decoded.role;
      } catch (err) {
        console.warn('JWT verification fallback for invite token:', err.message);
      }
    }

    if (!emailToAccept) {
      return res.status(400).json({ success: false, message: 'Valid token or email is required' });
    }

    // Check if recorded in memory
    const existing = pendingInvitations.get(emailToAccept);
    if (existing) {
      existing.status = 'active';
      pendingInvitations.set(emailToAccept, existing);
      if (existing.name) nameToAccept = existing.name;
      if (existing.role) roleToAccept = existing.role;
    }

    const acceptedMember = {
      email: emailToAccept,
      name: nameToAccept,
      role: roleToAccept,
      status: 'active',
      online: true,
      acceptedAt: new Date().toISOString(),
    };

    // Emit socket event to notify ALL connected clients in real-time!
    const io = req.app.get('io');
    if (io) {
      io.emit('member_accepted', acceptedMember);
      io.emit('member:accepted', acceptedMember);
    }

    console.log(`🎉 Member invitation accepted by ${nameToAccept} (${emailToAccept})`);

    res.status(200).json({
      success: true,
      message: `Congratulations ${nameToAccept}! You have joined CollabBoard.`,
      member: acceptedMember,
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
