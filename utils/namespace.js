import { generateNamespaceId } from 'symbol-sdk/src/symbol/idGenerator.js';
import { hexToUint8, uint8ToHex } from 'symbol-sdk/src/utils/converter';

export const namespaceIdFromName = (namespaceName) => {
    return generateNamespaceId(namespaceName).toString(16);
}

export const namespaceIdFromRaw = (rawNamespaceId) => {
    const relevantPart = rawNamespaceId.substr(2, 16);
    const encodedNamespaceId = uint8ToHex(hexToUint8(relevantPart).reverse());

    return encodedNamespaceId;
};
