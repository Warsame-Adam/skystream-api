import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import hotelBaseData from "../hotelBaseData.mjs";
import { addDays } from "date-fns";
import "../utils/cloudinary.mjs";
import { v2 as cloudinary } from "cloudinary";
import reviewPool from "../reviewPool.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const API_BASE = "http://localhost:5000/api";
const DRY_RUN = false;
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const providers = [
  { site: "Booking.com", siteLogo: "https://cdn.worldvectorlogo.com/logos/bookingcom-1.svg" },
  { site: "Expedia", siteLogo: "https://cdn.worldvectorlogo.com/logos/expedia.svg" },
  { site: "Trip.com", siteLogo: "https://ak-d.tripcdn.com/images/05E5p12000cga1phzA0ED.webp" },
  {
    site: "Agoda",
    siteLogo: "https://cdn.worldvectorlogo.com/logos/agoda-1.svg", // ✅ SVG
  },
  {
    site: "Hotels.com",
    siteLogo: "https://upload.wikimedia.org/wikipedia/commons/3/3c/Hotels.com_logo.svg"
  }

];

const cityInfoMap = {
  "Amsterdam": { cityCode: "AMS", countryCode: "NL" },
  "Antalya": { cityCode: "AYT", countryCode: "TR" },
  "Athens": { cityCode: "ATH", countryCode: "GR" },
  "Bangkok": { cityCode: "BKK", countryCode: "TH" },
  "Cardiff": { cityCode: "CWL", countryCode: "UK" },
  "Dublin": { cityCode: "DUB", countryCode: "IE" },
  "Edinburgh": { cityCode: "EDI", countryCode: "UK" },
  "Istanbul": { cityCode: "IST", countryCode: "TR" },
  "London": { cityCode: "LON", countryCode: "UK" },
  "Paris": { cityCode: "PAR", countryCode: "FR" },
  "Rome": { cityCode: "ROM", countryCode: "IT" },
  "Sydney": { cityCode: "SYD", countryCode: "AU" },
  "Dubai": { cityCode: "DXB", countryCode: "AE" }

};

 



const cityPriceMultipliers = {
  Dubai: 1.3, Paris: 1.2, London: 1.2, Sydney: 1.1,
  Rome: 0.9, Amsterdam: 1.1, Dublin: 1.0, Athens: 0.9,
  Cardiff: 0.9, Edinburgh: 1.0, Istanbul: 0.9,
  Antalya: 0.7, Bangkok: 0.7,
};

const getMultiplierForCity = (city) => cityPriceMultipliers[city] || 1;

const roomTypesOrdered = [
  "Single Room", "Double Room", "Twin Room", "Triple Room",
  "Family Room", "Deluxe Room", "Superior Room",
  "Junior Suite", "Presidential Suite",
];

const roomTypeDefaults = {
  "Single Room": { maxAdults: 1, maxChildren: 0 },
  "Double Room": { maxAdults: 2, maxChildren: 1 },
  "Twin Room": { maxAdults: 2, maxChildren: 0 },
  "Triple Room": { maxAdults: 3, maxChildren: 1 },
  "Family Room": { maxAdults: 2, maxChildren: 2 },
  "Deluxe Room": { maxAdults: 2, maxChildren: 1 },
  "Superior Room": { maxAdults: 2, maxChildren: 1 },
  "Junior Suite": { maxAdults: 2, maxChildren: 2 },
  "Presidential Suite": { maxAdults: 4, maxChildren: 2 },
};


const amenityMatrix = {
  5: { wifi: 1, airCondition: 0.95, fitnessCenter: 0.85,
       swimmingPool: 0.75, parking: 0.70,
       deskSupport: 0.95, restaurant: 0.90, nonSmoking: 0.90 },
  4: { wifi: 1, airCondition: 0.80, fitnessCenter: 0.55,
       swimmingPool: 0.40, parking: 0.50,
       deskSupport: 0.80, restaurant: 0.60, nonSmoking: 0.80 },
  3: { wifi: 1, airCondition: 0.40, fitnessCenter: 0.15,
       swimmingPool: 0.10, parking: 0.30,
       deskSupport: 0.50, restaurant: 0.25, nonSmoking: 0.70 },
};

const getHotelStarLevel = (folder) => {
  if (["hotel1", "hotel2"].includes(folder)) return 5;
  if (["hotel3", "hotel4", "hotel5"].includes(folder)) return 4;
  return 3;
};

const getCardiffStarLevel = (city, folder) => city === "Cardiff"
  ? (["hotel1", "hotel2", "hotel3", "hotel4"].includes(folder) ? 4 : 3)
  : getHotelStarLevel(folder);

const randomBool = (weight = 0.5) => Math.random() < weight;
const randomPick = (arr, count = 1) => arr.sort(() => 0.5 - Math.random()).slice(0, count);

const getImagesFromCloudinary = async (city, folder) => {
  const fullFolder = `hotels/${city}/${folder}`;
  const result = await cloudinary.search
    .expression(`folder:${fullFolder}`)
    .sort_by("public_id", "asc")
    .max_results(30)
    .execute();
  return result.resources.map((img) => img.secure_url);
};

