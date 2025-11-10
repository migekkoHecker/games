const chart = new Chart(ctx, {
  type: 'line',
  data: {
    labels: Array(MAX_TICKS).fill(""),
    datasets: Object.entries(stocks).map(([name, s]) => ({
      label: name,
      borderColor: s.color,
      data: buffers[name],
      tension: 0.2
    })) // <-- possibly the parser sees this as ending early
  },
  options: {
    responsive: false,
    maintainAspectRatio: false,
    animation: false,
    scales: {
      y: { beginAtZero: true }
    }
  }
});
