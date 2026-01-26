/// <reference types="miniprogram-api-typings" />
/// <reference types="miniprogram-api-typings" />
export default function transition(): WechatMiniprogram.Behavior.BehaviorIdentifier<{
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
}, WechatMiniprogram.Component.BehaviorOption>;
