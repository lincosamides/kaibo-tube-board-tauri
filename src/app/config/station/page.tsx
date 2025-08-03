'use client';
import { getTubeLines, getTubeStations } from "@/actions/tfl";
import { Separator } from "@/components/ui/separator";
import { getLineColor } from "@/lib/tls";
import { Line, StopPoint } from "@/models/tfl";
import { Undo2, Check, CircleX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const renderHeader = (selectedStation: StopPoint | null, confirmStation: () => void) => (
    <div className="bg-white text-black w-full flex items-center justify-between px-2 py-0.5 font-bold text-lg sticky top-0 z-10">
        <div>Change station</div>
        <div className="flex gap-1">
            <div className={`text-sm bg-green-600 text-white border border-green-600 px-1 py-0.5 rounded-md flex items-center justify-center ${selectedStation ? "cursor-pointer" : "cursor-not-allowed opacity-50"}`} onClick={confirmStation} aria-disabled={!selectedStation}>
                <Check size={24} />
                <span>Confirm</span>
            </div>
            <Link href="/" className="text-sm border border-black px-1 py-0.5 rounded-md flex items-center justify-center">
                <Undo2 size={24} />
                <span>Back</span>
            </Link>
        </div>
    </div>
);

export default function StationConfigPage() {
    const router = useRouter();
    const [lines, setLines] = useState<Line[]>([]);
    const [allStations, setAllStations] = useState<StopPoint[]>([]);
    const [stations, setStations] = useState<StopPoint[]>([]);
    const [selectedLineIds, setSelectedLineIds] = useState<string[]>([]);
    const [selectedStation, setSelectedStation] = useState<StopPoint | null>(null);

    const toggleLineSelection = (lineId: string) => {
        setSelectedLineIds((prev) => {
            if (prev.includes(lineId)) {
                return prev.filter((id) => id !== lineId);
            } else {
                return [...prev, lineId];
            }
        });
    };

    const selectStation = (station: StopPoint) => {
        if (selectedStation?.id === station.id) {
            setSelectedStation(null);
            return;
        }
        setSelectedStation(station);
    };

    const confirmStation = () => {
        if (selectedStation) {
            router.push("/?stationId=" + selectedStation.id);
        }
    };

    useEffect(() => {
        const fetchStations = async () => {
            const fetchedStations = await getTubeStations();
            fetchedStations.sort((a, b) => a.name.localeCompare(b.name));
            setStations(fetchedStations);
            setAllStations(fetchedStations);
        };
        const fetchLines = async () => {
            const fetchedLines = await getTubeLines();
            fetchedLines.sort((a, b) => a.name.localeCompare(b.name));
            setLines(fetchedLines);
        };
        fetchStations();
        fetchLines();
    }, []);

    useEffect(() => {
        if (selectedLineIds.length > 0) {
            const filteredStations = allStations.filter((station) => {
                const stationLineIds = station.lines.map((line) => line.id);
                return selectedLineIds.every((lineId) => stationLineIds.includes(lineId));
            });
            setStations(filteredStations);
        } else {
            setStations(allStations);
        }
    }, [selectedLineIds, allStations]);

    return (
        <div className="flex flex-col w-[480px] h-[320px] overflow-y-scroll overflow-x-hidden bg-black text-white">
            {renderHeader(selectedStation, confirmStation)}
            <div className="flex flex-col p-2 gap-2">
                <div className="flex items-center gap-2">
                    <div className="font-bold">Selected station:</div>
                    <div>{selectedStation ? <div className="flex items-center gap-1"><span>{selectedStation.name}</span><CircleX size={16} className="cursor-pointer" onClick={() => setSelectedStation(null)} aria-label="Remove selected station" />   </div> : "N/A"}</div>
                </div>
                <div className="font-bold">Filter by line:</div>
                <div className="flex flex-wrap gap-1">
                    {lines.map((line) => (
                        <div key={line.id} className={`py-0.5 px-1 text-xs font-semibold cursor-pointer ${selectedLineIds.includes(line.id) ? "opacity-100" : "opacity-50"} ${getLineColor(line)}`} onClick={() => toggleLineSelection(line.id)}>
                            {line.name}
                        </div>
                    ))}
                </div>
                <Separator />
                <div className="font-bold">Stations:</div>
                <div className="flex flex-wrap gap-1">
                    {stations.map((station) => (
                        <div key={station.id} id={station.id} onClick={() => selectStation(station)} className={`text-xs font-semibold cursor-pointer border border-transparent ${selectedStation?.id === station.id ? "border-white bg-black text-white" : "bg-white text-black hover:border-white hover:bg-black hover:text-white"}`}>
                            <div className="w-full flex items-center">
                                {station.lines.map((line) => (
                                    <div key={line.id} className={`p-0.5 grow-1 ${getLineColor(line)}`}>
                                    </div>
                                ))}
                            </div>
                            <div className="py-0.5 px-1">{station.name}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
