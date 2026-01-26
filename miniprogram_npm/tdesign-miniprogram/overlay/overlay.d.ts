/// <reference types="miniprogram-api-typings" />
/// <reference types="miniprogram-api-typings" />
import { SuperComponent } from '../common/src/index';
import { TdOverlayProps } from './type';
export interface OverlayProps extends TdOverlayProps {
}
export default class Overlay extends SuperComponent {
    properties: TdOverlayProps;
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
    data: {
        prefix: string;
        classPrefix: string;
        computedStyle: string;
        _zIndex: number;
    };
    observers: {
        backgroundColor(v: any): void;
        zIndex(v: any): void;
    };
    methods: {
        handleClick(): void;
        noop(): void;
    };
}
