import { makeRequest } from '@/utils/network';

export class TransactionService {
    static async announce(transactionPayload, networkProperties) {
        const endpoint = `${networkProperties.nodeUrl}/transactions`;
        const payload = {
            payload: transactionPayload,
        };
        console.log(payload)

        return makeRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }

    static async announcePartial(transactionPayload, networkProperties) {
        const endpoint = `${networkProperties.nodeUrl}/transactions/partial`;
        const payload = {
            payload: transactionPayload,
        };

        return makeRequest(endpoint, {
            method: 'PUT',
            body: JSON.stringify(payload),
            headers: {
                'Content-Type': 'application/json',
            },
        });
    }
}
