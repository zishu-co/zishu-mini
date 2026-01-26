export interface TdChatActionbarProps {
    actionBar?: {
        type: ArrayConstructor;
        value?: Array<'replay' | 'copy' | 'good' | 'bad' | 'share'>;
    };
    chatId?: {
        type: StringConstructor;
        value?: string;
    };
    comment?: {
        type: StringConstructor;
        value?: string;
    };
    content?: {
        type: StringConstructor;
        value?: string;
    };
    copyMode?: {
        type: StringConstructor;
        value?: 'markdown' | 'text';
    };
    disabled?: {
        type: BooleanConstructor;
        value?: boolean;
    };
    placement?: {
        type: StringConstructor;
        value?: 'start' | 'end' | 'space-around' | 'space-between';
    };
}
