/// <reference types="miniprogram-api-typings" />
/// <reference types="miniprogram-api-typings" />
import { SuperComponent } from '../common/src/index';
export default class Transition extends SuperComponent {
    externalClasses: string[];
    behaviors: WechatMiniprogram.Behavior.BehaviorIdentifier<{
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
    }, WechatMiniprogram.Component.BehaviorOption>[];
    data: {
        classPrefix: string;
    };
}
