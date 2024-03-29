import { makeRequest } from '@/utils/network';
import { NamespaceService } from './NamespaceService';
import { AccountService } from './AccountService';
import { signTransaction } from '@/utils/secure';
import { TransactionType } from '@/constants';
import { isSymbolAddress } from '@/utils/account';
import { ListenerService } from './ListenerService';

export class TransactionService {
    static async sendTransferTransaction(password, transaction, account, networkProperties) {
        console.log('sendTransfer', transaction)
        const preparedTransaction = {
            type: transaction.type,
            signerPublicKey: account.publicKey,
            mosaics: transaction.mosaics,
            message: transaction.message,
            fee: transaction.fee,
        };
        const isMultisigTransaction = !!transaction.sender;
        const recipient = transaction.recipientAddress || transaction.recipient;

        // Resolve recipient address
        if (isSymbolAddress(recipient)) {
            preparedTransaction.recipientAddress = recipient;
        } else {
            preparedTransaction.recipientAddress = await NamespaceService.namespaceNameToAddress(
                networkProperties,
                recipient.toLowerCase()
            );
        }

        // If message is encrypted, fetch recipient publicKey
        if (transaction.message?.isEncrypted) {
            const recipientAccount = await AccountService.fetchAccountInfo(
                networkProperties,
                preparedTransaction.recipientAddress
            );
            preparedTransaction.recipientPublicKey = recipientAccount.publicKey;
        }

        // Prepare


        // If transaction is multisig, announce Aggregate Bonded
        if (isMultisigTransaction) {
            const senderAccount = await AccountService.fetchAccountInfo(networkProperties, transaction.sender);
            preparedTransaction.signerPublicKey = senderAccount.publicKey;

            const aggregateTransaction = {
                type: TransactionType.AGGREGATE_BONDED,
                signerPublicKey: account.publicKey,
                fee: transaction.fee,
                innerTransactions: [preparedTransaction]
            }

            return this.signAndAnnounce(password, aggregateTransaction, networkProperties, account);
        }

        // Else, announce Transfer
        return this.signAndAnnounce(password, preparedTransaction, networkProperties, account);
    }

    static async signAndAnnounce(password, transaction, networkProperties, currentAccount) {
        return new Promise(async (resolve) => {
            const signedTransaction = await signTransaction(password, networkProperties, transaction, currentAccount);

            if (transaction.type !== TransactionType.AGGREGATE_BONDED) {
                resolve(this.announce(signedTransaction.payload, networkProperties, false));
            }

            const hashLockTransaction = {
                type: TransactionType.HASH_LOCK,
                signerPublicKey: currentAccount.publicKey,
                lockedAmount: 10,
                fee: 0.1,
                duration: 1000,
                aggregateHash: signedTransaction.hash
            };
            const signedHashLockTransaction = await signTransaction(password, networkProperties, hashLockTransaction, currentAccount);

            const listener = new ListenerService(networkProperties, currentAccount);
            await listener.open();
            listener.listenTransactions((transaction) => {
                if (transaction.hash === signedHashLockTransaction.hash) {
                    resolve(this.announce(signedTransaction.payload, networkProperties, true));
                    listener.close();
                }
            })

            await this.announce(signedHashLockTransaction.payload, networkProperties, false);
        })
    }

    static async announce(transactionPayload, networkProperties, isPartial) {
        const endpoint = `${networkProperties.nodeUrl}/transactions${isPartial ? '/partial' : ''}`;
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
