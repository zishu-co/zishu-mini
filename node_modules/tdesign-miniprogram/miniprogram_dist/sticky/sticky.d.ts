/// <reference types="miniprogram-api-typings" />
/// <reference types="miniprogram-api-typings" />
import { SuperComponent } from '../common/src/index';
import type { TdStickyProps } from './type';
export interface StickyProps extends TdStickyProps {
}
export default class Sticky extends SuperComponent {
    externalClasses: string[];
    properties: TdStickyProps;
    behaviors: WechatMiniprogram.Behavior.BehaviorIdentifier<WechatMiniprogram.Component.DataOption, WechatMiniprogram.Component.PropertyOption, WechatMiniprogram.Component.MethodOption, WechatMiniprogram.Component.BehaviorOption>[];
    observers: {
        'offsetTop, disabled, container'(): void;
    };
    data: {
        prefix: string;
        classPrefix: string;
        containerStyle: string;
        contentStyle: string;
    };
    ready(): void;
    methods: {
        onScroll(event?: {
            scrollTop: number;
        }): void;
        setDataAfterDiff(data: {
            isFixed: boolean;
            height?: number;
            transform?: number;
        }): void;
        getContainerRect(): Promise<WechatMiniprogram.BoundingClientRectCallbackResult>;
    };
}
