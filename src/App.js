import React from 'react';
import { RxChartData } from './reactables/RxChartData';
import { useReactable } from '@reactables/react-helpers';
import './App.css';
import LineChart from './visualizations/LineChart';
import BarChart from './visualizations/BarChart';
import RadialChart from './visualizations/RadialChart';

const App = () => {

  const [state, actions] = useReactable(RxChartData);

  // Why do I have to provide both year and cityId when only 1 changes.
  // Ideally destructure should take the previous default if I provide undefined,
  // and if I split it into 2 methods that sucks too then have to extract
  // the logic from the effect.
  // Augmenting reducer to allow optional payload properties doesn't work
  // because effect doesn't get the state, only payload.
  const updateYear = (e) => {
    actions.updateCityData({ year: e.target.value, cityId: state.cityId })
  }

  const updateCity = (e) => {
    actions.updateCityData({ year: state.year, cityId: e.target.value });
  }

  // Handling default with both value and onChange is weird, there's state correlation between the two.
  // The default should derive from the state and onchange shouldn't be necessary given value is updated
  // when an option is selected.
  return (
    <div className="App">
      {state && (
        <h1>
          <select name='year' value={state.year} onChange={updateYear} disabled={state.updating}>
            {
              ['2019', '2020', '2021', '2022', '2023'].map(option => {
                return (<option key={option} value={option}>{option}</option>);
              })
            }
          </select>
          &nbsp;temperatures for
          <select name='city' value={state.cityId} onChange={updateCity} disabled={state.updating}>
            {
              state.cities.map(option => {
                return (<option key={option.value} value={option.value}>{option.label}</option>);
              })
            }
          </select>
        </h1>
      )}
      <p>
        Weather information for various Canadian cities using React + <a href='https://github.com/reactables/reactables' target='_new'>Reactables</a>, and d3 for visualizations.
      </p>
      {state && (
        <div>
          <LineChart data={state.cityData} />
          <BarChart data={state.cityData} />
          <RadialChart data={state.cityData} />
        </div>
      )}
      <em><h6>Data from <a href='https://api.weather.gc.ca/' target='_new'>Environment Canada</a></h6></em>
    </div>
  );
}

export default App;
