/// <reference types="miniprogram-api-typings" />
/// <reference types="miniprogram-api-typings" />
import { SuperComponent, RelationsOptions } from '../common/src/index';
export default class Picker extends SuperComponent {
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
    properties: import("./type").TdPickerProps;
    externalClasses: string[];
    options: {
        multipleSlots: boolean;
    };
    relations: RelationsOptions;
    observers: {
        'value, visible'(value: any, visible: any): void;
        'itemHeight, visibleItemCount'(): void;
    };
    data: {
        prefix: string;
        classPrefix: string;
        defaultPopUpProps: {};
        defaultPopUpzIndex: number;
        indicatorTop: number;
    };
    methods: {
        updateChildren(): void;
        getSelectedValue(): any[];
        getColumnIndexes(): any;
        onConfirm(): void;
        triggerColumnChange({ column, index }: {
            column: any;
            index: any;
        }): void;
        onCancel(): void;
        onPopupChange(e: any): void;
        close(trigger: any): void;
        updateIndicatorPosition(): void;
    };
    ready(): void;
}
