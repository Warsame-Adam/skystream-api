import axios from "axios";
import dotenv from "dotenv";

import path from "path";

import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI;
import FormData from "form-data";
import fs from "fs";
import { addDays, format } from "date-fns";
import mongoose from "mongoose";
import FlightModel from "../models/Flight.model.mjs";

if (!MONGO_URI) {
  console.error("Error: MONGO_URI is not defined in the .env file");
  process.exit(1);
}





const API_URL = "http://localhost:5000/api/flights/dev-flight-123";
const AUTH_TOKEN = "";
const DRY_RUN = false; 

const london = {
  cityId: "67d86558ca8eef732fe21afb",
  airportId: "67dadaa4018d2d8b18e763e3",
};

const destinations = [
  { cityId: "67cb6220f260fe5c0d7a3a13", airportId: "67cb73dcd426a160e0cd6f70", name: "dubai" },
  { cityId: "67cb6220f260fe5c0d7a3a0f", airportId: "67cb70f8d426a160e0cd6f60", name: "rome" },
  { cityId: "67cb6220f260fe5c0d7a3a11", airportId: "67cb722ad426a160e0cd6f68", name: "edinburgh" },
  { cityId: "67cb6220f260fe5c0d7a3a14", airportId: "67cb7476d426a160e0cd6f74", name: "amsterdam" },
  { cityId: "67cb6220f260fe5c0d7a3a15", airportId: "67cb74e5d426a160e0cd6f78", name: "istanbul" },
  { cityId: "67cb6220f260fe5c0d7a3a10", airportId: "67cb71a6d426a160e0cd6f64", name: "cardiff" },
  { cityId: "67cb6220f260fe5c0d7a3a12", airportId: "67cb72c7d426a160e0cd6f6c", name: "dublin" },
  { cityId: "67cb6220f260fe5c0d7a3a0e", airportId: "67cb706cd426a160e0cd6f5c", name: "antalya" },
  { cityId: "67cb6220f260fe5c0d7a3a0d", airportId: "67cb6fedd426a160e0cd6f58", name: "sydney" },
  { cityId: "67cb6220f260fe5c0d7a3a16", airportId: "67cb754ed426a160e0cd6f7c", name: "bangkok" },
  { cityId: "67cb6220f260fe5c0d7a3a0c", airportId: "67cb6f24d426a160e0cd6f52", name: "athens" },
  { cityId: "67cb6220f260fe5c0d7a3a0b", airportId: "67cb6b153c2f78479cf03a8c", name: "paris" },
];

const flightDurationsFromLHR = {
  dubai: 6.83,
  rome: 2.5,
  edinburgh: 1.5,
  amsterdam: 1.33,
  istanbul: 3.75,
  cardiff: 1,
  dublin: 1.33,
  antalya: 4.25,
  sydney: 21,
  bangkok: 11.42,
  athens: 3.67,
  paris: 1.25,
};

const airlineIds = [
  "67cb7634d426a160e0cd6f81",
  "67cb7675d426a160e0cd6f85",
  "67cb76aad426a160e0cd6f89",
  "67cb76e5d426a160e0cd6f8d",
  "67cb7728d426a160e0cd6f91",
  "67cb777ad426a160e0cd6f95",
  "67cb77a5d426a160e0cd6f99",
];

const classTypes = [
  { classTypeId: "67cb7922d426a160e0cd6fa0", label: "Economy", min: 80, max: 150, vacancy: 20 },
  { classTypeId: "67cb79dfd13e0b5f35b14795", label: "Premium", min: 200, max: 350, vacancy: 30 },
  { classTypeId: "67cb79ead13e0b5f35b14799", label: "Business", min: 400, max: 600, vacancy: 15 },
  { classTypeId: "67cb79f4d13e0b5f35b1479d", label: "First", min: 650, max: 900, vacancy: 10 },
];

function randomTime(startHour = 6, endHour = 20) {
  const hour = Math.floor(Math.random() * (endHour - startHour + 1)) + startHour;
  const minute = [0, 15, 30, 45][Math.floor(Math.random() * 4)];
  return { hour, minute };
}

