/// <reference types="miniprogram-api-typings" />
/// <reference types="miniprogram-api-typings" />
declare const themeChangeBehavior: WechatMiniprogram.Behavior.BehaviorIdentifier<{
    theme: string;
}, WechatMiniprogram.Component.PropertyOption, {
    _initTheme(): void;
}, WechatMiniprogram.Component.BehaviorOption>;
export default themeChangeBehavior;
