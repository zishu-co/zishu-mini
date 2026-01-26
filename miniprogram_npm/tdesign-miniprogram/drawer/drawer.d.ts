/// <reference types="miniprogram-api-typings" />
/// <reference types="miniprogram-api-typings" />
import { ComponentsOptionsType, SuperComponent } from '../common/src/index';
export default class Drawer extends SuperComponent {
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
    externalClasses: any[];
    options: ComponentsOptionsType;
    properties: import("./type").TdDrawerProps;
    data: {
        classPrefix: string;
    };
    methods: {
        onVisibleChange({ detail }: {
            detail: any;
        }): void;
        onItemClick(detail: any): void;
    };
}
