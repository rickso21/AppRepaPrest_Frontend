const baseConfig = require("./app.base.json");

module.exports = {
  ...baseConfig.expo,
  plugins: [...baseConfig.expo.plugins, "./plugins/withAbiSplits"],
};
