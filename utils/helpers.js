// Format date for display
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Format date for input fields (YYYY-MM-DD)
const formatDateInput = (date) => {
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};

// Truncate text
const truncateText = (text, length = 120) => {
  if (!text) return '';
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// Get category label with emoji
const getCategoryLabel = (category) => {
  const labels = {
    workshop: '🔧 Workshop',
    hackathon: '💻 Hackathon',
    seminar: '🎓 Seminar',
    competition: '🏆 Competition',
    cultural: '🎭 Cultural',
    sports: '⚽ Sports',
    club: '🎪 Club Activity',
    other: '📌 Other'
  };
  return labels[category] || labels.other;
};

module.exports = { formatDate, formatDateInput, truncateText, getCategoryLabel };
