/// <reference types="node" />
/// <reference types="miniprogram-api-typings" />
/// <reference types="miniprogram-api-typings" />
import { SuperComponent } from '../common/src/index';
import { ToastOptionsType } from './index';
declare type Timer = NodeJS.Timeout | null;
export default class Toast extends SuperComponent {
    externalClasses: string[];
    options: {
        multipleSlots: boolean;
    };
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
    hideTimer: Timer;
    data: {
        prefix: string;
        classPrefix: string;
        typeMapIcon: string;
    };
    properties: import("./type").TdToastProps;
    lifetimes: {
        detached(): void;
    };
    pageLifetimes: {
        hide(): void;
    };
    methods: {
        show(options: ToastOptionsType): void;
        hide(): void;
        destroyed(): void;
        loop(): void;
    };
}
export {};
