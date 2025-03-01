const mongoose = require("mongoose");
import RolesModel from "../models/roles.model.mjs";
import UserModel from "../models/User.model.mjs";

async function deleteRole(req, res) {
  try {
    const check = await UserModel.findOne({
      roles: mongoose.Types.ObjectId(req.params.id),
    });
    if (check)
      return res
        .status(403)
        .json({ success: false, error: "Role are already in use" });

    const doc = await RolesModel.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res
        .status(500)
        .json({ success: false, error: "Requested Role not deleted" });
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

async function updateRole(req, res) {
  try {
    const { name } = req.body;
    const doc = await RolesModel.findByIdAndUpdate(
      req.params.id,
      { name },
      {
        new: true,
        runValidators: true,
      }
    );
    if (!doc) {
      return res
        .status(500)
        .json({ success: false, error: "Requested Role not updated" });
    }
    res.status(200).json({
      success: true,
      data: {
        doc,
      },
    });
  } catch (error) {
    console.error("ERROR updating role:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}
async function createOne(req, res) {
  try {
    const { name } = req.body;

    const doc = await RolesModel.create({ name });
    if (!doc)
      return res
        .status(500)
        .json({ success: false, error: "Requested Role not created" });

    res.status(201).json({
      success: true,
      data: {
        doc,
      },
    });
  } catch (error) {
    console.error("ERROR CREATING role:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}
async function createDefaultRoles(roles) {
  const r = await RolesModel.countDocuments({});
  if (r === 0) {
    const doc = await RolesModel.insertMany(
      roles.map((r) => {
        return {
          name: r,
        };
      })
    );
    if (!doc)
      return {
        error: true,
        status: 500,
        message: "server unable to read this request",
      };
  }

  return {
    error: false,
  };
}

async function getOne(req, res) {
  try {
    let doc = await RolesModel.findById(req.params.id);
    if (!doc) {
      return res
        .status(404)
        .json({ success: false, error: "Requested Role not exist" });
    }
    res.status(200).json({
      success: true,
      data: { doc },
    });
  } catch (error) {
    console.error("ERROR getting role:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}

async function getAll(req, res) {
  try {
    const doc = await RolesModel.find();

    res.status(200).json({
      success: true,
      result: doc.length,
      data: { doc },
    });
  } catch (error) {
    console.error("ERROR getting roles:", error);
    res.status(500).json({ success: false, error: "INTERNAL SERVER ERROR" });
  }
}
const RolesService = {
  deleteRole,
  updateRole,
  createOne,
  createDefaultRoles,
  getOne,
  getAll,
};

export default RolesService;
