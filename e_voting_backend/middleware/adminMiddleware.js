import jwt from "jsonwebtoken";

export const adminMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        status: false,
        message: "Admin authentication token is required.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
      }
    );

    // Only admin tokens are allowed here
    if (decoded.type !== "admin") {
      return res.status(403).json({
        status: false,
        message: "Admin access required.",
      });
    }

    req.admin = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      status: false,
      message: "Invalid or expired admin token.",
    });
  }
};