const generateCSV = (registrations) => {
  const headers = ['Name', 'Email', 'Registration Date'];
  const rows = registrations.map(reg => {
    const date = new Date(reg.registeredAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
    return [
      `"${reg.user.username}"`,
      `"${reg.user.email}"`,
      `"${date}"`
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

module.exports = { generateCSV };
