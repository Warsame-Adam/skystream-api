import LocationModel from "../models/location.model.mjs";
import FlightModel from "../models/Flight.model.mjs";

async function deleteLocation(req, res) {
  try {
    const check = await FlightModel.findOne({
      $or: [
        { "location.departureCity": req.params.id },
        { "location.arrivalCity": req.params.id },
        { "location.outboundStops.stopAtCity": req.params.id },
        { "location.returnStops.stopAtCity": req.params.id },
      ],
    });
    if (check)
      return res.status(403).json({
        success: false,
        error: "Location are already in use by flight",
      });

    const doc = await LocationModel.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res
        .status(500)
        .json({ success: false, error: "Requested Location not deleted" });
    }
    res.status(204).json({
      success: true,
      data: {
        message: "Deleted Successfully",
      },
    });
  } catch (error) {
    console.error("ERROR deleting Location:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

async function updateLocation(req, res) {
  try {
    const { cityName, cityCode, countryName, countryCode, isFab } = req.body;

    const updatedObj = {};
    if (cityName) updatedObj.cityName = cityName;
    if (cityCode) updatedObj.cityCode = cityCode;
    if (countryName) updatedObj.countryName = countryName;
    if (countryCode) updatedObj.countryCode = countryCode;
    if (isFab !== undefined) updatedObj.isFab = isFab;
    if (req?.file?.path) updatedObj.cover = req.file.path;

    const doc = await LocationModel.findByIdAndUpdate(
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
        .json({ success: false, error: "Requested Location not updated" });
    }
    res.status(200).json({
      success: true,
      data: {
        doc,
      },
    });
  } catch (error) {
    console.error("ERROR updating Location:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}
async function createOne(req, res) {
  try {
    const { cityName, cityCode, countryName, countryCode, isFab } = req.body;

    const doc = await LocationModel.create({
      cityName,
      cityCode,
      countryName,
      countryCode,
      isFab: isFab !== undefined ? isFab : false,
      cover: req.file.path,
    });
    if (!doc)
      return res
        .status(500)
        .json({ success: false, error: "Requested Location not created" });

    res.status(201).json({
      success: true,
      data: {
        doc,
      },
    });
  } catch (error) {
    console.error("ERROR CREATING Location:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

async function getOne(req, res) {
  try {
    let doc = await LocationModel.findById(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, error: "Requested Location not exist" });
    }
    res.status(200).json({
      success: true,
      data: { doc },
    });
  } catch (error) {
    console.error("ERROR getting Location:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

async function getAll(req, res) {
  try {
    const doc = await LocationModel.find();

    res.status(200).json({
      success: true,
      result: doc.length,
      data: { doc },
    });
  } catch (error) {
    console.error("ERROR getting Location:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}
const LocationService = {
  deleteLocation,
  updateLocation,
  createOne,
  getOne,
  getAll,
};

export default LocationService;
