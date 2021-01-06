declare type RGB = {
    R: number;
    G: number;
    B: number;
};
export declare function hsb2rgb(hue: number, saturation: number, brightness: number): RGB;
export declare function rgb2Hsl(red: number, green: number, blue: number): {
    hue: number;
    saturation: number;
    brightness: number;
};
export declare function rgbToHex(rgbw: RGB): string;
export {};
//# sourceMappingURL=colors.d.ts.map