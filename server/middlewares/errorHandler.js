export const handleErrors = async (err, req, res, next) => {
  console.error(err);
  return res
    .json({
      message:
        err?.status === 500
          ? "Internal Server Error"
          : err.message || "Unknown error occurred",
      status: err?.status || 500,
    })
    .status(err?.status || 500);
};
