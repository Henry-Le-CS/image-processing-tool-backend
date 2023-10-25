import { Request, Response } from "express";
import fireStoreDB from "../config/firestore";
import { CAMERA_COLLECTION } from "../constants/query";
const Fuse = require('fuse.js')

export const searchCamera = async (
    req: Request<
        {},
        {},
        {},
        {
            address: string;
        }
    >, res: Response) => {
    // TODO: If the address is enter => search full-text
    try {
        const { address } = req.query;
        if (!address) {
            return res.status(400).send("Missing address");
        }

        const cameraCollection = fireStoreDB.collection(CAMERA_COLLECTION);
        const snapshot = await cameraCollection.get();
        const documents = snapshot.docs.map(doc => doc.data());

        const fuse = new Fuse(documents, {
            keys: ['address']
        })

        const result = fuse.search(address);

        return res.status(200).send({
            options: result
        });
    }
    catch (err) {
        return res.status(400).send(`Unexpected error occurred, the error is: ${err}`);
    }
}