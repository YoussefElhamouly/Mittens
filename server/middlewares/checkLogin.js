const checkLogin = async (req, res, next) => {
  try {
    if (!req.session || !req.session.user_id) {
      return res.status(401).json({ error: "Unauthorized: No active session" });
    }
    next();
  } catch (error) {
    next(error);
  }
};

export { checkLogin };
