"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlobServiceClient = getBlobServiceClient;
exports.getContainerClient = getContainerClient;
exports.uploadBlob = uploadBlob;
exports.downloadBlob = downloadBlob;
exports.deleteBlob = deleteBlob;
const storage_blob_1 = require("@azure/storage-blob");
let blobServiceClient = null;
function getBlobServiceClient() {
    if (!blobServiceClient) {
        const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
        if (!connectionString) {
            throw new Error('Azure Storage connection string is not configured');
        }
        blobServiceClient = storage_blob_1.BlobServiceClient.fromConnectionString(connectionString);
    }
    return blobServiceClient;
}
async function getContainerClient(containerName) {
    const client = getBlobServiceClient();
    const containerClient = client.getContainerClient(containerName);
    // Create container if it doesn't exist
    await containerClient.createIfNotExists({
        access: 'blob',
    });
    return containerClient;
}
async function uploadBlob(containerName, blobName, content, contentType) {
    const containerClient = await getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.upload(content, content.length, {
        blobHTTPHeaders: {
            blobContentType: contentType || 'application/json',
        },
    });
    return blockBlobClient.url;
}
async function downloadBlob(containerName, blobName) {
    const containerClient = await getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const downloadResponse = await blockBlobClient.download();
    const content = await streamToString(downloadResponse.readableStreamBody);
    return content;
}
async function deleteBlob(containerName, blobName) {
    const containerClient = await getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    await blockBlobClient.delete();
}
async function streamToString(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on('data', (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on('end', () => {
            resolve(Buffer.concat(chunks).toString('utf-8'));
        });
        readableStream.on('error', reject);
    });
}
//# sourceMappingURL=storage.js.map