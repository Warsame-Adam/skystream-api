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
export async function getFlightsBySearch(req, res) {
  try {
    // helper to turn epoch or ISO or any date‐string into Date
    const toDate = val => {
      if (!val) return null;
      const n = Number(val);
      return Number.isFinite(n) ? new Date(n) : new Date(val);
    };

    const {
      oneway,
      originCountry,
      originCity,
      destinationCountry,
      destinationCity,
      departureTime: rawDep,
      arrivalTime:   rawArr,
      direct,
      outboundAirline,
      returnAirline,
      flightNumber,
      frequency,
      classType,
      vacancy,
      adults = 1,
      children = 0,
      cabinClass,
    } = req.query;

    // also accept the front‐end's "departureDate"/"returnDate"
    const departureTime = rawDep  ?? req.query.departureDate;
    const arrivalTime   = rawArr  ?? req.query.returnDate;

    const filters = {};

    // one‐way flag
    if (oneway !== undefined) {
      filters.twoWay = oneway === "false";
    }

    // direct‐flight flag
    if (direct !== undefined) {
      const isDirect = direct === "true" || direct === true;
      filters["location.outboundDirect"] = isDirect;
      if (oneway === "false") {
        filters["location.returnDirect"] = isDirect;
      }
    }

    // origin
    if (originCountry && originCity) {
      const depCity = await LocationModel
        .findOne({ countryCode: { $regex: originCountry, $options: "i" },
                   cityCode:    { $regex: originCity,    $options: "i" } })
        .select("_id");
      if (depCity) filters["location.departureCity"] = depCity._id;
    } else if (originCountry) {
      const docs = await LocationModel
        .find({ countryCode: { $regex: originCountry, $options: "i" } })
        .select("_id");
      filters["location.departureCity"] = { $in: docs.map(d => d._id) };
    }

    // destination
    if (destinationCountry && destinationCity) {
      const arrCity = await LocationModel
        .findOne({ countryCode: { $regex: destinationCountry, $options: "i" },
                   cityCode:    { $regex: destinationCity,    $options: "i" } })
        .select("_id");
      if (arrCity) filters["location.arrivalCity"] = arrCity._id;
    }

    // outbound airline
    if (outboundAirline) {
      const arr = Array.isArray(outboundAirline) ? outboundAirline : [outboundAirline];
      const docs = await AirlineModel
        .find({ name: { $in: arr.map(n => new RegExp(`^${n}$`, "i")) } })
        .select("_id");
      filters.outboundAirline = { $in: docs.map(d => d._id) };
    }

    // return airline (force twoWay)
    if (returnAirline) {
      filters.twoWay = true;
      const arr = Array.isArray(returnAirline) ? returnAirline : [returnAirline];
      const docs = await AirlineModel
        .find({ name: { $in: arr.map(n => new RegExp(`^${n}$`, "i")) } })
        .select("_id");
      filters.returnAirline = { $in: docs.map(d => d._id) };
    }

    // flightNo & frequency
    if (flightNumber) filters.flightNumber = { $regex: flightNumber, $options: "i" };
    if (frequency)    filters.frequency    = { $in: frequency };

    // date filters
    const dateAnd = [];

    if (departureTime) {
      const start = toDate(departureTime);
      start.setHours(0,0,0,0);
      const end = new Date(start);
      end.setHours(23,59,59,999);
      dateAnd.push({ "schedule.departureTime": { $gte: start, $lte: end } });
    } else {
      // no departure ⇒ only future
      dateAnd.push({ "schedule.departureTime": { $gte: new Date() } });
    }

    // **always** filter return if they passed any returnDate
    if (arrivalTime) {
      const start = toDate(arrivalTime);
      start.setHours(0,0,0,0);
      const end = new Date(start);
      end.setHours(23,59,59,999);
      dateAnd.push({ "schedule.returnDepartureTime": { $gte: start, $lte: end } });
    }

    if (dateAnd.length) {
      filters.$and = filters.$and ? [...filters.$and, ...dateAnd] : dateAnd;
    }

    // class + vacancy
    if (classType && vacancy) {
      const clsDoc = await ClassTypeModel.findOne({ type: classType }).select("_id");
      if (clsDoc) {
        const classCond = {
          classes: {
            $elemMatch: {
              classType: clsDoc._id,
              vacancy:   { $gte: Number(vacancy) },
            }
          }
        };
        filters.$and = filters.$and ? [...filters.$and, classCond] : [classCond];
      }
    }

    // fetch & populate
    const flights = await FlightModel.find(filters).populate(
      "outboundAirline returnAirline " +
      "location.departureCity location.arrivalCity " +
      "location.departureAirport location.arrivalAirport " +
      "classes.classType " +
      "location.outboundStops.stopAtCity location.outboundStops.stopAtAirport " +
      "location.returnStops.stopAtCity location.returnStops.stopAtAirport"
    );

    // price calc
    const ad = parseInt(adults,  10);
    const ch = parseInt(children,10);

    const results = flights
      .map(f => {
        if (!cabinClass) {
          const o = f.toObject();
          o.totalPrice = null;
          return o;
        }
        const cls = f.classes.find(c => c.classType?.type === cabinClass);
        if (!cls) return null;
        const base  = cls.price;
        const total = base * ad + base * 0.75 * ch;
        const o = f.toObject();
        o.totalPrice  = total;
        o.cabinClass  = cabinClass;
        return o;
      })
      .filter(Boolean);

    return res.status(200).json({ success: true, data: { doc: results } });
  }
  catch(err) {
    console.error("ERROR FETCHING FLIGHTS:", err);
    return res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}










async function getCheapestFlightsPerCity(req, res) {
  try {
    let { originCity, originCountry, departureTime } = req.query;
    departureTime = departureTime ? new Date(departureTime) : new Date();

    if (!originCity || !originCountry) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required parameters" });
    }

    // 1) find the departureCity._id
    const departureCity = await LocationModel.findOne({
      countryCode: { $regex: originCountry, $options: "i" },
      cityCode:    { $regex: originCity,   $options: "i" },
    })
      .select("_id")
      .lean()
      .exec();

    if (!departureCity) {
      return res
        .status(404)
        .json({ success: false, error: "Origin city not found" });
    }

    // 2) aggregation pipeline
    const pipeline = [
      { 
        $match: {
          "location.departureCity": departureCity._id,
          "schedule.departureTime": { $gte: departureTime }
        }
      },
      { $unwind: "$classes" },
      { $sort: { "classes.price": 1 } },
      { 
        $group: {
          _id: "$location.arrivalCity",
          flightId: { $first: "$_id" }
        }
      }
    ];

    
    const cheapestFlights = await FlightModel
      .aggregate(pipeline)
      .option({ maxTimeMS: 5000 })
      .exec();

    if (cheapestFlights.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No flights found" });
    }

    // 3) fetch those cheapest docs with full populate
    const ids = cheapestFlights.map(f => f.flightId);
    const docs = await FlightModel.find({ _id: { $in: ids } })
      .populate(
        "outboundAirline returnAirline " +
        "location.departureCity location.arrivalCity " +
        "location.departureAirport location.arrivalAirport " +
        "classes.classType " +
        "location.outboundStops.stopAtCity location.outboundStops.stopAtAirport " +
        "location.returnStops.stopAtCity location.returnStops.stopAtAirport"
      )
      .lean()
      .exec();

    return res.status(200).json({
      success: true,
      data: { doc: docs },
    });

  } catch (err) {
    console.error("ERROR FETCHING CHEAPEST FLIGHTS:", err);
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
  getMyFavoriteFlights,
  getFlightById,
  getFlightsBySearch,
  getCheapestFlightsPerCity,
  showInterest,
};

export default FlightService;

       