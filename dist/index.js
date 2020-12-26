"use strict";
const HttpIrTvPlugin_1 = require("./HttpIrTvPlugin");
const settings_1 = require("./settings");
module.exports = (api) => {
    api.registerPlatform('homebridge-' + settings_1.PLATFORM_NAME, settings_1.PLATFORM_NAME, HttpIrTvPlugin_1.HttpIrTvPlugin);
};
//# sourceMappingURL=index.js.map