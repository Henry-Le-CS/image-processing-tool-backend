import * as admin from "firebase-admin";

// TODO: change the .env to GOOGLE_API_CREDENTIALS
const serviceAccount = JSON.parse(process.env.FIRE_STORE_SERVICE_ACCOUNT ?? "");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const fireStoreDB = admin.firestore();

export default fireStoreDB;