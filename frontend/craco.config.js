const path = require("path");
require("dotenv").config();

function googlePopupHeaders() {
  return {
    "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    "Cross-Origin-Embedder-Policy": "unsafe-none",
    "Cross-Origin-Resource-Policy": "cross-origin",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };
}

function applyGooglePopupHeaders(app) {
  if (!app) return;
  app.use((req, res, next) => {
    const headers = googlePopupHeaders();
    const apply = () => {
      Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
    };
    apply();
    const originalWriteHead = res.writeHead;
    res.writeHead = function writeHeadPatched(...args) {
      apply();
      return originalWriteHead.apply(this, args);
    };
    next();
  });
}

function makeDevServerV5Compatible(devServerConfig) {
  const {
    https,
    onAfterSetupMiddleware,
    onBeforeSetupMiddleware,
    onListening,
    setupMiddlewares,
    ...compatibleConfig
  } = devServerConfig;

  compatibleConfig.server =
    typeof https === "object"
      ? { type: "https", options: https }
      : https
        ? "https"
        : "http";
  compatibleConfig.headers = () => googlePopupHeaders();

  if (onBeforeSetupMiddleware || setupMiddlewares) {
    compatibleConfig.setupMiddlewares = (middlewares, devServer) => {
      applyGooglePopupHeaders(devServer?.app);
      if (onBeforeSetupMiddleware) {
        onBeforeSetupMiddleware(devServer);
      }
      return setupMiddlewares
        ? setupMiddlewares(middlewares, devServer)
        : middlewares;
    };
  }

  compatibleConfig.onListening = (devServer) => {
    devServer.close ??= (callback) => devServer.stopCallback(callback);
    if (onListening) onListening(devServer);
    if (onAfterSetupMiddleware) onAfterSetupMiddleware(devServer);
  };

  return compatibleConfig;
}

module.exports = {
  eslint: {
    configure: {
      extends: ["plugin:react-hooks/recommended"],
      rules: {
        "react-hooks/rules-of-hooks": "error",
        "react-hooks/exhaustive-deps": "warn",
      },
    },
  },
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    configure: (webpackConfig) => {
      webpackConfig.watchOptions = {
        ...webpackConfig.watchOptions,
        ignored: [
          "**/node_modules/**",
          "**/.git/**",
          "**/build/**",
          "**/dist/**",
          "**/coverage/**",
          "**/public/**",
        ],
      };
      return webpackConfig;
    },
  },
  devServer: (devServerConfig) => {
    const compatible = makeDevServerV5Compatible(devServerConfig);
    const prevSetup = compatible.setupMiddlewares;
    compatible.setupMiddlewares = (middlewares, devServer) => {
      applyGooglePopupHeaders(devServer?.app);
      const next = prevSetup ? prevSetup(middlewares, devServer) : middlewares;
      if (devServer?.app) {
        require('./scripts/registerAiInventoryRoutes').registerAiInventoryRoutes(devServer.app);
      }
      return next;
    };
    return compatible;
  },
};
