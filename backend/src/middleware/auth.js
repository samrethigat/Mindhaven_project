import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
    if (!token) {
      return res.status(401).json({ error: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("+password");
    if (!user || !user.isActive || user.isDeleted) {
      return res.status(401).json({ error: "Account not active or deleted" });
    }

    req.user = user;
    req.userId = user._id.toString();
    req.role = user.role;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Not authorized, token failed" });
  }
}

export function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(403).json({ error: "Unauthorized Access" });
    }
    const userRole = req.user.role === "patient" ? "candidate" : req.user.role;
    const normalizedRoles = roles.map((r) => (r === "patient" ? "candidate" : r));

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({ error: "Unauthorized Access" });
    }
    next();
  };
}
