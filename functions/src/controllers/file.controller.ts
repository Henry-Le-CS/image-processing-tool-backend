import { Request, Response } from "express";
import {
  fileHasValidImageExtension,
  retrieveFilesInDriveFolder,
} from "../utils";
import { IEditedFileData } from "./interfaces";
import { drive } from "../config/drive";
import { getNewFileNames } from "../utils/file";

export const retrieveFiles = async (
  req: Request<
    {},
    {},
    {},
    {
      folderId: string;
      nextPageToken?: string; // The next pagination token
      pageSize?: number;
    }
  >,
  res: Response
) => {
  const { folderId, pageSize = 500, nextPageToken } = req.query;

  try {
    const fileResponseData = await retrieveFilesInDriveFolder(
      folderId,
      pageSize,
      nextPageToken
    );

    const files = fileResponseData?.data?.files;
    if (!(files && files.length > 0)) {
      return res
        .status(404)
        .send(`Cannot find any files in the folder with Id: ${folderId}`);
    }

    const filesData = files.reduce(
      (accumulator, currentFile) => {
        const { id, name } = currentFile;

        if (!(id && name)) return accumulator;
        if (!fileHasValidImageExtension(name)) return accumulator;

        return [
          ...accumulator,
          {
            fileId: id,
            fileName: name,
            url: `https://drive.google.com/uc?export=view&id=${id}`, // Only works if the image is shared publicly
          },
        ];
      },
      [] as {
        fileId: string;
        fileName: string;
        url: string;
      }[]
    );

    const newNextPageToken =
      filesData && filesData.length > 0
        ? fileResponseData?.data?.nextPageToken
        : "";
    return res.status(200).send({
      data: filesData,
      nextPageToken: newNextPageToken,
      remainingFiles: files.length,
    });
  } catch (err) {
    return res
      .status(400)
      .send(`Unexpected error occurred, the error is: ${err}`);
  }
};

export const renameFiles = async (
  req: Request<
    {},
    {},
    {
      data: IEditedFileData[];
      sourceFolder: string; // Have to make sure the folders enable editing
      destinationFolder: string;
    }
  >,
  res: Response
) => {
  const { data, sourceFolder, destinationFolder } = req.body;

  const fileRenamingPromises = data.map(async (file) => {
    const { fileId, fileName, trafficCondition } = file;
    const copiedFiles = await drive.files.copy({
      fileId: fileId,
    });

    if (!(copiedFiles && copiedFiles?.data?.id)) return;

    const newFileName = getNewFileNames(fileName, trafficCondition);
    // Copy the file to the destination folder with new name
    await drive.files.update({
      fileId: copiedFiles.data.id,
      addParents: destinationFolder,
      removeParents: sourceFolder,
      requestBody: {
        name: newFileName,
      },
    });

    // Update the original file name to indicate that it has been edited
    await drive.files.update({
      fileId: fileId,
      requestBody: {
        name: "edited_" + fileName,
      },
    });
  });

  const promiseResult = await Promise.allSettled(fileRenamingPromises);

  const unsucessfulPromises = promiseResult.filter(
    (promise) => promise.status === "rejected"
  );
  if (unsucessfulPromises.length == 0) {
    return res.status(200).send("All files have been renamed successfully");
  }

  const failedReasons = unsucessfulPromises.map((promise) => {
    if (promise?.status == "rejected") {
      return promise.reason;
    }
    return "";
  });

  return res
    .status(400)
    .send(
      `Some files have not been renamed successfully, the reasons are: ${failedReasons}`
    );
};
