/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

// import { onRequest } from "firebase-functions/v2/https";
// import * as functions from "firebase-functions"
// import * as logger from "firebase-functions/logger";
import * as express from "express"
import * as functions from "firebase-functions"
import * as cors from "cors"
import * as bodyParser from "body-parser"
import * as dotenv from "dotenv"
import { cameraRouter, fileRouter } from "./routes";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req: any, res: any) => {
    res.send('Hello World!');
});

app.use('/api', fileRouter)
app.use('/api', cameraRouter)

exports.app = functions.https.onRequest(app);
