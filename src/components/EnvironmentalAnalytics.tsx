import { useEffect, useState } from "react";
import { Card } from "./ui/card";
import { ResponsiveLine } from "@nivo/line";
import { ResponsiveBar } from "@nivo/bar";
import { fetchEnvironmentalData, type EnvironmentalData } from "@/services/aqi";
import { ArrowUpIcon, ArrowDownIcon, ArrowRightIcon } from "@heroicons/react/24/solid";

type TimeRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

const timeRangeDescriptions = {
  daily: "24-hour pattern showing typical daily variations in air quality",
  weekly: "Recent 4-week trend showing day-to-day variations in air quality",
  monthly: "12-month view highlighting seasonal patterns in air quality",
  yearly: "5-year historical data showing long-term air quality improvements"
};

const chartTheme = {
  textColor: "#ffffff",
  axis: {
    domain: {
      line: {
        stroke: "#ffffff"
      }
    },
    ticks: {
      line: {
        stroke: "#ffffff"
      },
      text: {
        fill: "#ffffff"
      }
    },
    legend: {
      text: {
        fill: "#ffffff",
        fontSize: 12,
        fontWeight: 600
      }
    }
  },
  grid: {
    line: {
      stroke: "#ffffff",
      strokeOpacity: 0.1
    }
  },
  legends: {
    text: {
      fill: "#ffffff",
      fontSize: 12
    }
  }
};

const getAqiColor = (value: number) => {
  if (value <= 50) return '#00E396';
  if (value <= 100) return '#FEB019';
  if (value <= 150) return '#FF4560';
  if (value <= 200) return '#775DD0';
  if (value <= 300) return '#FF1010';
  return '#7A0000';
};

