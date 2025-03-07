import AirportModel from "../models/Airport.model.mjs";
import FlightModel from "../models/Flight.model.mjs";

async function deleteAirport(req, res) {
  try {
    const check = await FlightModel.findOne({
      $or: [
        { "location.arrivalAirport": req.params.id },
        { "location.departureAirport": req.params.id },
        { "location.outboundStops.stopAtAirport": req.params.id },
        { "location.returnStops.stopAtAirport": req.params.id },
      ],
    });
    if (check)
      return res.status(403).json({
        success: false,
        error: "Airport are already in use by flight",
      });

    const doc = await AirportModel.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res
        .status(500)
        .json({ success: false, error: "Requested Airport not deleted" });
    }
    res.status(204).json({
      success: true,
      data: {
        message: "Deleted Successfully",
      },
    });
  } catch (error) {
    console.error("ERROR deleting Airport:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

async function updateAirport(req, res) {
  try {
    const { name, location } = req.body;
    const updatedObj = {};

    if (name) updatedObj.name = name;
    if (req?.file?.filename) updatedObj.logo = req.file.filename;
    if (location) {
      if (location.type) updatedObj.type = location.type;
      if (location.coordinates) updatedObj.coordinates = location.coordinates;
    }
    const doc = await AirportModel.findByIdAndUpdate(
      req.params.id,
      updatedObj,
      {
        new: true,
        runValidators: true,
      }
    );
    if (!doc) {
      return res
        .status(500)
        .json({ success: false, error: "Requested Airport not updated" });
    }
    res.status(200).json({
      success: true,
      data: {
        doc,
      },
    });
  } catch (error) {
    console.error("ERROR updating Airport:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}
async function createOne(req, res) {
  try {
    const { name, location } = req.body;
    console.log(location);
    const doc = await AirportModel.create({
      name,
      location,
      logo: req.file.filename,
    });
    if (!doc)
      return res
        .status(500)
        .json({ success: false, error: "Requested Airport not created" });

    res.status(201).json({
      success: true,
      data: {
        doc,
      },
    });
  } catch (error) {
    console.error("ERROR CREATING Airport:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

async function getOne(req, res) {
  try {
    let doc = await AirportModel.findById(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, error: "Requested Airport not exist" });
    }
    res.status(200).json({
      success: true,
      data: { doc },
    });
  } catch (error) {
    console.error("ERROR getting Airport:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

async function getAll(req, res) {
  try {
    const doc = await AirportModel.find();

    res.status(200).json({
      success: true,
      result: doc.length,
      data: { doc },
    });
  } catch (error) {
    console.error("ERROR getting Airport:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}
const AirportService = {
  deleteAirport,
  updateAirport,
  createOne,
  getOne,
  getAll,
};

export default AirportService;