function getRandomStop(excludeIds) {
  const options = destinations.filter(dest => !excludeIds.includes(dest.cityId));
  return options[Math.floor(Math.random() * options.length)];
}

function getRandomFrequency() {
  const allDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  return allDays.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3) + 2);
}

function generatePrice(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateFlights() {
  const flights = [];
  let flightNumber = 1000;
  let currentDate = addDays(new Date(), 5);
  const endDate = currentDate;


  while (currentDate <= endDate) {
    for (const destination of destinations) {
      const numFlightsToday = 3;

      for (let i = 0; i < numFlightsToday; i++) {
        const useSameAirline = Math.random() < 0.8;
        const outboundAirline = airlineIds[Math.floor(Math.random() * airlineIds.length)];
        const returnAirline = useSameAirline ? outboundAirline : airlineIds[Math.floor(Math.random() * airlineIds.length)];

        const isTwoWay = Math.random() < 0.7;
        const outboundDirect = Math.random() < 0.7;
        const returnDirect = isTwoWay ? Math.random() < 0.7 : undefined;

        const { hour: depHour, minute: depMin } = randomTime();
        const departure = new Date(currentDate.setHours(depHour, depMin));

        let baseDuration = flightDurationsFromLHR[destination.name.toLowerCase()] || 4;
        if (!outboundDirect) baseDuration += 2;
        const arrival = new Date(departure.getTime() + baseDuration * 60 * 60 * 1000);

        const returnDeparture = isTwoWay ? new Date(departure.getTime() + 7 * 24 * 60 * 60 * 1000) : null;
        let returnArrival = null;
        if (isTwoWay) {
          let returnDuration = baseDuration;
          if (returnDirect === false) returnDuration += 2;
          returnArrival = new Date(returnDeparture.getTime() + returnDuration * 60 * 60 * 1000);
        }

        const extraClasses = classTypes.filter(c => c.label !== "Economy");
        const selectedExtras = extraClasses.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * 3));
        const selectedClasses = [
          {
            classTypeId: classTypes[0].classTypeId,
            price: generatePrice(classTypes[0].min, classTypes[0].max),
            vacancy: classTypes[0].vacancy,
          },
          ...selectedExtras.map(c => ({
            classTypeId: c.classTypeId,
            price: generatePrice(c.min, c.max),
            vacancy: c.vacancy,
          }))
        ];

        const randomFreq = getRandomFrequency();

        const flight = {
          flightNumber: `SKY-${flightNumber++}`,
          outboundAirline,
          returnAirline: isTwoWay ? returnAirline : undefined,
          twoWay: isTwoWay,
          location: {
            outboundDirect,
            returnDirect,
            departureCity: london.cityId,
            departureAirport: london.airportId,
            arrivalCity: destination.cityId,
            arrivalAirport: destination.airportId,
          },
          schedule: {
            departureTime: departure.toISOString(),
            arrivalTime: arrival.toISOString(),
            returnDepartureTime: isTwoWay ? returnDeparture.toISOString() : undefined,
            returnArrivalTime: isTwoWay ? returnArrival.toISOString() : undefined,
          },
          frequency: randomFreq,
          classes: selectedClasses,
          imageName: `${destination.name.toLowerCase()}.png`,
        };

        if (!outboundDirect) {
          const stop = getRandomStop([london.cityId, destination.cityId]);
          flight.location.outboundStops = [{ stopAtCity: stop.cityId, stopAtAirport: stop.airportId }];
        }
        if (isTwoWay && returnDirect === false) {
          const stop = getRandomStop([london.cityId, destination.cityId]);
          flight.location.returnStops = [{ stopAtCity: stop.cityId, stopAtAirport: stop.airportId }];
        }

        flights.push(flight);
      }
    }
    currentDate = addDays(currentDate, 1);
  }
  return flights;
}

