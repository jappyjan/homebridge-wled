"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rgbToHex = exports.hsb2rgb = void 0;
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
function decimalToHex(decimal) {
    const hex = decimal.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
}
function rgbToHex(rgbw) {
    return '#' + decimalToHex(rgbw.R) + decimalToHex(rgbw.G) + decimalToHex(rgbw.B);
}
exports.rgbToHex = rgbToHex;
//# sourceMappingURL=colors.js.map