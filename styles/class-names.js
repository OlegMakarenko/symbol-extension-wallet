export const classNames = {
    controlWrapper: [
        'border-secondary',
        'data-[hover=true]:border-secondary-600',
        'group-data-[invalid=true]:border-danger'
    ],
    controlLabel: [''],
    button: ['font-button', 'uppercase'],
    popup: ['bg-black'],
    listItemBase: [
        'data-[selected=true]:bg-secondary',
        'data-[selectable=true]:focus:bg-unset',
        'data-[hover=true]:!bg-unset',
        '[&_div_span]:data-[selected=true]:!text-foreground',
    ]
}
