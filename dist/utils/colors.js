"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rgbToHex = exports.rgb2Hsl = exports.hsb2rgb = void 0;
function hsb2rgb(hue, saturation, brightness) {
    if (hue === 0 && saturation === 0) {
        return {
            R: brightness,
            B: brightness,
            G: brightness,
        };
    }
    const rgb = {
        R: 0,
        G: 0,
        B: 0,
    };
    const segment = Math.floor(hue / 60);
    const offset = hue % 60;
    const mid = brightness * offset / 60;
    switch (segment) {
        case 0:
            rgb.R = Math.round(saturation / 100 * brightness);
            rgb.G = Math.round(saturation / 100 * mid);
            break;
        case 1:
            rgb.R = Math.round(saturation / 100 * (brightness - mid));
            rgb.G = Math.round(saturation / 100 * brightness);
            break;
        case 2:
            rgb.G = Math.round(saturation / 100 * brightness);
            rgb.B = Math.round(saturation / 100 * mid);
            break;
        case 3:
            rgb.G = Math.round(saturation / 100 * (brightness - mid));
            rgb.B = Math.round(saturation / 100 * brightness);
            break;
        case 4:
            rgb.R = Math.round(saturation / 100 * mid);
            rgb.B = Math.round(saturation / 100 * brightness);
            break;
        case 5:
            rgb.R = Math.round(saturation / 100 * brightness);
            rgb.B = Math.round(saturation / 100 * (brightness - mid));
            break;
    }
    return rgb;
}
exports.hsb2rgb = hsb2rgb;
function rgb2Hsl(red, green, blue) {
    red /= 255;
    green /= 255;
    blue /= 255;
    const maxColorValue = Math.max(red, green, blue);
    const minColorValue = Math.min(red, green, blue);
    const brightness = (maxColorValue + minColorValue) / 2;
    if (maxColorValue === minColorValue) {
        return { hue: 0, saturation: 0, brightness };
    }
    const colorValueRange = maxColorValue - minColorValue;
    let saturation = colorValueRange / (maxColorValue + minColorValue);
    if (brightness > 0.5) {
        saturation = colorValueRange / (2 - maxColorValue - minColorValue);
    }
    let hue = (maxColorValue + minColorValue) / 2;
    switch (maxColorValue) {
        case red:
            hue = (green - blue) / colorValueRange + (green < blue ? 6 : 0);
            break;
        case green:
            hue = (blue - red) / colorValueRange + 2;
            break;
        case blue:
            hue = (red - green) / colorValueRange + 4;
            break;
    }
    hue /= 6;
    return { hue, saturation, brightness };
}
exports.rgb2Hsl = rgb2Hsl;
function decimalToHex(decimal) {
    const hex = decimal.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}
function rgbToHex(rgbw) {
    return '#' + decimalToHex(rgbw.R) + decimalToHex(rgbw.G) + decimalToHex(rgbw.B);
}
exports.rgbToHex = rgbToHex;
//# sourceMappingURL=colors.js.map