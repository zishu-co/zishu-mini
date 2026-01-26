/// <reference types="miniprogram-api-typings" />
/// <reference types="miniprogram-api-typings" />
import { SuperComponent } from '../common/src/index';
export default class Dialog extends SuperComponent {
    behaviors: WechatMiniprogram.Behavior.BehaviorIdentifier<{
        distanceTop: number;
    }, {
        usingCustomNavbar: {
            type: BooleanConstructor;
            value: false;
        };
        customNavbarHeight: {
            type: NumberConstructor;
            value: number;
        };
    }, {
        calculateCustomNavbarDistanceTop(): void;
    }, WechatMiniprogram.Component.BehaviorOption>[];
    options: {
        multipleSlots: boolean;
    };
    externalClasses: string[];
    properties: import("./type").TdDialogProps;
    data: {
        prefix: string;
        classPrefix: string;
        buttonVariant: string;
    };
    observers: {
        'confirmBtn, cancelBtn'(confirm: any, cancel: any): void;
    };
    methods: {
        onTplButtonTap(e: any): void;
        onConfirm(): void;
        onCancel(): void;
        onClose(): void;
        close(): void;
        overlayClick(): void;
        onActionTap(index: number): void;
        openValueCBHandle(e: any): void;
        openValueErrCBHandle(e: any): void;
    };
}
