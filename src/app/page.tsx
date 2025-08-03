'use client'
import { getArrivalsForStation, getStationById } from "@/lib/tfl-client";
import { checkInternetConnection } from "@/actions/network";
import { Arrival, StopPoint } from "@/models/tfl";
import { useEffect, useRef, useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation";
import { getLineColor } from "@/lib/tls";
import { Settings } from "lucide-react";
import Clock from 'react-live-clock';

import { Press_Start_2P } from 'next/font/google'
import TextType from "@/components/reactbits/TextType/TextType";
import Image from "next/image";

import KaiboAvatar1 from "@/assets/images/avatar1.png";
import KaiboAvatar2 from "@/assets/images/avatar2.png";
import BlurText from "@/components/reactbits/BlurText/BlurText";
import { Fireworks } from '@fireworks-js/react'
import type { FireworksHandlers } from '@fireworks-js/react'
import CurvedLoop from "@/components/reactbits/CurvedLoop/CurvedLoop";

const pressStart2P = Press_Start_2P({
  subsets: ['latin'],
  weight: '400',
})

interface TimeToAge {
  nextAge: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function renderBoardTitle(station: StopPoint) {
  return (
    <div className={`text-sm font-semibold cursor-pointer border border-transparent bg-white text-black ${pressStart2P.className}`}>
      <div className="w-full flex items-center">
        {station?.lines.map((line) => (
          <div key={line.id} className={`p-0.5 grow-1 ${getLineColor(line)}`}>
          </div>
        ))}
      </div>
      <div className="py-0.5 px-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={pressStart2P.className}>{station?.name}</span>
        </div>
        <Link href="/config/station" className="cursor-pointer">
          <Settings size={24} />
        </Link>
      </div>
    </div>
  )
}

function renderArrivalItem(arrival: Arrival, arrival_index: number, elapsedSeconds: number) {
  const timeRemaining = Math.max(0, arrival.timeToStation - elapsedSeconds);
  const hasArrived = timeRemaining <= 0;

  return (
    <div key={arrival_index} className="flex items-center justify-between text-yellow-400 p-1 border-b border-gray-700">
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold h-2 w-2 rounded-full ${getLineColor(arrival.line)}`}></span>
        <span className="text-xs">{arrival.towards}</span>
      </div>
      <div className="text-xs">
        {hasArrived ? (
          ''
        ) : timeRemaining >= 10 ? (
          `${Math.ceil(timeRemaining / 60)} min`
        ) : (
          ''
        )}
      </div>
    </div>
  )
}

function renderArrivalList(arrivals: Arrival[], elapsedSeconds: number) {
  return (
    <div className={`flex flex-col ${pressStart2P.className}`}>
      {arrivals.length > 0 ? (
        arrivals.map((arrival, arrival_index) => (
          renderArrivalItem(arrival, arrival_index, elapsedSeconds)
        ))
      ) : (
        <div className="p-2 text-xs text-gray-400">No arrivals available</div>
      )}
    </div>
  )
}

function renderBoardFooter(station: StopPoint | null, selectedPlatform: number, setSelectedPlatform: (platform: number) => void, isClient: boolean, board: number, setBoard: (board: number) => void) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center p-2 gap-2 text-yellow-400">
        {station && station.platformCount >= 2 && (
          <>
            <button
              onClick={() => setSelectedPlatform(selectedPlatform >= station.platformCount ? 1 : selectedPlatform + 1)}
              className={`text-sm hover:text-gray-300 focus:outline-none cursor-pointer ${pressStart2P.className}`}
            >
              Platform {selectedPlatform}
            </button>
            <span className={`text-xs ${pressStart2P.className}`}>-</span>
          </>
        )}
        {isClient &&
          <Clock className={`text-sm ${pressStart2P.className}`} format={'HH:mm:ss'} ticking={true} timezone={'Europe/London'} />}
      </div>
    </div>
  )
}

function getTimeToAge(birthdate: Date): TimeToAge {
  const now = new Date();
  const nextBirthday = new Date(now.getFullYear(), birthdate.getMonth(), birthdate.getDate(), birthdate.getHours(), birthdate.getMinutes(), birthdate.getSeconds());

  if (nextBirthday < now) {
    nextBirthday.setFullYear(nextBirthday.getFullYear() + 1);
  }

  const nextAge = nextBirthday.getFullYear() - birthdate.getFullYear();

  const timeToBirthday = nextBirthday.getTime() - now.getTime();
  const days = Math.floor(timeToBirthday / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeToBirthday % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeToBirthday % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeToBirthday % (1000 * 60)) / 1000);

  return {
    nextAge,
    days,
    hours,
    minutes,
    seconds
  }
}

function getTimeToAgeText(timeToAge: TimeToAge): string {
  const { nextAge, days, hours, minutes, seconds } = timeToAge;
  if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'} to your ${nextAge}th birthday`;
  }

  if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} to your ${nextAge}th birthday`;
  }

  if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} to your ${nextAge}th birthday`;
  }
  return `${seconds} ${seconds === 1 ? 'second' : 'seconds'} to your ${nextAge}th birthday`;
}

