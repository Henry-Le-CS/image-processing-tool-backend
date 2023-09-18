import { drive } from "../config/drive"
import { FILE_TYPE_QUERY } from "../constants"

export const retrieveFilesInDriveFolder = async (folderId: string, pageSize = 20,  nextPageToken?: string, fileType: "image" | "other" = "image") => {
    const fileResponseData = await drive.files.list({
        corpora: "allDrives",
        q: `'${folderId}' in parents and not name contains '_edited' ` + FILE_TYPE_QUERY[fileType],
        includeItemsFromAllDrives: true,
        supportsAllDrives: true,
        pageToken: nextPageToken, // Search for content on the next page
        pageSize: pageSize
    })

    return fileResponseData
}

export const fileHasValidImageExtension = (fileName: string) => {
    // Match jpeg, jpg, png, or there uppercase variants
    const regexPattern = /\.(jpe?g|png)$/i;
    return regexPattern.test(fileName);
}