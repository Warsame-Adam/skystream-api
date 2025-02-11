import FlightModel from "../models/Flight.model.mjs";

// * ADD A NEW FLIGHT
async function addFlight(req, res) {
  try {
    const flightData = req.body;

    // CREATE AND SAVE NEW FLIGHT INSTANCE
    const newFlight = await FlightModel.create(flightData);

    // SEND RESPONSE WITH FLIGHT DATA
    return res.status(201).json(newFlight);
  } catch (error) {
    console.error("ERROR ADDING FLIGHT:", error);
    return res.status(500).json({error: "INTERNAL SERVER ERROR"});
  }
}

// * GET ALL FLIGHTS
async function getAllFlights(_, res) {
  try {
    // FETCH ALL FLIGHTS
    const flights = await FlightModel.find();

    // SEND RESPONSE WITH FLIGHTS DATA
    return res.status(200).json(flights);
  } catch (error) {
    console.error("ERROR FETCHING FLIGHTS:", error);
    return res.status(500).json({error: "INTERNAL SERVER ERROR"});
  }
}

// * GET FLIGHT BY ID
async function getFlightById(req, res) {
  try {
    const flightId = req.params.id;

    // FETCH FLIGHT BY ID
    const flight = await FlightModel.findById(flightId);

    if (!flight) {
      return res.status(404).json({error: "FLIGHT NOT FOUND"});
    }

    // SEND RESPONSE WITH FLIGHT DATA
    return res.status(200).json(flight);
  } catch (error) {
    console.error("ERROR FETCHING FLIGHT:", error);
    return res.status(500).json({error: "INTERNAL SERVER ERROR"});
  }
}

// * GET FLIGHTS BY SEARCH (WITH FILTERS)
async function getFlightsBySearch(req, res) {
  try {
    const {departureCity, arrivalCity, airline, flightNumber, frequency, schedule, classes, duration} = req.query;

    const filters = {};

    // APPLY FILTERS DYNAMICALLY
    if (departureCity) {
      filters.departureCity = {$regex: departureCity, $options: "i"};
    }

    if (arrivalCity) {
      filters.arrivalCity = {$regex: arrivalCity, $options: "i"};
    }

    if (airline) {
      filters.airline = {$regex: airline, $options: "i"};
    }

    if (flightNumber) {
      filters.flightNumber = {$regex: flightNumber, $options: "i"};
    }

    if (frequency) {
      filters.frequency = {$in: frequency}; // Match any of the specified days
    }

    if (schedule?.departureTime || schedule?.arrivalTime) {
      filters.schedule = {};
      if (schedule.departureTime) {
        filters.schedule.departureTime = {
          $gte: new Date(schedule.departureTime),
        };
      }
      if (schedule.arrivalTime) {
        filters.schedule.arrivalTime = {
          $lte: new Date(schedule.arrivalTime),
        };
      }
    }

    if (classes?.length) {
      filters.classes = {$elemMatch: {}};
      classes.forEach((cls) => {
        if (cls.classType) {
          filters.classes.$elemMatch.classType = cls.classType;
        }
        if (cls.price) {
          filters.classes.$elemMatch.price = cls.price;
        }
        if (cls.vacancy) {
          filters.classes.$elemMatch.vacancy = cls.vacancy;
        }
      });
    }

    if (duration) {
      filters.duration = {$regex: duration, $options: "i"};
    }

    // FETCH FLIGHTS MATCHING THE FILTERS
    const flights = await FlightModel.find(filters);

    // SEND RESPONSE WITH FILTERED FLIGHTS
    return res.status(200).json(flights);
  } catch (error) {
    console.error("ERROR FETCHING FLIGHTS BY SEARCH:", error);
    return res.status(500).json({error: "INTERNAL SERVER ERROR"});
  }
}

const FlightService = {
  addFlight,
  getAllFlights,
  getFlightById,
  getFlightsBySearch,
};

export default FlightService;
