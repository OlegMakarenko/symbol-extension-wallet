import { TransactionType } from '@/constants';
import { AccountService } from './AccountService';
import { ListenerService } from './ListenerService';
import { makeRequest } from '@/utils/network';
import { signTransaction } from '@/utils/transaction';

export class TransactionService {
    static async fetchAccountTransactions(account, networkProperties, { pageNumber = 1, pageSize = 15, group = 'confirmed', filter = {} }) {
        const baseUrl = `${networkProperties.nodeUrl}/transactions/${group}`;
        const baseSearchCriteria = {
            pageNumber,
            pageSize,
            group,
            order: 'desc',
        };

        if (filter.from) {
            const fromAccount = await AccountService.fetchAccountInfo(networkProperties, filter.from);
            baseSearchCriteria.signerPublicKey = fromAccount.publicKey;
            baseSearchCriteria.recipientAddress = account.address;

        } else if (filter.to) {

            baseSearchCriteria.signerPublicKey = account.publicKey;
            baseSearchCriteria.recipientAddress = filter.to;
        } else {
            baseSearchCriteria.address = account.address;
        }

        if (filter.type) {
            baseSearchCriteria.type = filter.type;
        }

        const params = new URLSearchParams(baseSearchCriteria).toString();
        const transactionPage = await makeRequest(`${baseUrl}?${params}`);
        const transactions = transactionPage.data;

        return transactions;
    }

    static async signAndAnnounce(transaction, networkProperties, privateAccount) {
        return new Promise(async (resolve) => {
            const signedTransaction = await signTransaction(networkProperties, transaction, privateAccount);

            if (transaction.type !== TransactionType.AGGREGATE_BONDED) {
                return resolve(this.announceBatchNode(signedTransaction.payload, networkProperties, false));
            }

            const hashLockTransaction = {
                type: TransactionType.HASH_LOCK,
                signerPublicKey: privateAccount.publicKey,
                lockedAmount: 10,
                fee: 0.1,
                duration: 1000,
                aggregateHash: signedTransaction.hash
            };
            const signedHashLockTransaction = await signTransaction(networkProperties, hashLockTransaction, privateAccount);

            const listener = new ListenerService(networkProperties, privateAccount);
            await listener.open();
            listener.listenTransactions((transaction) => {
                if (transaction.hash === signedHashLockTransaction.hash) {
                    listener.close();
                    return resolve(this.announceBatchNode(signedTransaction.payload, networkProperties, true));
                }
            })

            await this.announceBatchNode(signedHashLockTransaction.payload, networkProperties, false);
        })
    }

    static async announceBatchNode(transactionPayload, networkProperties, isPartial) {
        const nodeUrls = networkProperties.nodeUrls.slice(0, 5);
        const promises = nodeUrls.map((nodeUrl => this.announce(transactionPayload, nodeUrl, isPartial)));

        return Promise.all(promises);
    }

    static async announce(transactionPayload, nodeUrl, isPartial) {
        const endpoint = `${nodeUrl}/transactions${isPartial ? '/partial' : ''}`;
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
