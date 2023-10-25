import { Router } from "express";
import { listCamera, searchCameraByAddress, searchCameraById, searchCameraInRadius } from "../controllers";

const router = Router();

router.get("/camera/list", listCamera)

router.get("/camera/search", searchCameraByAddress)
router.get("/camera/search/:id", searchCameraById)

router.get("/camera/filter/:filterType", searchCameraInRadius)

export default router;