import {
  getBarkingSchedule,
  getHarrowSchedule,
  getHDCSchedule,
  getRushmoorSchedule,
  getYorkSchedule,
} from '@common/services/councilSchedule/';
import { ISchedule } from '@project/lambdas/interfaces/ISchedule';
export const councilTable: Record<
  string,
  {
    councilName: string;
    resolver: (uprn: string) => Promise<ISchedule[]>;
  }
> = {
  '2741': {
    councilName: 'City of York Council',
    resolver: getYorkSchedule,
  },
  '5450': {
    councilName: 'London Borough of Harrow',
    resolver: getHarrowSchedule,
  },
  '520': {
    councilName: 'Huntingdonshire District Council',
    resolver: getHDCSchedule,
  },
  '5060': {
    councilName: 'London Borough of Barking and Dagenham',
    resolver: getBarkingSchedule,
  },
  '1750': {
    councilName: 'Rushmoor Borough Council',
    resolver: getRushmoorSchedule,
  },
};
