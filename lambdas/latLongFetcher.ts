import axios, { AxiosResponse } from 'axios';
import { LatLongResponse } from "./LatLongResponse";
import { LocationPostRequest } from "./LocationPostRequest";

export async function latLongFetch(location: LocationPostRequest) {
    const url = 'https://nominatim.openstreetmap.org/search'

    const res: AxiosResponse<LatLongResponse> = await axios.get(url, {
        params: {
            city: location.city,
            state: location.state,
            country: location.country,
            format: "json"
        }
      })
    return res
  }