import HotelModel from "../models/Hotel.model.mjs";
import LocationModel from "../models/location.model.mjs";

// * CREATE HOTEL
async function createHotel(req, res) {
  try {
    let hotelData = req.body;
    if (req.files.cover && req.files.cover.length > 0)
      hotelData.cover = req.files.cover[0].filename;
    else
      res
        .status(500)
        .json({ success: false, error: "Cover Image is Required" });

    if (req.files.images && req.files.images.length > 0)
      hotelData.images = req.files.images.map((x) => x.filename);
    else res.status(500).json({ success: false, error: "Images are required" });

    // CREATE AND SAVE A NEW HOTEL
    const doc = await HotelModel.create(hotelData);
    if (!doc)
      return res
        .status(500)
        .json({ success: false, error: "Requested Hotel not created" });

    res.status(200).json({
      success: true,
      data: {
        doc,
      },
    });
  } catch (error) {
    console.error("ERROR CREATING HOTEL:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

// * GET ALL HOTELS
async function getAllHotels(req, res) {
  try {
    const hotels = await HotelModel.find();
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

    const doc = await HotelModel.findById(hotelId);
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
    const query = {
      "schedule.departureTime": { $gte: new Date() },
    };

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
      if (key.startsWith("amenities.") && req.query[key] === "true") {
        query[key] = true;
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
    if (freeCancellation === "true") {
      dealsFilter["rooms.freeCancellation"] = true;
    }

    if (breakfastIncluded === "true") {
      dealsFilter["rooms.breakfastIncluded"] = true;
    }

    if (availableFrom) {
      dealsFilter["rooms.availableFrom"] = { $gte: new Date(availableFrom) };
    }

    if (availableTo) {
      dealsFilter["rooms.availableTo"] = { $lte: new Date(availableTo) };
    }

    // Only apply deals filter if any condition exists
    if (Object.keys(dealsFilter).length > 0) {
      filter.deals = { $elemMatch: { rooms: { $elemMatch: dealsFilter } } };
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

// * UPDATE HOTEL
async function updateHotel(req, res) {
  try {
    const hotelId = req.params.id;
    let updateData = req.body;

    if (req.files.cover && req.files.cover.length > 0)
      updateData.cover = req.files.cover[0].filename;

    if (req.files.images && req.files.images.length > 0)
      updateData.$push = {
        images: { $each: req.files.images.map((file) => file.filename) },
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
  getHotelsBySearch,
  updateHotel,
  deleteHotel,
};

export default HotelService;
