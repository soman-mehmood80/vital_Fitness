const express = require("express");
const router = express.Router();

const controller = require("../controller/AdminController");
const authMiddleware = require("../Middleware/authMiddleware");
const adminMiddleware = require("../Middleware/adminMiddleware");

// Protect all admin routes
router.use(authMiddleware);
router.use(adminMiddleware); 

router.get("/stats", controller.getPlatformStats);

// Full CRUD for Users
router.get("/users", controller.getAllUsers);
router.post("/users", controller.createUser); // Create
router.put("/users/:id", controller.updateUserRole); // Update (Role, Name, etc)
router.delete("/users/:id", controller.deleteUser); // Delete

module.exports = router;