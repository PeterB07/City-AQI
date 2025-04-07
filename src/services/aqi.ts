const WAQI_API_KEY = import.meta.env.VITE_WAQI_API_KEY;
const WAQI_API_BASE_URL = 'https://api.waqi.info/feed';

export interface AQIPrediction {
  predictedAQI: number;
  confidence: number;
  trend: 'improving' | 'stable' | 'worsening';
}

export interface EnvironmentalData {
  current: {
    timestamp: string;
    temperature: number;
    humidity: number;
    co2: number;
    aqi: {
      value: number;
      category: string;
      pollutants: {
        pm25?: number;
        no2?: number;
        so2?: number;
        o3?: number;
      };
      prediction?: AQIPrediction;
    };
  };
  hourly: Array<{
    hour: string;
    temperature: number;
    humidity: number;
    co2: number;
    aqi: {
      value: number;
      pollutants?: {
        pm25?: number;
        no2?: number;
        so2?: number;
        o3?: number;
      };
    };
  }>;
  timeRangeAverages: {
    daily: Array<{ hour: string; averageAqi: number }>;
    weekly: Array<{ week: string; averageAqi: number }>;
    monthly: Array<{ month: string; averageAqi: number }>;
    yearly: Array<{ year: string; averageAqi: number }>;
  };
  locationAverages: Array<{
    location: string;
    averageAqi: number;
  }>;
}

export const getAqiCategory = (aqi: number): string => {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
};

async function fetchWaqiData(city: string) {
  try {
    const response = await fetch(`${WAQI_API_BASE_URL}/${encodeURIComponent(city)}/?token=${WAQI_API_KEY}`);
    if (!response.ok) {
      throw new Error('Failed to fetch WAQI data');
    }
    const data = await response.json();
    if (data.status !== 'ok') {
      throw new Error(data.data || 'Failed to fetch WAQI data');
    }
    return data;
  } catch (error) {
    console.error('Error fetching WAQI data:', error);
    throw error;
  }
}

export const fetchEnvironmentalData = async (city: string = 'mumbai'): Promise<EnvironmentalData> => {
  try {
    const waqiResponse = await fetchWaqiData(city);
    const waqiData = waqiResponse.data;
    
    const now = new Date();
    const currentAqi = waqiData.aqi;

    // Generate some realistic variations for historical data
    const generateVariation = (baseValue: number) => {
      return Math.max(0, baseValue + (Math.random() * 40 - 20));
    };

    const processedData: EnvironmentalData = {
      current: {
        timestamp: now.toISOString(),
        temperature: waqiData.iaqi?.t?.v || 25,
        humidity: waqiData.iaqi?.h?.v || 60,
        co2: waqiData.iaqi?.co?.v || 400,
        aqi: {
          value: currentAqi,
          category: getAqiCategory(currentAqi),
          pollutants: {
            pm25: waqiData.iaqi?.pm25?.v,
            no2: waqiData.iaqi?.no2?.v,
            so2: waqiData.iaqi?.so2?.v,
            o3: waqiData.iaqi?.o3?.v
          },
          prediction: {
            predictedAQI: currentAqi + (Math.random() * 20 - 10),
            confidence: 0.85,
            trend: Math.random() > 0.5 ? 'improving' : 'worsening'
          }
        }
      },
      hourly: Array.from({ length: 24 }, (_, i) => {
        const hour = new Date(now);
        hour.setHours(hour.getHours() - i);
        return {
          hour: hour.getHours().toString().padStart(2, '0') + ':00',
          temperature: waqiData.iaqi?.t?.v || 25 + (Math.random() * 5 - 2.5),
          humidity: waqiData.iaqi?.h?.v || 60 + (Math.random() * 10 - 5),
          co2: waqiData.iaqi?.co?.v || 400 + (Math.random() * 100 - 50),
          aqi: {
            value: generateVariation(currentAqi),
            pollutants: {
              no2: waqiData.iaqi?.no2?.v,
              so2: waqiData.iaqi?.so2?.v,
              o3: waqiData.iaqi?.o3?.v
            }
          }
        };
      }),
      timeRangeAverages: {
        daily: Array.from({ length: 24 }, (_, i) => ({
          hour: i.toString().padStart(2, '0') + ':00',
          averageAqi: generateVariation(currentAqi)
        })),
        weekly: Array.from({ length: 4 }, (_, i) => ({
          week: `Week ${i + 1}`,
          averageAqi: generateVariation(currentAqi)
        })),
        monthly: Array.from({ length: 12 }, (_, i) => ({
          month: new Date(2024, i, 1).toLocaleString('default', { month: 'short' }),
          averageAqi: generateVariation(currentAqi)
        })),
        yearly: Array.from({ length: 5 }, (_, i) => ({
          year: (2020 + i).toString(),
          averageAqi: generateVariation(currentAqi)
        }))
      },
      locationAverages: [
        { location: 'downtown', averageAqi: Math.round(currentAqi * 1.2) },
        { location: 'suburbs', averageAqi: Math.round(currentAqi * 0.8) },
        { location: 'industrial', averageAqi: Math.round(currentAqi * 1.4) },
        { location: 'residential', averageAqi: Math.round(currentAqi * 0.9) },
        { location: 'parks', averageAqi: Math.round(currentAqi * 0.7) }
      ]
    };

    return processedData;
  } catch (error) {
    console.error('Error in fetchEnvironmentalData:', error);
    throw error;
  }
};