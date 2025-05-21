import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { addDays } from "date-fns";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import "../utils/cloudinary.mjs";
import FlightModel from "../models/Flight.model.mjs";

////////////////////////////////////////////////////////////////////////////////
// CONFIG & CONSTANTS
////////////////////////////////////////////////////////////////////////////////
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) throw new Error("MONGO_URI missing in .env");

// how far out we seed (days from today)…
const START_OFFSET_DAYS = 3;
// window size in days
const WINDOW_DAYS       = 30;
// how many variants per combo
const FLIGHTS_PER_COMBO = 3;
// chance each leg is direct
const DIRECT_PROBABILITY = 0.7;

////////////////////////////////////////////////////////////////////////////////
// YOUR DATA (add all of your destinations here!)
////////////////////////////////////////////////////////////////////////////////
const london = {
  cityId:    "67d86558ca8eef732fe21afb",
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
  dubai:    6.83, rome:    2.5,   edinburgh: 1.5,
  amsterdam:1.33, istanbul:3.75,  cardiff:   1,
  dublin:   1.33, antalya: 4.25,  sydney:   21,
  bangkok: 11.42, athens:  3.67,  paris:    1.25,
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
  { classTypeId: "67cb7922d426a160e0cd6fa0", label:"Economy", min:  80, max: 150, vacancy:20 },
  { classTypeId: "67cb79dfd13e0b5f35b14795", label:"Premium", min: 200, max: 350, vacancy:30 },
  { classTypeId: "67cb79ead13e0b5f35b14799", label:"Business",min: 400, max: 600, vacancy:15 },
  { classTypeId: "67cb79f4d13e0b5f35b1479d",  label:"First",   min: 650, max: 900, vacancy:10 },
];

////////////////////////////////////////////////////////////////////////////////
// HELPERS
////////////////////////////////////////////////////////////////////////////////
const randInt   = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const random    = arr => arr[randInt(0, arr.length - 1)];
const minNights = hrs => hrs <= 2 ? 1 : hrs <= 5 ? 2 : 3;
const daysOfWeek = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

////////////////////////////////////////////////////////////////////////////////
// UPLOAD IMAGES
////////////////////////////////////////////////////////////////////////////////
const imgCache = {};
async function uploadCityImages() {
  for (const dest of destinations) {
    const local = `./src/public/files/flights/${dest.name}.png`;
    if (!fs.existsSync(local)) {
      throw new Error(`Missing image file: ${local}`);
    }
    const { secure_url } = await cloudinary.uploader.upload(local, {
      folder:    "flights",
      public_id: dest.name,
      overwrite: false,
    });
    imgCache[dest.name] = secure_url;
  }
}


