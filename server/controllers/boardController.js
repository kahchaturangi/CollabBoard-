const { getModels } = require('../utils/dbProvider');

exports.addMember = async (req, res) => {
  try {
    const { User, Board } = getModels();
    const email = req.body.email?.trim().toLowerCase();
    if (!email) {
      return res.status(400).json({ success: false, message: 'Member email is required' });
    }

    const board = await Board.findOne({ owner: req.user.id });
    if (!board) {
      return res.status(404).json({ success: false, message: 'Board not found' });
    }

    const member = await User.findOne({ email });
    if (!member) {
      return res.status(404).json({ success: false, message: 'No registered user found with that email' });
    }
    if (String(member._id) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: 'You are already the board owner' });
    }

    const alreadyMember = board.members.some((id) => String(id) === String(member._id));
    if (!alreadyMember) board.members.push(member._id);
    await board.save();

    res.status(alreadyMember ? 200 : 201).json({
      success: true,
      message: alreadyMember ? 'Member is already on this board' : 'Member added to board',
      member: { id: member._id, username: member.username, email: member.email },
    });
  } catch (error) {
    console.error('Add member error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};
