/// <reference types="miniprogram-api-typings" />
/// <reference types="miniprogram-api-typings" />
import { SuperComponent } from '../common/src/index';
export default class Fab extends SuperComponent {
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
    properties: import("./type").TdFabProps;
    externalClasses: string[];
    data: {
        prefix: string;
        classPrefix: string;
        buttonData: {
            size: string;
            shape: string;
            theme: string;
            tClass: string;
        };
        moveStyle: any;
    };
    observers: {
        'buttonProps.**, icon, text, ariaLabel, yBounds'(): void;
    };
    methods: {
        onTplButtonTap(e: any): void;
        onStart(e: any): void;
        onMove(e: any): void;
        onEnd(e: any): void;
        computedSize(): void;
    };
}
