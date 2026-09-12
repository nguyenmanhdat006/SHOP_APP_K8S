export const notFound = (req, res) => {
  res.status(404).json({ message: "Route not found" });
};

export const errorHandler = (error, req, res, next) => {
  if (error.name === "SyntaxError" && error.status === 400 && "body" in error) {
    return res.status(400).json({ message: "Invalid JSON payload" });
  }

  if (!error.statusCode || error.statusCode >= 500) {
    console.error({ requestId: req.requestId, error });
  }
  res.status(error.statusCode || 500).json({
    message: error.message || "Internal server error",
  });
};
