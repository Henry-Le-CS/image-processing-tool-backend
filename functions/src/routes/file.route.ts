import { Router } from "express";
import { renameFiles, retrieveFiles } from "../controllers";

const router = Router();

router.get('/files', retrieveFiles)
router.patch('/files/rename', renameFiles)

export default router