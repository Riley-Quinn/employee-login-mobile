// Locations.js
import { useState, useEffect } from 'react';
import axios from 'axios';
// @ts-ignore
import { BASE_URL } from '@env';
const Locations = () => {
  const [states, setStates] = useState(null);
  const [cities, setCities] = useState(null);
  const [areas, setAreas] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);

  const handleStates = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/states`, {
        params: { is_active: 1 },
      });
      const { data } = response;
      setStates(data);
    } catch (error) {
      console.error('Fetching states failed:', error);
    }
  };

  const handleCities = async (state: never) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/cities/state/${state}`);
      const { data } = response;
      setCities(data);
    } catch (error) {
      console.error('Fetching cities failed:', error);
    }
  };

  const handleAreas = async (city: never) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/regions/city/${city}`);
      const { data } = response;
      setAreas(data);
    } catch (error) {
      console.error('Fetching areas failed:', error);
    }
  };

  useEffect(() => {
    handleStates();
  }, []);

  useEffect(() => {
    if (selectedState) {
      handleCities(selectedState);
    }
  }, [selectedState]);

  useEffect(() => {
    if (selectedCity) {
      handleAreas(selectedCity);
    }
  }, [selectedCity]);

  return {
    states,
    cities,
    areas,
    setSelectedState,
    setSelectedCity,
    handleStates,
    handleCities,
  };
};

export default Locations;
