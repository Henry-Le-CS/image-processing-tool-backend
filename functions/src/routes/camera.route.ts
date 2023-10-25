import { Router } from "express";
import { searchCamera } from "../controllers";

const router = Router();

router.get("/camera/search", searchCamera)

export default router;