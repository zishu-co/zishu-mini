/// <reference types="miniprogram-api-typings" />
/// <reference types="miniprogram-api-typings" />
declare const useCustomNavbarBehavior: WechatMiniprogram.Behavior.BehaviorIdentifier<{
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
}, WechatMiniprogram.Component.BehaviorOption>;
export default useCustomNavbarBehavior;