async function createFlight(flight) {
  console.log("🟢 Starting createFlight for:", flight.flightNumber);

  const form = new FormData();

  console.log("🟢 About to append image:", `./src/public/files/flights/${flight.imageName}`);
  form.append("image", fs.createReadStream(`./src/public/files/flights/${flight.imageName}`));
  console.log("🟢 Appended image successfully");

  console.log("🟢 OutboundAirline:", flight.outboundAirline);
  form.append("outboundAirline", flight.outboundAirline);

  console.log("🟢 twoWay:", flight.twoWay);
  form.append("twoWay", flight.twoWay.toString());

  if (flight.twoWay) {
    console.log("🟢 returnAirline:", flight.returnAirline);
    form.append("returnAirline", flight.returnAirline);
  }

  console.log("🟢 flightNumber:", flight.flightNumber);
  form.append("flightNumber", flight.flightNumber);

  console.log("🟢 Location object:", flight.location);
  Object.entries(flight.location).forEach(([key, value]) => {
    console.log("🔸 location key:", key, "value:", value);
  
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        console.log("   🔸 array index:", i, "value:", v);
        Object.entries(v).forEach(([subKey, subVal]) => {
          console.log("     🔹 subVal about to append:", subKey, subVal);
  
          
          if (typeof subVal === "boolean") {
            subVal = subVal.toString();
          }
  
          if (typeof subVal !== "string") {
            console.log("❌ Non-string location subVal detected:", subVal);
          }
  
          form.append(`location[${key}][${i}][${subKey}]`, subVal);
        });
      });
    } else if (value !== undefined) {
      console.log("🔸 appending single location value:", key, "=", value);
  
      
      if (typeof value === "boolean") {
        value = value.toString();
      }
  
      if (typeof value !== "string") {
        console.log("❌ Non-string location value detected:", value);
      }
  
      form.append(`location[${key}]`, value);
    }
  });

  console.log("🟢 Schedule:", flight.schedule);
  Object.entries(flight.schedule).forEach(([key, value]) => {
    console.log("🔸 schedule.", key, "=", value);
    if (value) form.append(`schedule[${key}]`, value);
  });

  console.log("🟢 Frequency:", flight.frequency);
  flight.frequency.forEach((day, i) => {
    console.log("🔸 frequency.", i, "=", day);
    form.append(`frequency[${i}]`, day);
  });

  console.log("🟢 Classes:", flight.classes);
  flight.classes.forEach((cls, i) => {
    console.log(`🔸 classes[${i}]:`, cls);
    form.append(`classes[${i}][classType]`, cls.classTypeId);
    console.log(`🟢 appended classType ${cls.classTypeId}`);

    console.log(`🟢 appended price ${cls.price}`);
    form.append(`classes[${i}][price]`, cls.price.toString());

    console.log(`🟢 appended vacancy ${cls.vacancy}`);
    form.append(`classes[${i}][vacancy]`, cls.vacancy.toString());
  });

  console.log("🟢 appending selfTransfer, externalURL, additionalInfo...");
  form.append("selfTransfer", "false");
  form.append("externalURL", "http://booking.com");
  form.append("additionalInfo", "Auto-generated flight");

  console.log("🟢 Done building form data for:", flight.flightNumber);


  try {
    const res = await axios.post(API_URL, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${AUTH_TOKEN}`,
      },
    });
    console.log(`✅ Created flight ${flight.flightNumber}`);
  } catch (err) {
    console.error(`❌ Failed flight ${flight.flightNumber}`, err.response?.data || err.message);
  }
}

(async () => {
    await mongoose.connect(MONGO_URI  ,{
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      
  const flights = generateFlights();

  if (DRY_RUN) {
    console.log("🔍 DRY RUN MODE: Showing sample flights to be uploaded...");
    console.log(flights.slice(0, 3));
    console.log(`✈️ Total flights generated: ${flights.length}`);
  } else {
    console.log("⏳ Deleting expired flights...");
    await FlightModel.deleteMany({ "schedule.departureTime": { $lt: new Date() } });
    console.log("✅ Old flights removed");

    for (let flight of flights) {
      await createFlight(flight);
    }
  }

  mongoose.disconnect();
})();
