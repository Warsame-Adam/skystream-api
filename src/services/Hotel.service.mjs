import HotelModel from "../models/Hotel.model.mjs";

// * CREATE HOTEL
async function createHotel(req, res) {
  try {
    const {name, description, address, location, amenities, contact, policies, images, city} = req.body;

    // CREATE AND SAVE A NEW HOTEL
    const newHotel = await HotelModel.create({
      name,
      description,
      address,
      location,
      amenities,
      contact,
      policies,
      images,
      city,
    });

    res.status(201).json(newHotel);
  } catch (error) {
    console.error("ERROR CREATING HOTEL:", error);
    res.status(500).json({error: "INTERNAL SERVER ERROR"});
  }
}

// * GET ALL HOTELS
async function getAllHotels(req, res) {
  try {
    const hotels = await HotelModel.find();
    res.status(200).json(hotels);
  } catch (error) {
    console.error("ERROR FETCHING HOTELS:", error);
    res.status(500).json({error: "INTERNAL SERVER ERROR"});
  }
}

// * GET HOTEL BY ID
async function getHotelById(req, res) {
  try {
    const hotelId = req.params.id;

    const hotel = await HotelModel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({error: "Hotel not found"});
    }

    res.status(200).json(hotel);
  } catch (error) {
    console.error("ERROR FETCHING HOTEL:", error);
    res.status(500).json({error: "INTERNAL SERVER ERROR"});
  }
}

// * GET HOTEL BY SEARCH
async function getHotelsBySearch(req, res) {
  try {
    const {name, city, latitude, longitude, amenities} = req.query;

    // BUILD SEARCH QUERY
    const query = {};

    // Search by name (case-insensitive)
    if (name) {
      query.name = {$regex: name, $options: "i"};
    }

    // Search by city (case-insensitive)
    if (city) {
      query.city = {$regex: city, $options: "i"};
    }

    // Search by location (approximate match)
    if (latitude && longitude) {
      const LATITUDE = parseFloat(latitude);
      const LONGITUDE = parseFloat(longitude);

      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [LONGITUDE, LATITUDE],
          },
          $maxDistance: 5000, // 5 km radius (adjustable)
        },
      };
    }

    // Search by amenities
    if (amenities) {
      const amenitiesArray = amenities.split(",");
      query.amenities = {$all: amenitiesArray}; // Match all specified amenities
    }

    // FETCH HOTELS MATCHING QUERY
    const hotels = await HotelModel.find(query);

    // SEN
    res.status(200).json(hotels);
  } catch (error) {
    console.error("ERROR FETCHING HOTELS:", error);
    res.status(500).json({error: "INTERNAL SERVER ERROR"});
  }
}

// * UPDATE HOTEL
async function updateHotel(req, res) {
  try {
    const hotelId = req.params.id;
    const updateData = req.body;

    const updatedHotel = await HotelModel.findByIdAndUpdate(hotelId, updateData, {new: true});
    if (!updatedHotel) {
      return res.status(404).json({error: "Hotel not found"});
    }

    res.status(200).json({
      message: "Hotel updated successfully",
      hotel: updatedHotel,
    });
  } catch (error) {
    console.error("ERROR UPDATING HOTEL:", error);
    res.status(500).json({error: "INTERNAL SERVER ERROR"});
  }
}

// * DELETE HOTEL
async function deleteHotel(req, res) {
  try {
    const hotelId = req.params.id;

    const deletedHotel = await HotelModel.findByIdAndDelete(hotelId);
    if (!deletedHotel) {
      return res.status(404).json({error: "Hotel not found"});
    }

    res.status(200).json({message: "Hotel deleted successfully"});
  } catch (error) {
    console.error("ERROR DELETING HOTEL:", error);
    res.status(500).json({error: "INTERNAL SERVER ERROR"});
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
