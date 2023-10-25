import { Request, Response } from "express";
import fireStoreDB from "../config/firestore";
import { CAMERA_COLLECTION } from "../constants/query";
import { CameraDetail } from "./interfaces/camera";
import { getDistanceFromLatLonInKm } from "../utils/map";
const Fuse = require('fuse.js')

// camera/list
export const listCamera = async (
    req: Request<
        {},
        {},
        {},
        {
            pageSize: number,
            currentPage: number, // start at 1
        }
    >,
    res: Response<
        {
            cameraList: Array<CameraDetail>,
            hasMore: boolean,
        } | string
    >) => {
    try {
        /**
         * Disclaimer: This is not the best way to do pagination in Firestore
         * It requires to fetch the used data twice, which is not ideal
         * https://www.youtube.com/watch?v=poqTHxtDXwU&t=551s (see 8:42)
         */
        const pageSize = Number(req.query.pageSize) || 20;
        const currentPage = Number(req.query.currentPage) || 1;

        const cameraCollection = fireStoreDB.collection(CAMERA_COLLECTION);
        let query = cameraCollection.orderBy('camera_id');

        // Check if there's a specific starting point for pagination
        if (currentPage > 1) {
            const lastDoc = await query
                .limit((currentPage - 1) * pageSize)
                .get()
                .then((snapshot) => snapshot.docs[snapshot.docs.length - 1]);
            query = query.startAfter(lastDoc);
        }

        const snapshot = await query.limit(pageSize + 1).get(); // Fetch one extra document

        const cameras = snapshot.docs.slice(0, pageSize).map(doc => doc.data());
        const hasMore = snapshot.docs.length > pageSize;

        return res.status(200).send({
            cameraList: cameras as CameraDetail[],
            hasMore,
        });
    }
    catch (err) {
        return res.status(400).send(`Unexpected error occurred, the error is: ${err}`);
    }
}

// camera/search?address=address
export const searchCameraByAddress = async (
    req: Request<
        {},
        {},
        {},
        {
            address: string;
        }
    >,
    res: Response<{
        options: Array<any>
    } | string
    >
) => {
    // TODO: If the address is enter => search full-text
    try {
        const { address } = req.query;
        if (!address) {
            return res.status(400).send("Missing address");
        }

        const cameraCollection = fireStoreDB.collection(CAMERA_COLLECTION);
        const snapshot = await cameraCollection.get();
        const cameras = snapshot.docs.map(doc => doc.data());

        const fuse = new Fuse(cameras, {
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

// camera/search/:id
export const searchCameraById = async (
    req: Request,
    res: Response<{
        cameraDetail: CameraDetail
    } | string>
) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).send("Missing camera id");
        }

        const cameraCollection = fireStoreDB.collection(CAMERA_COLLECTION);
        const snapshot = await cameraCollection.where('camera_id', '==', id).get();

        if (snapshot.empty) {
            return res.status(400).send("Camera not found");
        }

        const cameras = snapshot.docs.map(doc => doc.data());
        return res.status(200).send({
            cameraDetail: cameras[0] as CameraDetail
        });
    }
    catch (err) {
        return res.status(400).send(`Unexpected error occurred, the error is: ${err}`);
    }
}

export const searchCameraInRadius = async (
    req: Request<
        {
            filterType: string,
        },
        {},
        {},
        {
            latitude: number,
            longitude: number,
            radius: number, // in km
        }
    >,
    res: Response,
) => {
    const filterType = req.params.filterType;
    switch (filterType) {
        case "circle":
            const latitude = Number(req.query.latitude);
            const longitude = Number(req.query.longitude);
            const radius = Number(req.query.radius);

            if (!(latitude && longitude && radius))
                return res.status(400).send("Missing latitude, longitude or radius")

            const camerasWithApproriateDistance = await getCamerasWithinRadius(latitude, longitude, radius);

            return res.status(200).send({
                availableCameras: camerasWithApproriateDistance
            })
        // TODO: add case rectangle
        default:
            return res.status(400).send("Invalid filter type");
    }
}

const getCamerasWithinRadius = async (latitude: number, longitude: number, radius: number) => {
    const cameraCollection = fireStoreDB.collection(CAMERA_COLLECTION);
    const snapshot = await cameraCollection.get();
    const cameras = snapshot.docs.map(doc => doc.data());

    // Calculate distance between each camera and the given location
    const camerasWithApproriateDistance =
        cameras
            // get cameras with appropriate distance
            .map(camera => {
                const cameraLatitude = Number(camera.latitude);
                const cameraLongitude = Number(camera.longitude);

                if (!(cameraLatitude && cameraLongitude))
                    return;

                const distance = getDistanceFromLatLonInKm(latitude, longitude, cameraLatitude, cameraLongitude);
                // Does not belong to the given radius
                if (!(distance <= radius))
                    return;

                return {
                    ...camera,
                    distance,
                }
            })
            .filter(camera => camera !== undefined)

    return camerasWithApproriateDistance;
}