const mongoose = require("mongoose");
import ClassTypeModel from "../models/ClassType.model.mjs";
import FlightModel from "../models/Flight.model.mjs";
async function deleteClassType(req, res) {
  try {
    const check = await FlightModel.findOne({
      "classes.classType": mongoose.Types.ObjectId(req.params.id),
    });
    if (check)
      return res
        .status(403)
        .json({ success: false, error: "Class are already in use" });

    const doc = await ClassTypeModel.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res
        .status(500)
        .json({ success: false, error: "Requested Class Type not deleted" });
    }
    res.status(204).json({
      success: true,
      data: {
        message: "deleted Successfully",
      },
    });
  } catch (error) {
    console.error("ERROR deleting Class Type:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

async function updateClassType(req, res) {
  try {
    const { type } = req.body;
    const doc = await ClassTypeModel.findByIdAndUpdate(
      req.params.id,
      { type },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!doc) {
      return res
        .status(500)
        .json({ success: false, error: "Requested Class Type not updated" });
    }
    res.status(200).json({
      success: true,
      data: {
        doc,
      },
    });
  } catch (error) {
    console.error("ERROR updating Class Type:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}
async function createOne(req, res) {
  try {
    const { type } = req.body;

    const doc = await ClassTypeModel.create({ type });
    if (!doc)
      return res
        .status(500)
        .json({ success: false, error: "Requested Class Type not created" });

    res.status(201).json({
      success: true,
      data: {
        doc,
      },
    });
  } catch (error) {
    console.error("ERROR CREATING Class Type:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

async function getOne(req, res) {
  try {
    let doc = await ClassTypeModel.findById(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, error: "Requested Class Type not exist" });
    }
    res.status(200).json({
      success: true,
      data: { doc },
    });
  } catch (error) {
    console.error("ERROR getting Class Type:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

async function getAll(req, res) {
  try {
    const doc = await ClassTypeModel.find();

    res.status(200).json({
      success: true,
      result: doc.length,
      data: { doc },
    });
  } catch (error) {
    console.error("ERROR getting Class Type:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}
const ClassTypeService = {
  deleteClassType,
  updateClassType,
  createOne,
  getOne,
  getAll,
};

export default ClassTypeService;
