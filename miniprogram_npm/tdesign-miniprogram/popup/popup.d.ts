/// <reference types="miniprogram-api-typings" />
/// <reference types="miniprogram-api-typings" />
import { TdPopupProps } from './type';
import { SuperComponent } from '../common/src/index';
export declare type PopupProps = TdPopupProps;
export default class Popup extends SuperComponent {
    externalClasses: string[];
    behaviors: (WechatMiniprogram.Behavior.BehaviorIdentifier<{
        transitionClass: string;
        transitionDurations: number;
        className: string;
        realVisible: boolean;
    }, {
        visible: {
            type: BooleanConstructor;
            value: any;
            observer: string;
        };
        appear: BooleanConstructor;
        name: {
            type: StringConstructor;
            value: string;
        };
        durations: {
            type: NumberConstructor;
            optionalTypes: ArrayConstructor[];
        };
    }, {
        watchVisible(curr: any, prev: any): void;
        getDurations(): number[];
        enter(): void;
        entered(): void;
        leave(): void;
        leaved(): void;
        onTransitionEnd(): void;
    }, WechatMiniprogram.Component.BehaviorOption> | WechatMiniprogram.Behavior.BehaviorIdentifier<{
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
    }, WechatMiniprogram.Component.BehaviorOption>)[];
    options: {
        multipleSlots: boolean;
    };
    properties: TdPopupProps;
    data: {
        prefix: string;
        classPrefix: string;
    };
    methods: {
        handleOverlayClick(): void;
        handleClose(): void;
    };
}
