const { getModels } = require('../utils/dbProvider');
const { sendInvitationEmail } = require('../utils/emailService');

// @desc    Invite a new team member via Email
// @route   POST /api/members/invite
// @access  Private / Optional Auth
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

    const clientOrigin = process.env.CLIENT_ORIGIN || 'http://localhost:3000';
    const inviteLink = `${clientOrigin}/register?email=${encodeURIComponent(emailTrimmed)}&role=${encodeURIComponent(assignedRole)}`;

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

    res.status(200).json({
      success: true,
      message: `Invitation email sent to ${emailTrimmed}`,
      emailResult,
      member: {
        id: `mem-${Date.now()}`,
        name: recipientName,
        email: emailTrimmed,
        role: assignedRole,
        status: 'pending',
        online: false,
        invitedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Invite member error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
