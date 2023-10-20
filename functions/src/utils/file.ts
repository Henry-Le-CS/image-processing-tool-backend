import { drive } from "../config/drive";
import { FILE_TYPE_QUERY } from "../constants";

export const retrieveFilesInDriveFolder = async (
  folderId: string,
  pageSize = 500,
  nextPageToken?: string,
  fileType: "image" | "other" = "image"
) => {
  const fileResponseData = await drive.files.list({
    corpora: "allDrives",
    q:
      `'${folderId}' in parents and not name contains 'edited_' ` +
      FILE_TYPE_QUERY[fileType],
    includeItemsFromAllDrives: true,
    supportsAllDrives: true,
    pageToken: nextPageToken, // Search for content on the next page
    pageSize: pageSize,
  });

  // * This is the old code segment - getting exact number of imgs we need
  // const fileResponseData = await drive.files.list({
  //     corpora: "allDrives",
  //     q: `'${folderId}' in parents and not name contains 'edited_' ` + FILE_TYPE_QUERY[fileType],
  //     includeItemsFromAllDrives: true,
  //     supportsAllDrives: true,
  //     pageToken: nextPageToken, // Search for content on the next page
  //     pageSize: pageSize
  // })

  return fileResponseData;
};

export const fileHasValidImageExtension = (fileName: string) => {
  // Match jpeg, jpg, png, or there uppercase variants
  const regexPattern = /\.(jpe?g|png)$/i;
  return regexPattern.test(fileName);
};

export const getNewFileNames = (
  fileName: string,
  trafficCondition: {
    condition: string;
    density: string;
    velocity: string;
  }
) => {
  const { condition, density, velocity } = trafficCondition;

  if (!(condition && density && velocity)) {
    return fileName;
  }

  const [originalName, extension] = fileName.split(".");
  const newFileName = `${originalName}_${condition}_${density}_${velocity}.${extension}`;

  return newFileName;
};
