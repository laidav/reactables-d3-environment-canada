import { RxBuilder } from "@reactables/core";
import { switchMap, map, mergeMap } from "rxjs/operators";
import { forkJoin, of, concat } from "rxjs";

const baseStationsUrl =
  "https://api.weather.gc.ca/collections/climate-stations/items?f=json&lang=en&STATION_TYPE=CLIMATE-AUTO&ENG_STN_OPERATOR_ACRONYM=ECCC&HAS_HOURLY_DATA=Y";
const baseWeatherUrl =
  "https://api.weather.gc.ca/collections/climate-daily/items?f=json&lang=en";
const previousYear = new Date().getFullYear() - 1;
const cityNames = [
  "Toronto",
  "Vancouver",
  "Montreal",
  "Calgary",
  "Ottawa",
  "Winnipeg",
  "Saskatoon",
];

const initialState = {
  updating: false,
  year: "2023",
  cityId: null,
  years: Array.from({ length: 5 }, (_, i) => previousYear - i),
  cities: [],
  cityData: null,
};

const getCitiesRequest = () =>
  cityNames.map((city) =>
    fetch(`${baseStationsUrl}&STATION_NAME=${city}`).then((response) =>
      response.json()
    )
  );

export const RxChartData = () =>
  RxBuilder({
    initialState,
    sources: [
      forkJoin(getCitiesRequest()).pipe(
        mergeMap((stationRequests) => {
          const stationOptions = stationRequests.map(
            (stationRequest, index) => ({
              label: cityNames[index],
              value: stationRequest.features[0].id,
            })
          );

          // concat allows you to send observables in a specific order i.e 1. stationsUpdateSuccess 2. updateCityData
          return concat(
            of({
              type: "stationsUpdateSuccess",
              payload: stationOptions,
            }),
            of({
              type: "updateCityData",
              payload: {
                year: initialState.year,
                cityId: stationRequests[0].features[0].id,
              },
            })
          );
        })
      ),
    ],
    reducers: {
      stationsUpdateSuccess: (state, { payload: stationOptions }) => ({
        ...state,
        // We can set the cityId to first option mapped from the api requests
        cityId: stationOptions[0].value,
        cities: stationOptions,
      }),
      updateCityData: {
        reducer: (state, { payload: { year, cityId } }) => ({
          ...state,
          updating: true,
          year,
          cityId,
        }),
        effects: (payload) => ({
          key: payload.cityId,
          effects: [
            (cityUpdates$) => {
              return cityUpdates$.pipe(
                // Call city API Service - switchMap operator cancels previous pending call if a new one is initiated
                switchMap(({ payload }) => {
                  return fetch(
                    `${baseWeatherUrl}&LOCAL_YEAR=${payload.year}&CLIMATE_IDENTIFIER=${payload.cityId}`
                  ).then((response) => response.json());
                }),

                // Convert date strings to Date objects
                map((cityData) => {
                  let resultData = cityData.features.map((item) => {
                    return {
                      date: new Date(item.properties.LOCAL_DATE),
                      high: item.properties.MAX_TEMPERATURE,
                      avg: item.properties.MEAN_TEMPERATURE,
                      low: item.properties.MIN_TEMPERATURE,
                    };
                  });
                  resultData = resultData.slice().sort((a, b) => {
                    return a.date - b.date;
                  });
                  return resultData;
                }),

                // Map success response to appropriate action
                map((cityData) => ({
                  type: "cityDataUpdateSuccess",
                  payload: cityData,
                }))
              );
            },
          ],
        }),
      },
      cityDataUpdateSuccess: (state, { payload: cityData }) => ({
        ...state,
        updating: false,
        cityData,
      }),
    },
  });
