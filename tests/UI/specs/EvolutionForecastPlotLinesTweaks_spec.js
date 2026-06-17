/*!
 * Matomo - free/libre analytics platform
 *
 * Forecast evolution chart rendered with the PlotLinesTweaks redesign enabled.
 *
 * @link    https://matomo.org
 * @license https://www.gnu.org/licenses/gpl-3.0.html GPL v3 or later
 */

describe('EvolutionForecastPlotLinesTweaks', function () {
    // The "plotlines-tweaks-enabled" body class is only added in "dashboard" and
    // "widgetized" body contexts (Template.bodyClass). The Widgetize iframe produces
    // the "widgetized" type, so the tweaks apply here.
    const pageUrl = '?module=Widgetize&action=iframe&idSite=1&period=day&date=2012-01-31&evolution_day_last_n=30'
        + '&moduleToWidgetize=UserCountry&actionToWidgetize=getCountry&viewDataTable=graphEvolution'
        + '&isFooterExpandedInDashboard=1';

    before(function () {
        testEnvironment.overrideConfig('FeatureFlags', 'PlotLinesTweaks_feature', 'enabled');
        testEnvironment.save();
    });

    after(function () {
        if (testEnvironment.configOverride.FeatureFlags) {
            delete testEnvironment.configOverride.FeatureFlags.PlotLinesTweaks_feature;
        }
        testEnvironment.save();
    });

    it('should render an evolution chart ending on a forecasted value', async function () {
        await page.goto(pageUrl);
        await page.waitForNetworkIdle();

        // The forecast is always-on but only renders for incomplete trailing periods,
        // which depend on wall-clock "now". Inject a deterministic final forecast point
        // so the screenshot is stable regardless of when the suite runs.
        await page.evaluate(() => {
            const normalizePoint = (value) => (Array.isArray(value) ? value[1] : value);

            const dataTable = $('.dataTable:has(.piwik-graph)').data('uiControlObject');
            const seriesIndex = 0;
            const series = dataTable.data[seriesIndex].map(normalizePoint);

            // Anchor the forecast to the last tick that has a finite value and a finite
            // predecessor, so the forecast connector has a real point to extend from.
            let targetTick = -1;
            for (let tick = series.length - 1; tick >= 1; tick -= 1) {
                if (Number.isFinite(series[tick]) && Number.isFinite(series[tick - 1])) {
                    targetTick = tick;
                    break;
                }
            }

            if (targetTick === -1) {
                throw new Error('Could not find a usable tick for the forecast scenario.');
            }

            const states = Array(series.length).fill('complete');
            states[targetTick] = 'incomplete';

            const forecastData = dataTable.data.map((s) => Array(s.length).fill(null));
            forecastData[seriesIndex][targetTick] = series[targetTick - 1] + 10;

            dataTable._setDataStates(states);
            dataTable._setForecastData(forecastData);
            dataTable.render();
        });

        await page.waitForSelector('.piwik-graph canvas');

        const graph = await page.$('.piwik-graph');
        expect(await graph.screenshot()).to.matchImage('forecast_final_value');
    });
});
