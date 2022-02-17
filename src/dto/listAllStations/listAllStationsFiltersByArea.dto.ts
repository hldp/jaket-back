export class ListAllStationsFiltersByAreaDto {
  coordinate: {
    longitude: number;
    latitude: number;
  };
  radius: number;
}
