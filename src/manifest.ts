import { defineManifest } from "@crxjs/vite-plugin";
import packageData from "../package.json";

const isDev = process.env.NODE_ENV == "development";

export default defineManifest({
  name: `${packageData.displayName || packageData.name}${isDev ? ` ➡️ Dev` : ""}`,
  description: packageData.description,
  version: packageData.version,
  manifest_version: 3,
  icons: {
    16: "icons/xbox-x364.png",
    32: "icons/xbox-x364.png",
    48: "icons/xbox-x364.png",
    128: "icons/xbox-x364.png",
  },
  action: {
    default_popup: "popup.html",
    default_icon: "icons/xbox-x364.png",
  },
  options_page: "options.html",
  devtools_page: "devtools.html",
  background: {
    service_worker: "src/background/index.ts",
    type: "module",
  },
  content_scripts: [
    {
      matches: ["http://*/*", "https://*/*", "file:///*"],
      js: ["src/content/draggable/index.ts"],
      css: ["src/content/draggable/index.scss"],
    },
    {
      matches: ["http://*/*", "https://*/*", "file:///*"],
      js: ["src/content/index.ts"],
    },
  ],
  side_panel: {
    default_path: "sidepanel.html",
  },
  web_accessible_resources: [
    {
      resources: ["icons/xbox-x364.png"],
      matches: [],
    },
  ],
  permissions: ["sidePanel", "storage"],
  chrome_url_overrides: {
    // newtab: "newtab.html",
  },
});