const TrendIndicator = ({ trend }: { trend: 'improving' | 'stable' | 'worsening' }) => {
  const config = {
    improving: { icon: ArrowDownIcon, color: 'text-green-500', text: 'Improving' },
    stable: { icon: ArrowRightIcon, color: 'text-blue-500', text: 'Stable' },
    worsening: { icon: ArrowUpIcon, color: 'text-red-500', text: 'Worsening' }
  }[trend];

  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1 ${config.color}`}>
      <Icon className="h-4 w-4" />
      <span>{config.text}</span>
    </div>
  );
};

interface EnvironmentalAnalyticsProps {
  city: string;
}

export function EnvironmentalAnalytics({ city }: EnvironmentalAnalyticsProps) {
  const [envData, setEnvData] = useState<EnvironmentalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>('daily');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchEnvironmentalData(city);
        setEnvData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch environmental data');
        console.error('Error fetching environmental data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Update every 5 minutes
    return () => clearInterval(interval);
  }, [city]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg animate-pulse">Loading environmental data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-500/10 rounded-lg">
        <p className="text-red-500">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!envData) {
    return (
      <div className="p-6 bg-yellow-500/10 rounded-lg">
        <p className="text-yellow-500">No environmental data available</p>
      </div>
    );
  }

  const getTimeRangeData = () => {
    switch (selectedTimeRange) {
      case 'daily':
        return envData.timeRangeAverages.daily.map(d => ({
          period: d.hour,
          value: d.averageAqi
        }));
      case 'weekly':
        return envData.timeRangeAverages.weekly.map(d => ({
          period: d.week,
          value: d.averageAqi
        }));
      case 'monthly':
        return envData.timeRangeAverages.monthly.map(d => ({
          period: d.month,
          value: d.averageAqi
        }));
      case 'yearly':
        return envData.timeRangeAverages.yearly.map(d => ({
          period: d.year,
          value: d.averageAqi
        }));
    }
  };

  // Helper function to get pollutant value with fallback
  const getPollutantValue = (pollutant: keyof EnvironmentalData['current']['aqi']['pollutants']) => {
    return envData.current.aqi.pollutants[pollutant] ?? 0;
  };

  // Helper function to determine primary pollutant
  const getPrimaryPollutant = () => {
    const pollutants = envData.current.aqi.pollutants;
    const values = {
      'PM2.5': pollutants.pm25 ?? 0,
      'NO2': pollutants.no2 ?? 0,
      'SO2': pollutants.so2 ?? 0,
      'O3': pollutants.o3 ?? 0
    };
    
    return Object.entries(values).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h3 className="text-lg font-semibold">Air Quality Index Trends</h3>
            <div className="flex gap-2">
              {(['daily', 'weekly', 'monthly', 'yearly'] as TimeRange[]).map(range => (
                <button
                  key={range}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedTimeRange === range
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                  onClick={() => setSelectedTimeRange(range)}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            {timeRangeDescriptions[selectedTimeRange]}
          </div>

          <div className="h-[400px]">
            <ResponsiveBar
              data={getTimeRangeData()}
              keys={['value']}
              indexBy="period"
              margin={{ top: 20, right: 20, bottom: 50, left: 60 }}
              padding={0.3}
              colors={({ data }) => getAqiColor(data.value)}
              borderRadius={4}
              enableGridX={false}
              enableGridY={false}
              theme={chartTheme}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: selectedTimeRange === 'daily' ? -45 : -45,
                tickValues: selectedTimeRange === 'daily' ? 12 : undefined,
                legend: selectedTimeRange === 'daily' ? 'Hours' :
                       selectedTimeRange === 'weekly' ? 'Weeks' :
                       selectedTimeRange === 'monthly' ? 'Months' : 'Years',
                legendPosition: 'middle',
                legendOffset: 40
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Air Quality Index (AQI)',
                legendPosition: 'middle',
                legendOffset: -50
              }}
              tooltip={({ value, indexValue, color }) => (
                <div className="bg-gray-800 text-white p-2 border border-gray-700 rounded shadow-lg">
                  <strong>{indexValue}</strong>
                  <br />
                  <span style={{ color }}>AQI: {value}</span>
                </div>
              )}
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50 relative">
          <h3 className="text-lg font-semibold mb-2">Current AQI</h3>
          <div className="text-4xl font-bold" style={{ color: getAqiColor(envData.current.aqi.value) }}>
            {envData.current.aqi.value}
          </div>
          <div className="space-y-2">
            <div className="text-lg font-medium" style={{ color: getAqiColor(envData.current.aqi.value) }}>
              {envData.current.aqi.category}
            </div>
            {envData.current.aqi.prediction && (
              <div className="space-y-2 bg-gradient-to-r from-blue-500/10 to-blue-600/5 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Predicted:</span>
                  <span className="font-medium" style={{ color: getAqiColor(envData.current.aqi.prediction.predictedAQI) }}>
                    {envData.current.aqi.prediction.predictedAQI} AQI
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Confidence:</span>
                  <span className="font-medium text-blue-400">
                    {Math.round(envData.current.aqi.prediction.confidence * 100)}%
                  </span>
                </div>
                <TrendIndicator trend={envData.current.aqi.prediction.trend} />
              </div>
            )}
          </div>
          <div className="mt-4 text-sm text-gray-400">
            Last updated: {new Date(envData.current.timestamp).toLocaleTimeString()}
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-blue-500/10 to-blue-600/5">
          <h3 className="text-lg font-semibold mb-2">NO₂ Levels</h3>
          <div className="text-4xl font-bold">{getPollutantValue('no2')} ppb</div>
          <div className="mt-2 text-blue-400">
            Nitrogen Dioxide
            <span className="ml-2 text-sm">
              {getPollutantValue('no2') > 100 ? '(High)' :
               getPollutantValue('no2') > 50 ? '(Moderate)' : '(Normal)'}
            </span>
          </div>
          <div className="mt-4 text-sm text-gray-400">Real-time monitoring</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-yellow-500/10 to-yellow-600/5">
          <h3 className="text-lg font-semibold mb-2">SO₂ Levels</h3>
          <div className="text-4xl font-bold">{getPollutantValue('so2')} ppb</div>
          <div className="mt-2 text-yellow-400">
            Sulfur Dioxide
            <span className="ml-2 text-sm">
              {getPollutantValue('so2') > 75 ? '(High)' :
               getPollutantValue('so2') > 35 ? '(Moderate)' : '(Normal)'}
            </span>
          </div>
          <div className="mt-4 text-sm text-gray-400">Real-time monitoring</div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-500/10 to-purple-600/5">
          <h3 className="text-lg font-semibold mb-2">O₃ Levels</h3>
          <div className="text-4xl font-bold">{getPollutantValue('o3')} ppb</div>
          <div className="mt-2 text-purple-400">
            Ozone
            <span className="ml-2 text-sm">
              {getPollutantValue('o3') > 70 ? '(High)' :
               getPollutantValue('o3') > 50 ? '(Moderate)' : '(Normal)'}
            </span>
          </div>
          <div className="mt-4 text-sm text-gray-400">Real-time monitoring</div>
        </Card>
      </div>

      <Card className="p-6 bg-gradient-to-br from-slate-800/50 to-slate-900/50">
        <h3 className="text-lg font-semibold mb-4">Location-wise AQI Comparison</h3>
        <div className="h-[380px]">
          <ResponsiveBar
            data={envData.locationAverages.map(loc => ({
              location: loc.location.charAt(0).toUpperCase() + loc.location.slice(1),
              value: loc.averageAqi
            }))}
            keys={['value']}
            indexBy="location"
            margin={{ top: 25, right: 20, bottom: 55, left: 60 }}
            padding={0.3}
            colors={({ data }) => getAqiColor(data.value)}
            borderRadius={4}
            enableGridX={false}
            enableGridY={false}
            theme={chartTheme}
            axisBottom={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: -45,
              legend: 'Location',
              legendPosition: 'middle',
              legendOffset: 45
            }}
            axisLeft={{
              tickSize: 5,
              tickPadding: 5,
              tickRotation: 0,
              legend: 'Air Quality Index (AQI)',
              legendPosition: 'middle',
              legendOffset: -50
            }}
            tooltip={({ value, indexValue, color }) => (
              <div className="bg-gray-800 text-white p-2 border border-gray-700 rounded shadow-lg">
                <strong>{indexValue}</strong>
                <br />
                <span style={{ color }}>AQI: {value}</span>
              </div>
            )}
          />
        </div>
      </Card>
    </div>
  );
}