////////////////////////////////////////////////////////////////////////////////
// GENERATE FLIGHTS
////////////////////////////////////////////////////////////////////////////////
function generateFlights() {
  const flights = [];
  let seq = 1000;

  const startDate = addDays(new Date(), START_OFFSET_DAYS);
  const endDate   = addDays(startDate, WINDOW_DAYS - 1);

  for (let dep = new Date(startDate); dep <= endDate; dep = addDays(dep, 1)) {
    const depName = daysOfWeek[dep.getDay()];

    for (const dest of destinations) {
      const dur = flightDurationsFromLHR[dest.name];

      // 1) ONE-WAY flights
      for (let i = 0; i < FLIGHTS_PER_COMBO; i++) {
        const outboundDirect = Math.random() < DIRECT_PROBABILITY;
        const outAir = random(airlineIds);
        const departure = new Date(dep);
        departure.setHours(randInt(6,20), [0,15,30,45][randInt(0,3)],0,0);
        const arrival = new Date(
          departure.getTime() + (dur + (outboundDirect?0:2)) * 3600000
        );

        const flight = {
          flightNumber:    `SKY-${seq++}`,
          outboundAirline: outAir,
          twoWay:          false,
          location: {
            departureCity:    london.cityId,
            departureAirport: london.airportId,
            arrivalCity:      dest.cityId,
            arrivalAirport:   dest.airportId,
            outboundDirect,
          },
          schedule: {
            departureTime: departure,
            arrivalTime:   arrival,
          },
          frequency:       [depName],
          classes: [
            {
              classType: classTypes[0].classTypeId,
              price:     randInt(classTypes[0].min, classTypes[0].max),
              vacancy:   classTypes[0].vacancy,
            },
            ...classTypes
              .filter(c => c.label!=="Economy")
              .sort(() => 0.5-Math.random())
              .slice(0, randInt(0,2))
              .map(c=>({
                classType:c.classTypeId,
                price:    randInt(c.min,c.max),
                vacancy:  c.vacancy,
              }))
          ],
          image:           imgCache[dest.name],
          destinationName: dest.name,
          selfTransfer:    false,
          externalURL:     "http://booking.com",
          additionalInfo:  "Auto-generated flight",
        };

        if (!outboundDirect) {
          const stop = random(
            destinations.filter(d=>d.cityId!==london.cityId&&d.cityId!==dest.cityId)
          );
          flight.location.outboundStops = [{
            stopAtCity:    stop.cityId,
            stopAtAirport: stop.airportId,
          }];
        }

        flights.push(flight);
      }

      // 2) TWO-WAY flights: ALWAYS generate for every valid return day
      const earliestReturn = minNights(dur);
      for (let gap = earliestReturn; ; gap++) {
        const rtnDay = addDays(dep, gap);
        if (rtnDay > endDate) break;
        const rtnName = daysOfWeek[rtnDay.getDay()];

        for (let i = 0; i < FLIGHTS_PER_COMBO; i++) {
          const outboundDirect = Math.random() < DIRECT_PROBABILITY;
          const returnDirect   = Math.random() < DIRECT_PROBABILITY;
          const outAir         = random(airlineIds);
          const rtnAir         = Math.random()<0.8?outAir:random(airlineIds);

          // outbound
          const departure = new Date(dep);
          departure.setHours(randInt(6,20), [0,15,30,45][randInt(0,3)],0,0);
          const arrival = new Date(
            departure.getTime() + (dur + (outboundDirect?0:2)) * 3600000
          );
          // return
          const rtnDep = new Date(rtnDay);
          rtnDep.setHours(randInt(6,20), [0,15,30,45][randInt(0,3)],0,0);
          const rtnArr = new Date(
            rtnDep.getTime() + (dur + (returnDirect?0:2)) * 3600000
          );

          const flight = {
            flightNumber:     `SKY-${seq++}`,
            outboundAirline:  outAir,
            returnAirline:    rtnAir,
            twoWay:           true,
            location: {
              departureCity:    london.cityId,
              departureAirport: london.airportId,
              arrivalCity:      dest.cityId,
              arrivalAirport:   dest.airportId,
              outboundDirect,
              returnDirect,
            },
            schedule: {
              departureTime:      departure,
              arrivalTime:        arrival,
              returnDepartureTime:rtnDep,
              returnArrivalTime:  rtnArr,
            },
            frequency:       [depName, rtnName],
            classes: [
              {
                classType: classTypes[0].classTypeId,
                price:     randInt(classTypes[0].min, classTypes[0].max),
                vacancy:   classTypes[0].vacancy,
              },
              ...classTypes
                .filter(c=>c.label!=="Economy")
                .sort(()=>0.5-Math.random())
                .slice(0,randInt(0,2))
                .map(c=>({
                  classType:c.classTypeId,
                  price:    randInt(c.min,c.max),
                  vacancy:  c.vacancy,
                }))
            ],
            image:           imgCache[dest.name],
            destinationName: dest.name,
            selfTransfer:    false,
            externalURL:     "http://booking.com",
            additionalInfo:  "Auto-generated flight",
          };

          if (!outboundDirect) {
            const stop = random(
              destinations.filter(d=>d.cityId!==london.cityId&&d.cityId!==dest.cityId)
            );
            flight.location.outboundStops = [{
              stopAtCity:    stop.cityId,
              stopAtAirport: stop.airportId,
            }];
          }
          if (!returnDirect) {
            const stop = random(
              destinations.filter(d=>d.cityId!==dest.cityId&&d.cityId!==london.cityId)
            );
            flight.location.returnStops = [{
              stopAtCity:    stop.cityId,
              stopAtAirport: stop.airportId,
            }];
          }

          flights.push(flight);
        }
      }
    }
  }

  return flights;
}

////////////////////////////////////////////////////////////////////////////////
// MAIN
////////////////////////////////////////////////////////////////////////////////
;(async () => {
  console.log("Uploading city images…");
  await uploadCityImages();

  console.log("Generating flights…");
  const docs = generateFlights();
  console.log(`✅ Generated ${docs.length} flights`);

  await mongoose.connect(MONGO_URI, { useNewUrlParser:true, useUnifiedTopology:true });
  await FlightModel.deleteMany({ "schedule.departureTime": { $lt: new Date() } });
  await FlightModel.insertMany(docs, { ordered: false });
  await mongoose.disconnect();

  console.log("🏁 Seed complete");
})();