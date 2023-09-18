interface ITrafficCondition {
    density: string;
    velocity: string;
    condition: string;
}

export interface IEditedFileData {
    fileId: string;
    fileName: string;
    trafficCondition: ITrafficCondition
}