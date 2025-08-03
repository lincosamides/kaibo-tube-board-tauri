import { Line } from "@/models/tfl";

export function getLineColor(line: Line) {
    switch (line.id) {
        case 'northern':
            return 'bg-black text-white border border-white';
        case 'piccadilly':
            return 'bg-blue-600 text-white border border-blue-600';
        case 'district':
            return 'bg-green-600 text-white border border-green-600';
        case 'hammersmith-city':
            return 'bg-pink-400 text-white border border-pink-400';
        case 'metropolitan':
            return 'bg-purple-600 text-white border border-purple-600';
        case 'circle':
            return 'bg-yellow-500 text-white border border-yellow-500';
        case 'central':
            return 'bg-red-600 text-white border border-red-600';
        case 'victoria':
            return 'bg-sky-400 text-white border border-sky-400';
        case 'jubilee':
            return 'bg-slate-400 text-white border border-slate-400';
        case 'waterloo-city':
            return 'bg-teal-600 text-white border border-teal-600';
        case 'bakerloo':
            return 'bg-yellow-800 text-white border border-yellow-800';
        default:
            return 'bg-black text-white border border-white';
    }
}