const Comment = require('../models/Comment');
const Event = require('../models/Event');

// @desc    Add comment to event
// @route   POST /events/:eventId/comments
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const eventId = req.params.eventId;

    if (!text || !text.trim()) {
      req.flash('error', 'Comment cannot be empty');
      return res.redirect(`/events/${eventId}`);
    }

    const comment = await Comment.create({
      text: text.trim(),
      author: req.user._id,
      event: eventId
    });

    // Push comment to event
    await Event.findByIdAndUpdate(eventId, {
      $push: { comments: comment._id }
    });

    req.flash('success', 'Comment added!');
    res.redirect(`/events/${eventId}`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to add comment');
    res.redirect(`/events/${req.params.eventId}`);
  }
};

// @desc    Delete comment
// @route   DELETE /comments/:id
const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      req.flash('error', 'Comment not found');
      return res.redirect('/');
    }

    // Check ownership (author or admin)
    if (comment.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      req.flash('error', 'Not authorized to delete this comment');
      return res.redirect(`/events/${comment.event}`);
    }

    const eventId = comment.event;

    // Remove comment from event
    await Event.findByIdAndUpdate(eventId, {
      $pull: { comments: comment._id }
    });

    await Comment.findByIdAndDelete(req.params.id);

    req.flash('success', 'Comment deleted');
    res.redirect(`/events/${eventId}`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to delete comment');
    res.redirect('/');
  }
};

module.exports = { addComment, deleteComment };
