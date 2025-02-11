function AuthGuard(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({message: "Unauthorized: No token provided"});
    return;
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    res.status(401).json({message: "Unauthorized: Invalid token format"});
    return;
  }

  next();
}

export default AuthGuard;
