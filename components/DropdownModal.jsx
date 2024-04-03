import { classNames } from '@/styles/class-names';
import { Listbox, ListboxItem, Modal, ModalBody, ModalContent, ModalHeader } from '@nextui-org/react';

export const DropdownModal = (props) => {
    const { title, value, list, renderItem, onChange, isOpen, onClose } = props;
    const handleChange = (setOfValues) => {
        const value = [...setOfValues.values()][0]
        onChange(value);
        onClose();
    };
console.log({isOpen})
    return (
        <Modal shouldBlockScroll placement="center" className="bg-main" radius="lg" isOpen={isOpen} onOpenChange={onClose}>
            <ModalContent>
                <ModalHeader>
                    <h2>{title}</h2>
                </ModalHeader>
                <ModalBody>
                    <Listbox
                        items={list}
                        variant="faded"
                        selectionMode="single"
                        selectedKeys={[value]}
                        itemClasses={{
                            base: classNames.listItemBase,
                        }}
                        onSelectionChange={handleChange}
                    >
                        {(item, index) => (renderItem
                            ? renderItem(item, index)
                            : (
                            <ListboxItem key={item.value} textValue={item.label}>
                                <p>{item.label}</p>
                            </ListboxItem>
                        ))}
                    </Listbox>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};
