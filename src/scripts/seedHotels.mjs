import axios from "axios";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { v4 as uuidv4 } from "uuid";
import hotelBaseData from "../hotelBaseData.mjs";
import { addDays, formatISO } from "date-fns";
import "../utils/cloudinary.mjs";
import { v2 as cloudinary } from "cloudinary";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const API_BASE = "http://localhost:5000/api";
const DRY_RUN = false;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const providers = [
  {
    site: "Booking.com",
    siteLogo: "https://cdn.worldvectorlogo.com/logos/bookingcom-1.svg",
  },
  {
    site: "Expedia",
    siteLogo: "https://cdn.worldvectorlogo.com/logos/expedia.svg",
  },
  {
    site: "Trip.com",
    siteLogo: "https://ak-d.tripcdn.com/images/05E5p12000cga1phzA0ED.webp",
  },
  {
    site: "Agoda",
    siteLogo: "https://seeklogo.com/images/A/agoda-logo-10AB0C3400-seeklogo.com.png",
  },
  {
    site: "Hotels.com",
    siteLogo: "https://upload.wikimedia.org/wikipedia/commons/6/6f/Hotels.com_Logo.png",
  },
];

const reviewPool = [/* same reviews as before */
    { submittedBy: "Erin I.", rating: 3, comment: "Staff were rude and unhelpful." },
  { submittedBy: "Callum N.", rating: 5, comment: "Incredible service and great view." },
  { submittedBy: "Sophie L.", rating: 4, comment: "Clean and cozy, would stay again." },
  { submittedBy: "Mike D.", rating: 2, comment: "Location good but noisy at night." },
  { submittedBy: "Ayesha K.", rating: 5, comment: "Absolutely loved the breakfast and pool." },
  { submittedBy: "Jonny R.", rating: 4, comment: "Affordable and stylish." },
  { submittedBy: "Claire W.", rating: 3, comment: "Average stay, decent value." },
  { submittedBy: "Sarah F.", rating: 5, comment: "Top-tier hospitality!" },
  { submittedBy: "Daniel P.", rating: 1, comment: "Terrible check-in experience." },
  { submittedBy: "Grace M.", rating: 5, comment: "Spotless room and friendly staff." },
  { submittedBy: "Jake S.", rating: 4, comment: "Comfortable beds and good location." },
  { submittedBy: "Lina H.", rating: 5, comment: "Fantastic staff and service." },
  { submittedBy: "Omar T.", rating: 2, comment: "Too far from city center." },
  { submittedBy: "Nina V.", rating: 3, comment: "Decent for the price." },
  { submittedBy: "Zara A.", rating: 4, comment: "Enjoyed the rooftop bar." },
  { submittedBy: "Theo G.", rating: 5, comment: "Would stay again without hesitation." },
  { submittedBy: "Emily B.", rating: 4, comment: "Great breakfast spread." },
  { submittedBy: "Louis C.", rating: 3, comment: "Wi-Fi was a bit slow." },
  { submittedBy: "Isla M.", rating: 5, comment: "Everything was perfect." },
  { submittedBy: "Victor Z.", rating: 2, comment: "AC wasn't working well." },
  { submittedBy: "Julia F.", rating: 4, comment: "Super quiet and clean." },
  { submittedBy: "Hassan R.", rating: 5, comment: "Great value for a 5-star stay." },
  { submittedBy: "Tanya K.", rating: 3, comment: "Not bad, but a bit pricey." },
  { submittedBy: "Leo D.", rating: 4, comment: "Nice gym and pool area." },
  { submittedBy: "Freya S.", rating: 5, comment: "Location couldn't be better." },
  { submittedBy: "Oscar B.", rating: 2, comment: "Bathroom needed maintenance." },
  { submittedBy: "Chloe H.", rating: 4, comment: "Friendly reception and easy check-in." },
  { submittedBy: "Aaron T.", rating: 1, comment: "Would not return." },
  { submittedBy: "Noah E.", rating: 5, comment: "Perfect romantic getaway." },
  { submittedBy: "Maya P.", rating: 5, comment: "Best stay of our trip." },
];

const countryPriceMultiplier = {
  Dubai: 1.2, Rome: 1, Edinburgh: 1, Amsterdam: 1,
  Istanbul: 0.6, Cardiff: 1, Dublin: 1, Antalya: 0.6,
  Sydney: 1.3, Bangkok: 0.65, Athens: 0.7, Paris: 1.2,
};

const getMultiplierForCity = (city) => countryPriceMultiplier[city] || 1;

const roomTypes = [
  { type: "Standard Room", min: 60, max: 90 },
  { type: "Deluxe Room", min: 90, max: 130 },
  { type: "Superior Room", min: 120, max: 160 },
  { type: "Junior Suite", min: 160, max: 220 },
  { type: "Presidential Suite", min: 250, max: 400 },
];