const generateDescription = (starLevel) => {
  if (starLevel === 5) {
    return randomPick([
      "Experience world-class luxury and impeccable service.",
      "Premium comfort in the heart of the city.",
      "An elegant retreat for the discerning traveler.",
      "Exquisite interiors and breathtaking views await.",
    ])[0];
  } else if (starLevel === 4) {
    return randomPick([
      "Relax in style and enjoy fantastic amenities.",
      "A great blend of quality and affordability.",
      "Comfortable, stylish, and well located.",
      "Modern rooms and great service guaranteed.",
    ])[0];
  } else {
    return randomPick([
      "Affordable comfort for every traveler.",
      "Clean, simple, and welcoming.",
      "All essentials covered for a cozy stay.",
      "A reliable choice for budget-conscious guests.",
    ])[0];
  }
};

const pickAmenities = (star) => {
  const probs = amenityMatrix[star];
  const obj = {};
  for (const key in probs) obj[key] = Math.random() < probs[key];
  obj.wifi = true;                 // force wifi 100 %
  return obj;
};

const baseRoomPrice = (roomIndex, starLevel, cityMultiplier) => {
  const base = 40 + roomIndex * 20;
  const starAdj = 1 + (starLevel - 3) * 0.25;
  return Math.round(base * starAdj * cityMultiplier);
};

const createHotel = async (hotelData) => {
  if (DRY_RUN) {
    console.log("🛎️ DRY RUN - Would create hotel:", hotelData.name);
    return { _id: uuidv4() };
  }
  const res = await axios.post(`${API_BASE}/hotels`, hotelData);
  return res.data.data;
};

const addReviews = async (hotelId, starLevel) => {
  let reviews = [];
  if (starLevel === 5) {
    reviews = [...randomPick(reviewPool.filter(r => r.rating === 5), 4), ...randomPick(reviewPool.filter(r => r.rating === 4), 1)];
  } else if (starLevel === 4) {
    reviews = [...randomPick(reviewPool.filter(r => r.rating === 4), 4), ...randomPick(reviewPool.filter(r => r.rating === 3), 1)];
  } else {
    reviews = [...randomPick(reviewPool.filter(r => r.rating === 3), 3), ...randomPick(reviewPool.filter(r => r.rating === 2), 2)];
  }
  if (!DRY_RUN) await axios.post(`${API_BASE}/hotels/new-review/${hotelId}`, reviews);
};

const addProvidersAndDeals = async (hotelId, starLevel, cityName) => {
  const cityMultiplier = getMultiplierForCity(cityName);
  const providersToUse = randomPick(providers, Math.floor(Math.random() * 2) + 2);

  for (let provider of providersToUse) {
    const { data } = await axios.post(`${API_BASE}/hotels/new-deal-provider/${hotelId}`, provider);
    const providerId = data._id;
    if (!providerId) continue;

    for (let i = 0; i < roomTypesOrdered.length; i++) {
      const type = roomTypesOrdered[i];
      const defaults = roomTypeDefaults[type];
      const price = baseRoomPrice(i, starLevel, cityMultiplier);
      const daysFromNow = Math.floor(Math.random() * 5) + 2;
      const length = Math.floor(Math.random() * 21) + 10;

      const deal = {
        type,
        pricePerNight: price,
        maxPersonAllowed: defaults.maxAdults + defaults.maxChildren,
        maxAdults: defaults.maxAdults,
        maxChildren: defaults.maxChildren,
        maxGuests: defaults.maxAdults + defaults.maxChildren,
        breakfastIncluded: randomBool(starLevel >= 4 ? 0.8 : 0.4),
        freeCancellation: randomBool(starLevel >= 4 ? 0.8 : 0.5),
        availableFrom: addDays(new Date(), daysFromNow),
        availableTo: addDays(new Date(), daysFromNow + length),
        bookingUrl: "https://booking.com",
      };

      await axios.post(`${API_BASE}/hotels/new-deal/${hotelId}/deals/${providerId}`, deal);
    }
  }
};

const runSeeder = async () => {
  for (let hotel of hotelBaseData) {
    try {
      const rawUrls = await getImagesFromCloudinary(hotel.cityName, hotel.folder);
      const imagesNumeric = rawUrls.filter((u) => /\/image\d+/.test(u));
      imagesNumeric.sort((a, b) =>
        parseInt(a.split("/").pop().match(/^image(\d+)/)[1]) -
        parseInt(b.split("/").pop().match(/^image(\d+)/)[1])
      );
      const [cover, ...images] = imagesNumeric;
      


      const starLevel = getCardiffStarLevel(hotel.cityName, hotel.folder);
      const amenities = pickAmenities(starLevel);
      const { cityCode, countryCode } = cityInfoMap[hotel.cityName] || {};

      const payload = {
        name: hotel.name,
        description: generateDescription(starLevel),
        starRating: starLevel,
        address: hotel.address,
        city: hotel.cityId,
        images,
        cover,
        location: {
          type: "Point",
          coordinates: hotel.coordinates,
          cityCode,
          countryCode,
        },
        contact: hotel.contact,
        amenities,
        
        policies: {
          checkIn: randomPick(["12:00", "13:00", "14:00"])[0],
          checkOut: randomPick(["21:00", "22:00", "23:00"])[0],
          breakfastAvailable: true,
          petsAllowed: true,
          kidsAllowed: true,
        },
      };

      const created = await createHotel(payload);
      if (!created || !created._id) continue;
      await addReviews(created._id, starLevel);
      await addProvidersAndDeals(created._id, starLevel, hotel.cityName);
      console.log(`✅ Finished: ${hotel.name}`);
      await delay(2000);
    } catch (err) {
      console.error(`❌ Failed: ${hotel.name} -`, err.response?.data || err.message);
    }
  }
};

runSeeder();

