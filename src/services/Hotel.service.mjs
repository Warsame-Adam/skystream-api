import HotelModel from "../models/Hotel.model.mjs";
import LocationModel from "../models/location.model.mjs";
import parseDate from "../utils/parseDate.mjs";
// * CREATE HOTEL
async function createHotel(req, res) {
  try {
    let hotelData = req.body;

    console.log("📥 Incoming hotel data:", req.body);
    console.log("🖼️ Cover image from file upload:", req.files?.cover);

    // Remove client-sent fields that shouldn't be stored
    delete hotelData["reviews"];
    delete hotelData["deals"];

    if (!hotelData.cover || !hotelData.images || hotelData.images.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Cover image and at least one hotel image are required",
      });
    }

    console.log("🧾 Attempting to create hotel with payload:", hotelData);

    const doc = await HotelModel.create(hotelData);

    if (!doc) {
      return res.status(500).json({
        success: false,
        error: "Requested Hotel not created",
      });
    }

    res.status(200).json({
      success: true,
      data: doc,
    });
  } catch (error) {
    console.error("🔥 ERROR CREATING HOTEL:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
      details: error.errors || error.response?.data || "Unknown error",
    });
  }
}



// * GET ALL HOTELS
async function getAllHotels(req, res) {
  try {
    const hotels = await HotelModel.find().populate("city");
    return res.status(200).json({
      success: true,
      data: {
        doc: hotels,
      },
    });
  } catch (error) {
    console.error("ERROR FETCHING HOTELS:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

// * GET HOTEL BY ID
async function getHotelById(req, res) {
  try {
    const hotelId = req.params.id;

    const doc = await HotelModel.findById(hotelId).populate("city");
    if (!doc) {
      return res.status(404).json({ success: false, error: "Hotel not found" });
    }

    return res.status(200).json({
      success: true,
      data: {
        doc,
      },
    });
  } catch (error) {
    console.error("ERROR FETCHING HOTEL:", error);
    res.status(500).json({ error: "INTERNAL SERVER ERROR" });
  }
}

async function getFabCityHotels(req, res) {
  try {
    const matchedLocations = await LocationModel.find({ isFab: true });
    const locationIds = matchedLocations.map((loc) => loc._id);
    const hotels = await HotelModel.find({
      city: { $in: locationIds },
    }).populate("city");

    // Step 3: Find one hotel per city with the lowest price
    const bestHotelsPerLocation = new Map();
    hotels.forEach((hotel) => {
      const minDeal = hotel.deals
        .flatMap((deal) => deal.rooms) // Flatten all rooms
        .reduce(
          (min, room) => (room.pricePerNight < min.pricePerNight ? room : min),
          { pricePerNight: Infinity }
        );

      if (minDeal.pricePerNight === Infinity) return; // Skip if no valid deal

      const cityId = hotel.city._id.toString();
      if (
        !bestHotelsPerLocation.has(cityId) ||
        minDeal.pricePerNight < bestHotelsPerLocation.get(cityId).price
      ) {
        bestHotelsPerLocation.set(cityId, {
          hotel,
          price: minDeal.pricePerNight,
        });
      }
    });
    // Convert Map to an array of hotels
    const bestHotels = Array.from(bestHotelsPerLocation.values()).map(
      (entry) => entry.hotel
    );

    return res.status(200).json({
      success: true,
      data: {
        doc: bestHotels,
      },
    });
  } catch (error) {
    console.error("ERROR FETCHING HOTELS:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

// * GET HOTEL BY SEARCH
async function getHotelsBySearch(req, res) {
  try {
    let {
      name,
      country,
      city,
      latitude,
      longitude,
      rating,
      minReview,
      noOfRooms,
      noOfPersons,
      freeCancellation,
      breakfastIncluded,
      availableFrom,
      availableTo,
    } = req.query;

    // BUILD SEARCH QUERY
    const query = {};

    // 1- Name filter (case insensitive)
    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    // 2- Location filter (country & city)
    if (country || city) {
      let locationFilter = {};

      if (country) {
        locationFilter.countryCode = { $regex: country, $options: "i" };
      }
      if (city) {
        locationFilter.cityCode = { $regex: city, $options: "i" };
      }

      const matchedLocations = await LocationModel.find(locationFilter).select(
        "_id"
      );
      const locationIds = matchedLocations.map((loc) => loc._id);
      if (locationIds.length) {
        query.city = { $in: locationIds };
      }
    }

    //3-  Search by location (approximate match)
    if (latitude && longitude) {
      const LATITUDE = parseFloat(latitude);
      const LONGITUDE = parseFloat(longitude);

      query["location.coordinates"] = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [LONGITUDE, LATITUDE],
          },
          $maxDistance: 50000, // 50 km radius
        },
      };
    }

    // 4- Amenities Filtering (Checkboxes)
    Object.keys(req.query).forEach((key) => {
      if (key.startsWith("amenities.")) {
        query[key] =
          req.query[key] === true || req.query[key] === "true" ? true : false;
      }
    });

    // 5. Deals and Rooms Filters (Using $elemMatch for nested filtering)
    let dealsFilter = {};
    if (noOfRooms) {
      dealsFilter["rooms.noOfRooms"] = parseInt(noOfRooms);
    }
    if (noOfPersons) {
      dealsFilter["rooms.maxPersonAllowed"] = { $gte: parseInt(noOfPersons) };
    }

    if (freeCancellation !== undefined) {
      dealsFilter["rooms.freeCancellation"] =
        freeCancellation === true || freeCancellation === "true" ? true : false;
    }

    if (breakfastIncluded !== undefined) {
      dealsFilter["rooms.breakfastIncluded"] =
        breakfastIncluded === true || breakfastIncluded === "true"
          ? true
          : false;
    }
    // Fixing date filtering inside the nested room object
    if (availableFrom && availableTo) {
      dealsFilter["rooms"] = {
        $elemMatch: {
          availableFrom: { $gte: parseDate(availableFrom) }, // Room should be available before or on `availableTo`
          availableTo: { $lte: parseDate(availableTo) }, // Room should still be available after or on `availableFrom`
        },
      };
    } else if (availableFrom) {
      dealsFilter["rooms"] = {
        $elemMatch: {
          availableTo: { $gte: parseDate(availableFrom) },
        },
      };
    } else if (availableTo) {
      dealsFilter["rooms"] = {
        $elemMatch: {
          availableFrom: { $lte: parseDate(availableTo) },
        },
      };
    }

    // Apply deals filter correctly to check if at least one deal has a matching room
    if (Object.keys(dealsFilter).length > 0) {
      query["deals"] = {
        $elemMatch: dealsFilter, // Ensuring at least one deal has a room matching the conditions
      };
    }
    // FETCH HOTELS MATCHING QUERY
    let hotels = await HotelModel.find(query).populate("city");

    if (minReview || rating) {
      const minReviewCount = parseFloat(minReview);

      hotels = hotels
        .map((hotel) => {
          if (hotel.reviews.length === 0) {
            hotel.averageRating = 0;
          } else {
            hotel.averageRating =
              hotel.reviews.reduce((acc, review) => acc + review.rating, 0) /
              hotel.reviews.length;
          }
          return hotel;
        })
        .filter((hotel) =>
          rating
            ? Math.floor(hotel.averageRating) === rating
            : hotel.averageRating >= minReviewCount
        );
    }
    return res.status(200).json({
      success: true,
      data: {
        doc: hotels,
      },
    });
  } catch (error) {
    console.error("ERROR FETCHING HOTELS:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

async function getHotelsStats(req, res) {
  try {
    const { countryCode, cityCode } = req.query;
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const matchStage = {};

    if (countryCode) {
      matchStage["location.countryCode"] = {
        $regex: new RegExp(`^${countryCode}$`, "i"),
      };
    }
    if (cityCode) {
      matchStage["location.cityCode"] = {
        $regex: new RegExp(`^${cityCode}$`, "i"),
      };
    }

    const pipeline = [];

    // Optional: Global match before $facet if you want to reduce docs early
    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    pipeline.push(
      {
        $addFields: {
          averageRating: {
            $cond: {
              if: { $eq: [{ $size: "$reviews" }, 0] },
              then: 0,
              else: { $avg: "$reviews.rating" },
            },
          },
        },
      },
      {
        $facet: {
          highestRatedHotel: [
            { $match: matchStage },
            { $sort: { averageRating: -1 } },
            { $limit: 1 },
            {
              $project: {
                _id: 1,
                name: 1,
                averageRating: 1,
              },
            },
          ],
          cheapestMonthToBook: [
            { $match: matchStage },
            { $unwind: "$deals" },
            { $unwind: "$deals.rooms" },
            {
              $match: {
                "deals.rooms.availableFrom": { $gte: oneYearAgo },
              },
            },
            {
              $project: {
                month: { $month: "$deals.rooms.availableFrom" },
                pricePerNight: "$deals.rooms.pricePerNight",
              },
            },
            {
              $group: {
                _id: "$month",
                minPrice: { $min: "$pricePerNight" },
              },
            },
            { $sort: { minPrice: 1 } },
            { $limit: 1 },
            {
              $project: {
                _id: 0,
                cheapestMonth: "$_id",
                minPrice: 1,
              },
            },
          ],
          average4StarPrice: [
            { $match: matchStage },
            { $match: { starRating: 4 } }, 

            { $unwind: "$deals" },
            { $unwind: "$deals.rooms" },
            {
              $group: {
                _id: null,
                avgPrice: { $avg: "$deals.rooms.pricePerNight" },
              },
            },
            {
              $project: {
                _id: 0,
                avg4StarPrice: "$avgPrice",
              },
            },
          ],
          average5StarPrice: [
            { $match: matchStage },
            { $match: { starRating: 5 } },
            
            { $unwind: "$deals" },
            { $unwind: "$deals.rooms" },
            {
              $group: {
                _id: null,
                avgPrice: { $avg: "$deals.rooms.pricePerNight" },
              },
            },
            {
              $project: {
                _id: 0,
                avg5StarPrice: "$avgPrice",
              },
            },
          ],
        },
      }
    );

    const result = await HotelModel.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      data: {
        highestRatedHotel: result[0].highestRatedHotel[0] || null,
        cheapestMonthToBook:
          result[0].cheapestMonthToBook[0] || { cheapestMonth: 1 },
        average4StarPrice: result[0].average4StarPrice.length
          ? result[0].average4StarPrice[0].avg4StarPrice
          : 0,
        average5StarPrice: result[0].average5StarPrice.length
          ? result[0].average5StarPrice[0].avg5StarPrice
          : 0,
      },
    });
  } catch (error) {
    console.error("ERROR FETCHING HOTELS:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

async function getRelatedHotels(req, res) {
  const hotelId = req.params.id;
  try {
    // Step 1: Fetch Current Hotel
    const currentHotel = await HotelModel.findById(hotelId).populate("city");
    if (!currentHotel) {
      return res
        .status(404)
        .json({ success: false, error: "Requested Hotel not exist" });
    }

    const { city, deals } = currentHotel;

    // Calculate Average Price (for recommended hotels)
    const allPrices = deals.flatMap((deal) =>
      deal.rooms.map((room) => room.pricePerNight)
    );
    const avgPrice = allPrices.length
      ? allPrices.reduce((sum, price) => sum + price, 0) / allPrices.length
      : 0;

    const priceRange = {
      $gte: avgPrice * 0.85, // 15% below
      $lte: avgPrice * 1.15, // 15% above
    };

    // Step 2: Fetch Similar Hotels (Same City)
    const similarHotelsData = await HotelModel.find({
      city: city._id,
      _id: { $ne: hotelId },
    })
      .limit(3)
      .lean()
      .populate("city");

      const similarHotelIds = similarHotelsData.map(h => h._id);

// Step 3: Fetch Recommended Hotels (Similar Price, Same City but exclude similarHotels)
const recommendedHotels = await HotelModel.find({
  city: city._id,
  "deals.rooms.pricePerNight": priceRange,
  _id: { $nin: [hotelId, ...similarHotelIds] }, // Exclude current hotel + similar hotels
})
  .limit(3)
  .lean()
  .populate("city");


    
   


    
    

    res.status(200).json({
      success: true,
      data: {
        doc: {
          similarHotelsData,
          recommendedHotels,
          
        },
      },
    });
  } catch (error) {
    console.error("Error fetching related hotels:", error);
    return res
      .status(404)
      .json({ success: false, error: "Requested Hotel not exist" });
  }
}

// * UPDATE HOTEL
async function updateHotel(req, res) {
  try {
    const hotelId = req.params.id;
    let updateData = req.body;
    delete updateData["reviews"];
    delete updateData["deals"];

    if (req.files.cover && req.files.cover.length > 0)
      updateData.cover = req.files.cover[0].filename;

    if (req.files.images && req.files.images.length > 0)
      updateData.$push = {
        images: { $each: req.files.images.map((file) => file.path) },
      };

    const doc = await HotelModel.findByIdAndUpdate(hotelId, updateData, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return res.status(404).json({ success: false, error: "Hotel not found" });
    }
    return res.status(200).json({
      success: true,
      message: "Hotel updated successfully",

      data: {
        doc,
      },
    });
  } catch (error) {
    console.error("ERROR UPDATING HOTEL:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

// Add a Review to a Hotel
async function addNewReview(req, res) {
  try {
    const hotelId = req.params.hotelId;
    
    const incomingReviews = Array.isArray(req.body) ? req.body : [req.body];

    
    for (const review of incomingReviews) {
      if (!review.submittedBy || !review.rating) {
        return res.status(400).json({
          success: false,
          error: "Each review must have submittedBy and rating fields",
        });
      }
    }

    
    const updatedHotel = await HotelModel.findByIdAndUpdate(
      hotelId,
      { $push: { reviews: { $each: incomingReviews } } },
      { new: true }
    );

    if (!updatedHotel) {
      return res.status(404).json({
        success: false,
        error: "Hotel not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Review(s) added successfully",
      data: {
        doc: updatedHotel,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

//Add a New Deal Provider with Empty Rooms
async function addNewDealProvider(req, res) {
  try {
    const hotelId = req.params.hotelId;
    const providers = Array.isArray(req.body) ? req.body : [req.body];

    const formatted = providers.map((p) => ({
      site: p.site,
      siteLogo: p.siteLogo,
      rooms: [],
    }));

    const updatedHotel = await HotelModel.findByIdAndUpdate(
      hotelId,
      { $push: { deals: { $each: formatted } } },
      { new: true }
    );

    if (!updatedHotel || !updatedHotel.deals.length) {
      return res.status(404).json({
        success: false,
        error: "Hotel not found or deal not added",
      });
    }

    const lastDeal = updatedHotel.deals[updatedHotel.deals.length - 1];

    res.status(200).json({
      success: true,
      message: "Deal provider added successfully",
      _id: lastDeal._id, // ✅ YOU NEED THIS
      data: lastDeal,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}

async function addNewDeal(req, res) {
  try {
    const { hotelId, dealId } = req.params;
    const incomingDeals = Array.isArray(req.body) ? req.body : [req.body];

    const formattedDeals = incomingDeals.map((deal) => ({
      type: deal.type,
      pricePerNight: deal.pricePerNight,
      noOfRooms: deal.noOfRooms || 1,
      maxPersonAllowed: deal.maxPersonAllowed,
      maxAdults: deal.maxAdults,
      maxChildren: deal.maxChildren,
      maxGuests: deal.maxGuests,
      freeCancellation: deal.freeCancellation,
      breakfastIncluded: deal.breakfastIncluded,
      availableFrom: deal.availableFrom,
      availableTo: deal.availableTo,
      bookingUrl: deal.bookingUrl, // if you need to save bookingUrl as well
    }));

    const updatedHotel = await HotelModel.findOneAndUpdate(
      { _id: hotelId, "deals._id": dealId },
      {
        $push: {
          "deals.$.rooms": { $each: formattedDeals },
        },
      },
      { new: true }
    );

    if (!updatedHotel) {
      return res
        .status(404)
        .json({ success: false, error: "Hotel or Deal Provider not found" });
    }

    res.status(200).json({
      success: true,
      message: "Room deal(s) added successfully",
      data: updatedHotel,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
}
  




// * DELETE HOTEL
async function deleteHotel(req, res) {
  try {
    const hotelId = req.params.id;

    const deletedHotel = await HotelModel.findByIdAndDelete(hotelId);
    if (!deletedHotel) {
      return res.status(404).json({ success: false, error: "Hotel not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Hotel deleted successfully" });
  } catch (error) {
    console.error("ERROR DELETING HOTEL:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

const HotelService = {
  createHotel,
  getAllHotels,
  getHotelById,
  getFabCityHotels,
  getHotelsBySearch,
  getRelatedHotels,
  getHotelsStats,
  updateHotel,
  addNewReview,
  addNewDealProvider,
  addNewDeal,
  deleteHotel,
};

export default HotelService;
