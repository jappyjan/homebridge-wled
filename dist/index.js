"use strict";
const Plugin_1 = require("./plugin/Plugin");
const settings_1 = require("./settings");
module.exports = (api) => {
    api.registerPlatform('homebridge-' + settings_1.PLATFORM_NAME, settings_1.PLATFORM_NAME, Plugin_1.Plugin);
};
//# sourceMappingURL=index.js.map