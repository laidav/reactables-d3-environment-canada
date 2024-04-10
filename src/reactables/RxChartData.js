import { RxBuilder } from '@reactables/core';
import { switchMap, map } from 'rxjs/operators';
import { forkJoin, of } from 'rxjs'

const baseStationsUrl = 'https://api.weather.gc.ca/collections/climate-stations/items?f=json&lang=en&STATION_TYPE=CLIMATE-AUTO&ENG_STN_OPERATOR_ACRONYM=ECCC&HAS_HOURLY_DATA=Y';
const baseWeatherUrl = 'https://api.weather.gc.ca/collections/climate-daily/items?f=json&lang=en';
const previousYear = new Date().getFullYear() - 1;
const cityNames = ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Winnipeg', 'Saskatoon'];

const initialState = {
    updating: false,
    year: '2023',
    cityId: '6158355',
    years: Array.from({ length: 5 }, (_, i) => previousYear - i),
    cities: [],
    cityData: null
};

export const RxChartData = () =>
    RxBuilder({
        initialState,
        sources: [of({ type: 'getCities' }),
        of({
            type: 'updateCityData',
            payload: {
                year: initialState.year,
                cityId: initialState.cityId
            }
        })],
        reducers: {
            getCities: {
                reducer: (state) => state,
                effects: (payload) => ({
                    effects: [
                        (getCities$) => {
                            return getCities$.pipe(

                                // Call city API Service - switchMap operator cancels previous pending call if a new one is initiated
                                switchMap(() => {
                                    const cityRequests = cityNames.map(city => fetch(`${baseStationsUrl}&STATION_NAME=${city}`).then(response => response.json()));
                                    return forkJoin(cityRequests);
                                }),

                                // Map the stations to the cities
                                map(stationRequests => {
                                    return stationRequests.map((stationRequest, index) => ({
                                        label: cityNames[index],
                                        value: stationRequest.features[0].id
                                    }));
                                }),

                                // Map success response to appropriate action
                                map((stations) => ({ type: 'stationsUpdateSuccess', payload: stations }))
                            );
                        }
                    ]
                })
            },
            stationsUpdateSuccess: (state, { payload: stationsData }) => ({
                ...state,
                cities: stationsData
            }),
            updateCityData: {
                reducer: (state, { payload: { year, cityId } }) => ({
                    ...state,
                    updating: true,
                    year,
                    cityId
                }),
                effects: (payload) => ({
                    key: payload.cityId,
                    effects: [
                        (cityUpdates$) => {
                            return cityUpdates$.pipe(

                                // Call city API Service - switchMap operator cancels previous pending call if a new one is initiated
                                switchMap(({ payload }) => {
                                    return fetch(`${baseWeatherUrl}&LOCAL_YEAR=${payload.year}&CLIMATE_IDENTIFIER=${payload.cityId}`).then(response => response.json());
                                }),

                                // Convert date strings to Date objects
                                map(cityData => {
                                    let resultData = cityData.features.map((item) => {
                                        return {
                                            "date": new Date(item.properties.LOCAL_DATE),
                                            "high": item.properties.MAX_TEMPERATURE,
                                            "avg": item.properties.MEAN_TEMPERATURE,
                                            "low": item.properties.MIN_TEMPERATURE
                                        }
                                    });
                                    resultData = resultData.sort((a, b) => {
                                        return a.date - b.date
                                    });
                                    return resultData;
                                }),

                                // Map success response to appropriate action
                                map((cityData) => ({ type: 'cityDataUpdateSuccess', payload: cityData }))
                            );
                        }
                    ]
                })
            },
            cityDataUpdateSuccess: (state, { payload: cityData }) => ({
                ...state,
                updating: false,
                cityData
            })
        }
    });