const getHotelStarLevel = (folder) => {
  if (["hotel1", "hotel2"].includes(folder)) return 5;
  if (["hotel3", "hotel4", "hotel5"].includes(folder)) return 4;
  return 3;
};

const randomBool = (weight = 0.5) => Math.random() < weight;
const randomPick = (arr, count = 1) => arr.sort(() => 0.5 - Math.random()).slice(0, count);
const randomPrice = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

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

const createHotel = async (hotelData) => {
  if (DRY_RUN) {
    console.log("🛎️ DRY RUN - Would create hotel:", hotelData.name);
    return { _id: uuidv4() };
  }
  const res = await axios.post(`${API_BASE}/hotels`, hotelData);
  console.log("Response from server:", res.data);
  return res.data.data;
};

const addReviews = async (hotelId, stars) => {
  const count = Math.floor(Math.random() * 3) + 3;
  const filtered = reviewPool.filter((r) => r.rating <= stars);
  const selected = randomPick(filtered, count);
  if (DRY_RUN) return console.log(`📝 DRY RUN - Would add ${selected.length} reviews to ${hotelId}`);
  await axios.post(`${API_BASE}/hotels/new-review/${hotelId}`, selected);
};

const addProvidersAndDeals = async (hotelId, starLevel, cityName) => {
  const numProviders = 2;
  const chosenProviders = randomPick(providers, numProviders);
  const cityMultiplier = getMultiplierForCity(cityName);

  for (let provider of chosenProviders) {
    if (DRY_RUN) {
      console.log(`🏷️ DRY RUN - Would add provider ${provider.site} to hotel ${hotelId}`);
      continue;
    }
    const res = await axios.post(`${API_BASE}/hotels/new-deal-provider/${hotelId}`, provider);
    console.log("🌐 Provider Created:", res.data);
    const providerId = res.data._id;
    if (!providerId) {
      console.error("❌ Missing providerId in response, cannot continue");
      continue;
    }

    const roomOptions = randomPick(roomTypes, 2);
    for (let room of roomOptions) {
      const basePrice = randomPrice(room.min, room.max);
      const adjusted = Math.round(basePrice * (1 + (starLevel - 3) * 0.3) * cityMultiplier);

      const daysFromNow = Math.floor(Math.random() * 5) + 2;
      const length = Math.floor(Math.random() * 21) + 10;
      const deal = {
        type: room.type,
        pricePerNight: adjusted,
        maxPersonAllowed: Math.floor(Math.random() * 3) + 2,
        breakfastIncluded: randomBool(starLevel >= 4 ? 0.8 : 0.4),
        freeCancellation: randomBool(starLevel >= 4 ? 0.8 : 0.5),
        availableFrom: addDays(new Date(), daysFromNow),
        availableTo: addDays(new Date(), daysFromNow + length),
        bookingUrl: "https://example.com/booking",
      };

      await axios.post(`${API_BASE}/hotels/new-deal/${hotelId}/deals/${providerId}`, deal);
    }
  }
};

const runSeeder = async () => {
  for (let hotel of hotelBaseData) {
    try {
      const images = await getImagesFromCloudinary(hotel.cityName, hotel.folder);
      const cover = images.find((img) => img.includes("image1")) || images[0];
      const starLevel = getHotelStarLevel(hotel.folder);

      const payload = {
        name: hotel.name,
        description: generateDescription(starLevel),
        address: hotel.address,
        city: hotel.cityId,
        images,
        cover,
        location: {
          type: "Point",
          coordinates: hotel.coordinates,
        },
        contact: hotel.contact,
        amenities: {
          wifi: true,
          airCondition: randomBool(),
          fitnessCenter: randomBool(starLevel >= 4 ? 0.7 : 0.3),
          swimmingPool: randomBool(starLevel >= 4 ? 0.6 : 0.2),
          parking: randomBool(),
          deskSupport: randomBool(),
          restaurant: randomBool(starLevel >= 4 ? 0.5 : 0.2),
          nonSmooking: randomBool(),
        },
        policies: {
          checkIn: randomPick(["12:00", "13:00", "14:00"])[0],
          checkOut: randomPick(["21:00", "22:00", "23:00"])[0],
          breakfastAvailable: true,
          petsAllowed: true,
          kidsAllowed: true,
        },
      };

      console.log("🛠️ Creating hotel:", payload.name);
      const created = await createHotel(payload);

      if (!created || !created._id) {
        console.error(`❌ Hotel creation failed or missing _id: ${hotel.name}`, created);
        // skip the rest and move on to the next hotel
        continue;
      }


      await addReviews(created._id, starLevel);
      await addProvidersAndDeals(created._id, starLevel, hotel.cityName);
      console.log(`✅ Finished: ${hotel.name}`);

      await delay(2000); // Delay between each request to avoid 429 errors
    } catch (err) {
      console.error(`❌ Failed: ${hotel.name} -`, err.response?.data || err.message);
    }
  }
};

runSeeder();
