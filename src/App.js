import React from 'react';
import { RxChartData } from './reactables/RxChartData';
import { useReactable } from '@reactables/react-helpers';
import './App.css';
import LineChart from './visualizations/LineChart';
import BarChart from './visualizations/BarChart';
import RadialChart from './visualizations/RadialChart';

const App = () => {

  const [state, actions] = useReactable(RxChartData);
  
  const updateYear = (e) => {
    actions.updateCityData({ year: e.target.value, cityId: state.cityId })
  }

  const updateCity = (e) => {
    actions.updateCityData({ year: state.year, cityId: e.target.value });
  }

  return (
    <div className="App">
      {state && (
        <h1>
          <select name='year' value={state.year} onChange={updateYear} disabled={state.updating}>
            {
              state.years.map(option => {
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
