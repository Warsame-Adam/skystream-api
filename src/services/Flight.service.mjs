import FlightModel from "../models/Flight.model.mjs";
import LocationModel from "../models/location.model.mjs";
import AirlineModel from "../models/Airline.model.mjs";
import ClassTypeModel from "../models/ClassType.model.mjs";
import UserModel from "../models/User.model.mjs";
import parseDate from "../utils/parseDate.mjs";
async function deleteFlight(req, res) {
  try {
    const doc = await FlightModel.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res
        .status(500)
        .json({ success: false, error: "Requested Flight not deleted" });
    }
    res.status(204).json({
      success: true,
      data: {
        message: "Deleted Successfully",
      },
    });
  } catch (error) {
    console.error("ERROR deleting Flight:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

// * ADD A NEW FLIGHT
async function addFlight(req, res) {
  console.log("📦 req.body:", req.body);
  console.log("🖼️ req.file:", req.file);
  try {
    let flightData = req.body;
    if (req?.file?.path) flightData.image = req.file.path;
    if (flightData.location.outboundDirect === true) {
      flightData.location.outboundStops = [];
    }
    if (flightData.twoWay === true) {
      if (flightData.location.returnDirect === true) {
        flightData.location.returnStops = [];
      }
    } else if (flightData.twoWay === false) {
      flightData.location.returnDirect = undefined;
      flightData.location.returnStops = undefined;
      flightData.returnAirline = undefined;
      flightData.schedule.returnDepartureTime = undefined;
      flightData.schedule.returnArrivalTime = undefined;
    }

    // CREATE AND SAVE NEW FLIGHT INSTANCE
    const doc = await FlightModel.create(flightData);
    if (!doc)
      return res
        .status(500)
        .json({ success: false, error: "Requested Flight not created" });

    // SEND RESPONSE WITH FLIGHT DATA
    return res.status(200).json({
      success: true,
      data: {
        doc,
      },
    });
  } catch (error) {
    console.error("ERROR ADDING FLIGHT:", error);
    return res
      .status(500)
      .json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

async function updateFlight(req, res) {
  try {
    let flightData = req.body;
    if (req?.file?.path) flightData.image = req.file.path;
    if (flightData.twoWay === true) {
      if (flightData?.location?.returnDirect === true) {
        flightData.location.returnStops = [];
      }
    } else if (flightData.twoWay === false) {
      if (flightData.location) {
        flightData.location.returnDirect = undefined;
        flightData.location.returnStops = undefined;
      }
      flightData.returnAirline = undefined;
      if (flightData.schedule) {
        flightData.schedule.returnDepartureTime = undefined;
        flightData.schedule.returnArrivalTime = undefined;
      }
    }
    const doc = await FlightModel.findByIdAndUpdate(req.params.id, flightData, {
      new: true,
      runValidators: true,
    });
    if (!doc) {
      return res
        .status(500)
        .json({ success: false, error: "Requested Flight not updated" });
    }
    // SEND RESPONSE WITH FLIGHT DATA
    return res.status(200).json({
      success: true,
      data: {
        doc,
      },
    });
  } catch (error) {
    console.error("ERROR ADDING FLIGHT:", error);
    return res
      .status(500)
      .json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

async function showInterest(req, res) {
  let body;
  if (
    req.user.favouritedFlights &&
    req.user.favouritedFlights.some((x) => x.equals(req.params.id))
  ) {
    body = {
      $pull: {
        favouritedFlights: req.params.id,
      },
    };
  } else {
    body = {
      $push: {
        favouritedFlights: req.params.id,
      },
    };
  }
  let doc = await UserModel.findByIdAndUpdate(req.user._id, body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    success: true,
    data: {
      doc,
    },
  });
}
// * GET ALL FLIGHTS
async function getAllFlights(_, res) {
  try {
    // FETCH ALL FLIGHTS
    const flights = await FlightModel.find();

    // SEND RESPONSE WITH FLIGHTS DATA
    return res.status(200).json({
      success: true,
      data: {
        doc: flights,
      },
    });
  } catch (error) {
    console.error("ERROR FETCHING FLIGHTS:", error);
    return res
      .status(500)
      .json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

async function getMyFavoriteFlights(req, res) {
  try {
    // FETCH ALL FLIGHTS
    const flights = await FlightModel.find({
      _id: { $in: req.user.favouritedFlights },
    }).populate(
      "outboundAirline returnAirline location.departureCity location.arrivalCity location.departureAirport location.arrivalAirport classes.classType location.outboundStops.stopAtCity location.outboundStops.stopAtAirport location.returnStops.stopAtCity location.returnStops.stopAtAirport"
    );

    // SEND RESPONSE WITH FLIGHTS DATA
    return res.status(200).json({
      success: true,
      data: {
        doc: flights,
      },
    });
  } catch (error) {
    console.error("ERROR FETCHING FLIGHTS:", error);
    return res
      .status(500)
      .json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}
// * GET FLIGHT BY ID
async function getFlightById(req, res) {
  try {
    const flightId = req.params.id;

    // FETCH FLIGHT BY ID
    const doc = await FlightModel.findById(flightId);

    if (!doc) {
      return res
        .status(404)
        .json({ success: false, error: "FLIGHT NOT FOUND" });
    }

    // SEND RESPONSE WITH FLIGHT DATA
    return res.status(200).json({
      success: true,
      data: {
        doc,
      },
    });
  } catch (error) {
    console.error("ERROR FETCHING FLIGHT:", error);
    return res
      .status(500)
      .json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

// * GET FLIGHTS BY SEARCH (WITH FILTERS)
async function getFlightsBySearch(req, res) {
  try {
    const {
      oneway,
      originCountry,
      originCity,
      destinationCountry,
      destinationCity,
      departureTime,
      arrivalTime,
      direct,
      outboundAirline,
      returnAirline,
      flightNumber,
      frequency,
      classType,
      vacancy,
    } = req.query;

    const filters = {
      "schedule.departureTime": { $gte: new Date() },
    };

    if (oneway !== undefined) {
      filters.twoWay = oneway === "false" || oneway === "false" ? true : false;
    }

    if (direct !== undefined) {
      filters["$and"] = [
        {
          "location.outboundDirect":
            direct === true || direct === "true" ? true : false,
        },
      ];

      // If the flight is two-way, ensure return is also direct
      filters["$and"].push({
        $or: [
          { twoWay: false },
          {
            "location.returnDirect":
              direct === true || direct === "true" ? true : false,
          },
        ],
      });
    }

    // APPLY FILTERS DYNAMICALLY
    if (originCountry && originCity) {
      const departureCity = await LocationModel.findOne({
        countryCode: { $regex: originCountry, $options: "i" },
        cityCode: { $regex: originCity, $options: "i" },
      }).select("_id");

      filters["location.departureCity"] = departureCity?._id;
    } else if (originCountry) {
      const departureCountryCities = await LocationModel.find({
        countryCode: { $regex: originCountry, $options: "i" },
      }).select("_id");

      filters["location.departureCity"] = {
        $in: departureCountryCities.map((doc) => doc._id),
      };
    }

    if (destinationCountry && destinationCity) {
      const arrivalCity = await LocationModel.findOne({
        countryCode: { $regex: destinationCountry, $options: "i" },
        cityCode: { $regex: destinationCity, $options: "i" },
      }).select("_id");
      filters["location.arrivalCity"] = arrivalCity?._id;
    }

    if (outboundAirline) {
      const outboundAirlineCopy = Array.isArray(outboundAirline)
        ? outboundAirline
        : [outboundAirline];
      const outboundAirlineDocs = await AirlineModel.find({
        name: {
          $in: outboundAirlineCopy.map((name) => new RegExp(`^${name}$`, "i")),
        },
      })
        .select("_id")
        .lean();
      filters["outboundAirline"] = {
        $in: outboundAirlineDocs.map((doc) => doc._id),
      };
    }

    if (returnAirline) {
      filters["twoWay"] = true; // Ensure it's a round-trip flight
      const returnAirlineCopy = Array.isArray(returnAirline)
        ? returnAirline
        : [returnAirline];

      const returnAirlineDocs = await AirlineModel.find({
        name: {
          $in: returnAirlineCopy.map((name) => new RegExp(`^${name}$`, "i")),
        },
      })
        .select("_id")
        .lean();

      filters["returnAirline"] = {
        $in: returnAirlineDocs.map((doc) => doc._id),
      };
    }

    if (flightNumber) {
      filters.flightNumber = { $regex: flightNumber, $options: "i" };
    }
    if (frequency) {
      filters.frequency = { $in: frequency }; // Match any of the specified days
    }

    // Step 6: Apply departureTime and arrivalTime filters
    const scheduleFilters = [];
    if (departureTime && arrivalTime) {
      scheduleFilters.push({
        "schedule.departureTime": { $gte: parseDate(departureTime) },
        "schedule.arrivalTime": { $lte: parseDate(arrivalTime) },
      });
    } else if (departureTime) {
      scheduleFilters.push({
        "schedule.departureTime": { $gte: parseDate(departureTime) },
      });
    } else if (arrivalTime) {
      scheduleFilters.push({
        "schedule.arrivalTime": { $lte: parseDate(arrivalTime) },
      });
    }
    // Apply schedule filters
    if (scheduleFilters.length) {
      filters["$and"] = filters["$and"]
        ? [...filters["$and"], ...scheduleFilters]
        : scheduleFilters;
    }

    const classFilters = [];
    if (classType && vacancy) {
      const classTypeDoc = await ClassTypeModel.findOne({
        type: classType,
      }).select("_id");
      if (classTypeDoc) {
        classFilters.push({
          classes: {
            $elemMatch: {
              classType: classTypeDoc._id,
              vacancy: { $gte: vacancy },
            },
          },
        });
      }
    }
    // Apply class filters
    if (classFilters.length) {
      filters["$and"] = filters["$and"]
        ? [...filters["$and"], ...classFilters]
        : classFilters;
    }
    // FETCH FLIGHTS MATCHING THE FILTERS
    const flights = await FlightModel.find(filters).populate(
      "outboundAirline returnAirline location.departureCity location.arrivalCity location.departureAirport location.arrivalAirport classes.classType location.outboundStops.stopAtCity location.outboundStops.stopAtAirport location.returnStops.stopAtCity location.returnStops.stopAtAirport"
    );

    // SEND RESPONSE WITH FILTERED FLIGHTS
    return res.status(200).json({
      success: true,
      data: {
        doc: flights,
      },
    });
  } catch (error) {
    console.error("ERROR FETCHING FLIGHTS BY SEARCH:", error);
    return res
      .status(500)
      .json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

async function getCheapestFlightsPerCity(req, res) {
  try {
    let { originCity, originCountry, departureTime } = req.query;
    if (!departureTime) {
      departureTime = new Date().toDateString();
    }

    if (!originCity || !originCountry) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required parameters" });
    }
    // Step 1: Find Departure City ID
    const departureCity = await LocationModel.findOne({
      countryCode: { $regex: originCountry, $options: "i" },
      cityCode: { $regex: originCity, $options: "i" },
    }).select("_id");

    if (!departureCity) {
      return res
        .status(404)
        .json({ success: false, error: "Origin city not found" });
    }

    // Step 2: Fetch Flights from Origin City on or after the given date
    const flights = await FlightModel.find({
      "location.departureCity": departureCity._id,
      "schedule.departureTime": { $gte: new Date(departureTime) },
    }).populate(
      "outboundAirline returnAirline location.departureCity location.arrivalCity location.departureAirport location.arrivalAirport classes.classType location.outboundStops.stopAtCity location.outboundStops.stopAtAirport location.returnStops.stopAtCity location.returnStops.stopAtAirport"
    );

    // Populate destination city details

    // Step 3: Find cheapest flight per destination city
    const cheapestFlights = new Map();

    flights.forEach((flight) => {
      const minClass = flight.classes.reduce(
        (min, c) => (c.price < min.price ? c : min),
        {
          price: Infinity,
        }
      );

      if (minClass.price === Infinity) return; // Skip if no valid price

      const destinationId = flight.location.arrivalCity._id.toString();
      if (
        !cheapestFlights.has(destinationId) ||
        minClass.price < cheapestFlights.get(destinationId).price
      ) {
        cheapestFlights.set(destinationId, { flight, price: minClass.price });
      }
    });

    // Step 4: Convert Map to an array of flights
    const resultFlights = Array.from(cheapestFlights.values()).map(
      (entry) => entry.flight
    );

    return res.status(200).json({
      success: true,
      data: {
        doc: resultFlights,
      },
    });
  } catch (error) {
    console.error("ERROR FETCHING FLIGHTS:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

const FlightService = {
  deleteFlight,
  updateFlight,
  addFlight,
  getAllFlights,
  getMyFavoriteFlights,
  getFlightById,
  getFlightsBySearch,
  getCheapestFlightsPerCity,
  showInterest,
};

export default FlightService;

       