function getCongratText(timeToAge: TimeToAge): string {
  if (timeToAge?.days > 1) {
    return "Getting excited?"
  }
  if (timeToAge?.hours > 1) {
    return "Almost there!"
  }
  if (timeToAge?.minutes > 1) {
    return "Just a few minutes to go!"
  }
  return "Happy birthday!";
}

function renderNoInternet(timeToAge: TimeToAge | null, currentAvatar: number, fireworksRef: React.RefObject<FireworksHandlers | null>, showFireworks: boolean) {
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Fireworks - only visible when showFireworks is true */}
      {showFireworks && (<>
        <Fireworks
          ref={fireworksRef}
          options={{ opacity: 0.8 }}
          style={{
            top: 0,
            left: 0,
            width: '480px',
            height: '320px',
            position: 'absolute',
            zIndex: 10
          }}
        />
        <CurvedLoop
          marqueeText="Happy ✦ Birthday ✦ Kaibo! ✦ "
          speed={1}
          curveAmount={300}
          interactive={false}
        />
      </>)}

      {/* Main content - hidden during fireworks */}
      {!showFireworks && (
        <div className="text-center">
          {timeToAge?.days == 0 && timeToAge?.hours == 0 && timeToAge?.minutes == 0 && (<>
            <BlurText
              key={timeToAge.seconds}
              text={`${timeToAge.seconds}`}
              delay={150}
              animateBy="words"
              direction="top"
              className={`mb-8 font-bold transition-all duration-300 ${timeToAge.seconds <= 5 ? 'text-9xl' :
                  timeToAge.seconds <= 10 ? 'text-8xl' :
                    timeToAge.seconds <= 20 ? 'text-7xl' :
                      timeToAge.seconds <= 30 ? 'text-6xl' : 'text-5xl'
                }`}
            /></>
          )}
          {(timeToAge && (timeToAge?.days > 0 || timeToAge?.hours > 0 || timeToAge?.minutes > 0)) && (
            <div className="relative border border-white bg-black rounded-2xl px-6 py-4 shadow-lg max-w-sm mx-auto">
              {/* Speech bubble tail */}
              <div className="absolute bottom-0 right-8 w-0 h-0 border-l-[15px] border-r-[15px] border-t-[15px] border-l-transparent border-r-transparent border-t-white transform translate-y-full"></div>

              <TextType className={`text-xl font-semibold ${pressStart2P.className}`}
                text={["Hi, Kaibo!", timeToAge ? getTimeToAgeText(timeToAge) : "", timeToAge ? getCongratText(timeToAge) : ""]}
                typingSpeed={75}
                pauseDuration={1500}
                showCursor={true}
                cursorCharacter="_"
              />
            </div>
          )}
        </div>
      )}

      {/* Avatar - hidden during fireworks */}
      {!showFireworks && (
        <div className="absolute bottom-4 right-4">
          <div className="animate-[pulse-scale_2s_ease-in-out_infinite]">
            <Image
              src={currentAvatar === 0 ? KaiboAvatar1 : KaiboAvatar2}
              alt="Kaibo Avatar"
              width={80}
              height={80}
            />
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes pulse-scale {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0;
            transform: scale(0.9);
          }
        }
      `}</style>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={<div className="w-[480px] h-[320px] bg-black flex items-center justify-center text-white">Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const birthdate = new Date("2003-08-03T00:50:00+08:00");
  const searchParams = useSearchParams()
  const stationId = searchParams.get('stationId') || "940GZZLUHSD";

  const [isConnected, setIsConnected] = useState(false);
  const [timeToAge, setTimeToAge] = useState<TimeToAge | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState(0);
  const [showFireworks, setShowFireworks] = useState(false);
  const fireworksRef = useRef<FireworksHandlers>(null);

  const [isClient, setIsClient] = useState(false)
  const [station, setStation] = useState<StopPoint | null>(null);
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const [arrivalsTimestamp, setArrivalsTimestamp] = useState<number>(Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [selectedPlatform, setSelectedPlatform] = useState<number>(1);

  const [board, setBoard] = useState<number>(1);

  // Avatar switching effect - sync with animation cycle
  useEffect(() => {
    const avatarInterval = setInterval(() => {
      // Change avatar at 1 second mark (when animation is at 50% = transparent)
      setTimeout(() => {
        setCurrentAvatar(prev => prev === 0 ? 1 : 0);
      }, 1000); // 1 second delay = 50% of 2-second animation cycle
    }, 2000); // Switch every 2 seconds to match the animation duration

    return () => clearInterval(avatarInterval);
  }, []);

  useEffect(() => {
    if (isConnected) {
      const interval = setInterval(() => {
        const currentTimeToAge = getTimeToAge(birthdate);
        console.log("Current time to age:", currentTimeToAge);
        setTimeToAge(currentTimeToAge);

        // Trigger fireworks when countdown reaches 0
        if (currentTimeToAge.days === 0 &&
          currentTimeToAge.hours === 0 &&
          currentTimeToAge.minutes === 0 &&
          currentTimeToAge.seconds === 0) {
          setShowFireworks(true);

          // Hide fireworks after 1 minute (60000ms)
          setTimeout(() => {
            setShowFireworks(false);
          }, 60000);
        }
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeToAge(null);
    }
  }, [isConnected]);

  useEffect(() => {
    const updateInternetStatus = async () => {
      const internetStatus = await checkInternetConnection();
      setIsConnected(internetStatus);
    }
    updateInternetStatus();
    setIsClient(true)
  }, [])

  useEffect(() => {
    const fetchStation = async () => {
      try {
        const station = await getStationById(stationId);
        console.log("Fetched station:", station);
        setStation(station);

        // Set default platform based on platformCount
        if (station && station.platformCount >= 2) {
          setSelectedPlatform(1);
        }

        if (!isConnected) {
          setIsConnected(true);
        }
      } catch (error) {
        console.error("Failed to fetch station:", error);
        // Check if error is due to network issues
        const internetStatus = await checkInternetConnection();
        setIsConnected(internetStatus);
      }
    };
    fetchStation();
  }, [stationId]);

  useEffect(() => {
    const fetchArrivals = async () => {
      try {
        const arrivals = await getArrivalsForStation(stationId, selectedPlatform);
        console.log("Fetched arrivals:", arrivals);
        setArrivals(arrivals);
        setArrivalsTimestamp(Date.now());
        setElapsedSeconds(0);
        if (!isConnected) {
          setIsConnected(true);
        }
      } catch (error) {
        console.error("Failed to fetch arrivals:", error);
        // Check if error is due to network issues
        const internetStatus = await checkInternetConnection();
        setIsConnected(internetStatus);
      }
    };

    if (station) {
      // Fetch arrivals immediately
      fetchArrivals();

      // Set up interval to fetch arrivals every minute
      const intervalId = setInterval(fetchArrivals, 60000); // 60000ms = 1 minute

      // Cleanup interval on component unmount or when station changes
      return () => clearInterval(intervalId);
    }
  }, [station, stationId, selectedPlatform]);

  // Real-time countdown effect
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      const newElapsed = Math.floor((Date.now() - arrivalsTimestamp) / 1000);
      setElapsedSeconds(newElapsed);

      // Check if any train has arrived (timeToStation <= elapsed time)
      const hasArrivedTrain = arrivals.some(arrival => arrival.timeToStation <= newElapsed);
      if (hasArrivedTrain) {
        // Fetch new arrivals when a train arrives
        const fetchArrivals = async () => {
          try {
            const newArrivals = await getArrivalsForStation(stationId, selectedPlatform);
            console.log("Fetched arrivals due to train arrival:", newArrivals);
            setArrivals(newArrivals);
            setArrivalsTimestamp(Date.now());
            setElapsedSeconds(0);
          } catch (error) {
            console.error("Failed to fetch arrivals on train arrival:", error);
            // Check if error is due to network issues
            const internetStatus = await checkInternetConnection();
            setIsConnected(internetStatus);
          }
        };
        fetchArrivals();
      }
    }, 1000); // Update every second

    return () => clearInterval(countdownInterval);
  }, [arrivals, arrivalsTimestamp, stationId, selectedPlatform]);

  const isAnyTrainApproaching = arrivals.some(arrival => {
    const timeRemaining = Math.max(0, arrival.timeToStation - elapsedSeconds);
    return timeRemaining <= 10 && timeRemaining > 0;
  });

  return (
    <div className="w-[480px] h-[320px] text-white flex flex-col cursor-none">
      {board === 1 && isConnected ? (
        <>
          {station && renderBoardTitle(station)}
          <div className="flex-1">
            {renderArrivalList(arrivals, elapsedSeconds)}
            <div className="flex items-center justify-center p-2 bg-black">
              <span className={`animate-pulse ${isAnyTrainApproaching ? 'text-yellow-400' : 'text-transparent'} text-xs ${pressStart2P.className}`}>
                *** STAND BACK - TRAIN APPROACHING ***
              </span>
            </div>
          </div>
          {renderBoardFooter(station, selectedPlatform, setSelectedPlatform, isClient, board, setBoard)}
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-black">
          {renderNoInternet(timeToAge, currentAvatar, fireworksRef, showFireworks)}
        </div>
      )}

      <button className={`w-full flex items-center justify-center p-0.5 text-xs bg-white text-black ${pressStart2P.className}`} 
          onClick={() => setBoard(board === 1 ? 2 : 1)}>
          {board === 1 ? 'Kaibo\'s Tube Board' : 'Let\'s Celebrate Kaibo\'s Birthday!'}
      </button>
    </div>
  );
}
