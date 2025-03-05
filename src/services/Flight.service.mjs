import FlightModel from "../models/Flight.model.mjs";
import LocationModel from "../models/location.model.mjs";
import AirlineModel from "../models/Airline.model.mjs";
import ClassTypeModel from "../models/ClassType.model.mjs";

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
  try {
    let flightData = req.body;
    if (req.file.filname) flightData.image = req.file.filename;
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
    if (req.file.filname) flightData.image = req.file.filename;

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

// * GET FLIGHT BY ID
async function getFlightById(req, res) {
  try {
    const flightId = req.params.id;

    // FETCH FLIGHT BY ID
    const doc = await FlightModel.findById(flightId);

    if (!doc) {
      return res.status(404).json({ error: "FLIGHT NOT FOUND" });
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

    const filters = {};

    if (oneway) {
      filters.twoWay = false;
    }

    if (direct === "true") {
      filters["$and"] = [{ "location.outboundDirect": true }];

      // If the flight is two-way, ensure return is also direct
      filters["$and"].push({
        $or: [{ twoWay: false }, { "location.returnDirect": true }],
      });
    }

    // APPLY FILTERS DYNAMICALLY
    if (originCountry && originCity) {
      const departureCity = await LocationModel.findOne({
        countryCode: { $regex: originCountry, $options: "i" },
        cityCode: { $regex: originCity, $options: "i" },
      }).select("_id");

      filters["location.departureCity"] = departureCity._id;
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
      filters["location.arrivalCity"] = arrivalCity._id;
    }

    if (outboundAirline && outboundAirline.length > 0) {
      const outboundAirlineDocs = await AirlineModel.find({
        name: {
          $in: outboundAirline.map((name) => new RegExp(`^${name}$`, "i")),
        },
      }).select("_id");

      if (outboundAirlineDocs.length > 0) {
        filters["outboundAirline"] = {
          $in: outboundAirlineDocs.map((doc) => doc._id),
        };
      }
    }

    if (returnAirline && returnAirline.length > 0) {
      filters["twoWay"] = true; // Ensure it's a round-trip flight

      const returnAirlineDocs = await AirlineModel.find({
        name: { $in: returnAirline },
      }).select("_id");

      if (returnAirlineDocs.length > 0) {
        filters["returnAirline"] = {
          $in: returnAirlineDocs.map((doc) => doc._id),
        };
      }
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
        "schedule.departureTime": { $gte: new Date(parseInt(departureTime)) },
        "schedule.arrivalTime": { $lte: new Date(parseInt(arrivalTime)) },
      });
    } else if (departureTime) {
      scheduleFilters.push({
        "schedule.departureTime": { $gte: new Date(parseInt(departureTime)) },
      });
    } else if (arrivalTime) {
      scheduleFilters.push({
        "schedule.arrivalTime": { $lte: new Date(parseInt(arrivalTime)) },
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

const FlightService = {
  deleteFlight,
  updateFlight,
  addFlight,
  getAllFlights,
  getFlightById,
  getFlightsBySearch,
};

export default FlightService;
