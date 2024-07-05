import { useEffect, useMemo } from 'react';
import { AccountAvatar } from '@/components/index';
import { $t } from '@/localization';
import { classNames } from '@/styles/class-names';
import { Autocomplete, AutocompleteItem } from '@nextui-org/react';
import { useValidation } from '@/utils/hooks';
import { validateRequired, validateUnresolvedAddress } from '@/utils/validators';
import { observer } from 'mobx-react-lite';
import WalletController from '@/core/WalletController';

export const InputAddress = observer(function InputAddress(props) {
    const { title, value, onChange, onValidityChange } = props;
    const { addressBookWhiteList = [], accounts, networkIdentifier } = WalletController;
    const errorMessage = useValidation(value, [validateRequired(), validateUnresolvedAddress()], $t);

    const networkAccounts = accounts[networkIdentifier];
    const contacts = [...networkAccounts, ...addressBookWhiteList];
    const contactList = useMemo(
        () =>
            contacts?.map((contact) => ({
                ...contact,
                value: contact.address,
            })),
        [contacts]
    );


    useEffect(() => {
        onValidityChange(!errorMessage);
    }, [value, errorMessage]);

    return (
        <Autocomplete
            allowsCustomValue
            label={title}
            inputProps={{
                classNames: {
                    inputWrapper: classNames.controlWrapper,
                    label: classNames.controlLabel
                },
            }}
            variant="faded"
            menuTrigger="manual"
            inputValue={value}
            items={contactList}
            isClearable={false}
            isInvalid={!!errorMessage}
            errorMessage={errorMessage}
            disableSelectorIconRotation
            selectorIcon={<img src="/images/icon-address-book.png" className="w-6 h-6 mr-2" />}
            onInput={(e) => onChange(e.target.value)}
        >
            {(item) => (
                <AutocompleteItem
                    key={item.address}
                    description={item.address}
                    startContent={<AccountAvatar address={item.address} size="sm" />}
                    onClick={() => onChange(item.address)}
                >
                    {item.name}
                </AutocompleteItem>
            )}
        </Autocomplete>
    );
});
