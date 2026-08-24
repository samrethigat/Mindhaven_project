export function notFound(req, res, next) {
  res.status(404).json({ error: `Route not found: ${req.originalUrl}` });
}

export function errorHandler(err, req, res, next) {
  console.error("Error:", err.message);
  if (err.name === "ValidationError") {
    return res.status(400).json({ error: err.message });
  }
  if (err.code === 11000) {
    return res.status(400).json({ error: "Duplicate value entered" });
  }
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || "Server error",
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}),
  });
}
