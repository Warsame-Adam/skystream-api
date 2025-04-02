import AirlineModel from "../models/Airline.model.mjs";
import FlightModel from "../models/Flight.model.mjs";

async function deleteAirline(req, res) {
  try {
    const check = await FlightModel.findOne({
      $or: [
        { outboundAirline: req.params.id },
        { returnAirline: req.params.id },
      ],
    });
    if (check)
      return res
        .status(403)
        .json({ success: false, error: "Airline are already in use" });

    const doc = await AirlineModel.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res
        .status(500)
        .json({ success: false, error: "Requested Airline not deleted" });
    }
    res.status(204).json({
      success: true,
      data: {
        message: "Deleted Successfully",
      },
    });
  } catch (error) {
    console.error("ERROR deleting role:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

async function updateAirline(req, res) {
  try {
    const { name } = req.body;
    const updatedObj = {};

    if (name) updatedObj.name = name;
    if (req?.file?.path) updatedObj.logo = req.file.path;

    const doc = await AirlineModel.findByIdAndUpdate(
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
        .json({ success: false, error: "Requested Airline not updated" });
    }
    res.status(200).json({
      success: true,
      data: {
        doc,
      },
    });
  } catch (error) {
    console.error("ERROR updating Airline:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}
async function createOne(req, res) {
  try {
    const { name } = req.body;

    const doc = await AirlineModel.create({ name, logo: req.file.path });
    if (!doc)
      return res
        .status(500)
        .json({ success: false, error: "Requested Airline not created" });

    res.status(201).json({
      success: true,
      data: {
        doc,
      },
    });
  } catch (error) {
    console.error("ERROR CREATING Airline:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

async function getOne(req, res) {
  try {
    let doc = await AirlineModel.findById(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, error: "Requested Airline not exist" });
    }
    res.status(200).json({
      success: true,
      data: { doc },
    });
  } catch (error) {
    console.error("ERROR getting Airline:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

async function getAll(req, res) {
  try {
    const doc = await AirlineModel.find();

    res.status(200).json({
      success: true,
      result: doc.length,
      data: { doc },
    });
  } catch (error) {
    console.error("ERROR getting Airline:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}
const AirlineService = {
  deleteAirline,
  updateAirline,
  createOne,
  getOne,
  getAll,
};

export default AirlineService;
