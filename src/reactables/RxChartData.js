import { RxBuilder } from '@reactables/core';
import { switchMap, map } from 'rxjs/operators';
import { of } from 'rxjs'

const baseUrl = 'https://api.weather.gc.ca/collections/climate-daily/items?f=json&lang=en'

const initialState = {
    updating: false,
    year: '2023',
    cityId: '6158355',
    cityData: null,
    cities: [
        { label: 'Toronto', value: '6158355' },
        { label: 'Vancouver', value: '1108380' },
        { label: 'Montreal', value: '702S006' }
    ]
}

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
                                switchMap(({ payload }) => {
                                    return fetch('');
                                })
                            );
                        }
                    ]
                })
            },
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
                                    return fetch(`${baseUrl}&LOCAL_YEAR=${payload.year}&CLIMATE_IDENTIFIER=${payload.cityId}`).then(response => response.json());
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