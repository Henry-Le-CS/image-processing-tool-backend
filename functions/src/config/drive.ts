import { google } from "googleapis";
import * as dotenv from "dotenv";

dotenv.config();

const credentials = JSON.parse(process.env.GOOGLE_DRIVE_API_CREDENTIALS || "")

const auth = new google.auth.GoogleAuth({
    credentials: credentials as any,
    scopes: ['https://www.googleapis.com/auth/drive'], // Specify the necessary scope(s)
});

const drive = google.drive({
    version: "v3",
    auth: auth,
});

export { drive }