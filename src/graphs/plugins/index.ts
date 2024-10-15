import { Chart } from "chart.js/auto";
import { PLUGIN_RANGED_FILL } from "./rangedBg";
import Annotation from "chartjs-plugin-annotation";
import { LABEL_PLUGIN } from "./label";

export const CHARTJS_FONT = Bun.env.CHART_FONT_FAMILY || 'Arial'

Chart.defaults.font.family = CHARTJS_FONT;

// Register plugins
Chart.register(PLUGIN_RANGED_FILL, Annotation, LABEL_PLUGIN);

export { Chart };