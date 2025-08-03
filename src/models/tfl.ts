export interface Platform {
  indicator: string;
}

export interface StopPoint {
  id: string;
  name: string;
  lines: Line[];
  platformCount: number;
}

export interface Line {
  id: string;
  name: string;
}

export interface Arrival {
  id: string;
  line: Line;
  direction: string;
  towards: string;
  timeToStation: number;
}