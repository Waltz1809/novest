"use server";

import { auth } from "@/auth";
import { r2 } from "@/lib/r2";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

export async function getPresignedUrl(fileName: string, fileType: string) {
    const session = await auth();

    if (!session || !session.user) {
        return { error: "Unauthorized" };
    }

    const userId = session.user.id;
    const uniqueId = randomUUID();
    const key = `uploads/${userId}/${uniqueId}-${fileName}`;

    try {
        const signedUrl = await getSignedUrl(
            r2,
            new PutObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
                ContentType: fileType,
            }),
            { expiresIn: 60 }
        );

        const fileUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`;

        return { success: true, url: signedUrl, fileUrl };
    } catch (error) {
        console.error("Error generating pre-signed URL:", error);
        return { error: "Failed to generate upload URL" };
    }
}

/**
 * Delete a file from R2 storage
 * @param fileUrl - The public URL of the file to delete (e.g., https://pub-xxx.r2.dev/uploads/userId/file.jpg)
 */
export async function deleteFromR2(fileUrl: string) {
    const session = await auth();

    if (!session || !session.user) {
        return { error: "Unauthorized" };
    }

    try {
        // Extract the key from the public URL
        // Format: https://pub-xxx.r2.dev/uploads/userId/uniqueId-filename.jpg
        const publicDomain = process.env.R2_PUBLIC_DOMAIN;

        if (!fileUrl || !publicDomain || !fileUrl.startsWith(publicDomain)) {
            // Not an R2 file or invalid URL, skip deletion
            return { success: true };
        }

        const key = fileUrl.replace(`${publicDomain}/`, "");

        // Delete the file from R2
        await r2.send(
            new DeleteObjectCommand({
                Bucket: process.env.R2_BUCKET_NAME,
                Key: key,
            })
        );

        return { success: true };
    } catch (error) {
        console.error("Error deleting from R2:", error);
        return { error: "Failed to delete file" };
    }
}
