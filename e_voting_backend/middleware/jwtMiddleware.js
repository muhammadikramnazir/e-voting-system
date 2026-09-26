import jwt from "jsonwebtoken";

export const jwtMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        status: false,
        message: "Authentication token is required.",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
      {
        algorithms: ["HS256"],
      }
    );

    // Only normal user/member tokens are allowed here
    if (decoded.type !== "user") {
      return res.status(403).json({
        status: false,
        message: "User access required.",
      });
    }

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      status: false,
      message: "Invalid or expired authentication token.",
    });
  }
};