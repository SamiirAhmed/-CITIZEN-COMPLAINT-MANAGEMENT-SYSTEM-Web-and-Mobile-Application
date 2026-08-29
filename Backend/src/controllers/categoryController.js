import Category from '../models/Category.js';
import { asyncHandler, createAuditLog, getRequestIp } from '../utils/helpers.js';

const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const listCategories = asyncHandler(async (req, res) => {
  const { search = '', status } = req.query;
  const filter = {};

  if (status === 'active') filter.isActive = true;
  if (status === 'inactive') filter.isActive = false;

  if (String(search).trim()) {
    filter.name = new RegExp(escapeRegex(String(search).trim()), 'i');
  }

  const categories = await Category.find(filter).sort({ name: 1 });

  return res.json({
    success: true,
    data: {
      categories: categories.map((item) => item.toClientObject()),
    },
  });
});

export const getActiveCategoryNames = asyncHandler(async (_req, res) => {
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  return res.json({
    success: true,
    data: {
      categories: categories.map((item) => item.name),
    },
  });
});

export const createCategory = asyncHandler(async (req, res) => {
  const name = String(req.body.name ?? '').trim();
  const description = String(req.body.description ?? '').trim();

  if (!name) {
    return res.status(400).json({
      success: false,
      message: 'Category name is required.',
    });
  }

  if (name.length > 60) {
    return res.status(400).json({
      success: false,
      message: 'Category name must be at most 60 characters.',
    });
  }

  const existing = await Category.findOne({
    name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
  });
  if (existing) {
    return res.status(409).json({
      success: false,
      message: 'A category with this name already exists.',
    });
  }

  const category = await Category.create({
    name,
    description,
    isActive: true,
  });

  await createAuditLog({
    actor: req.user,
    action: 'CREATE',
    recordType: 'Category',
    recordId: category._id,
    recordLabel: category.name,
    newValue: category.name,
    details: 'Complaint category created.',
    ipAddress: getRequestIp(req),
  });

  return res.status(201).json({
    success: true,
    message: 'Category created successfully.',
    data: { category: category.toClientObject() },
  });
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found.',
    });
  }

  if (req.body.name !== undefined) {
    const name = String(req.body.name).trim();
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required.',
      });
    }
    if (name.length > 60) {
      return res.status(400).json({
        success: false,
        message: 'Category name must be at most 60 characters.',
      });
    }

    const duplicate = await Category.findOne({
      _id: { $ne: category._id },
      name: new RegExp(`^${escapeRegex(name)}$`, 'i'),
    });
    if (duplicate) {
      return res.status(409).json({
        success: false,
        message: 'A category with this name already exists.',
      });
    }
    category.name = name;
  }

  if (req.body.description !== undefined) {
    category.description = String(req.body.description).trim();
  }

  if (typeof req.body.isActive === 'boolean') {
    category.isActive = req.body.isActive;
  }

  await category.save();

  await createAuditLog({
    actor: req.user,
    action: 'UPDATE',
    recordType: 'Category',
    recordId: category._id,
    recordLabel: category.name,
    newValue: category.name,
    details: 'Complaint category updated.',
    ipAddress: getRequestIp(req),
  });

  return res.json({
    success: true,
    message: 'Category updated successfully.',
    data: { category: category.toClientObject() },
  });
});

export const setCategoryStatus = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) {
    return res.status(404).json({
      success: false,
      message: 'Category not found.',
    });
  }

  if (typeof req.body.isActive !== 'boolean') {
    return res.status(400).json({
      success: false,
      message: 'isActive must be a boolean.',
    });
  }

  const previous = category.isActive !== false ? 'Active' : 'Inactive';
  const next = req.body.isActive ? 'Active' : 'Inactive';
  category.isActive = req.body.isActive;
  await category.save();

  await createAuditLog({
    actor: req.user,
    action: req.body.isActive ? 'ACTIVATE' : 'DEACTIVATE',
    recordType: 'Category',
    recordId: category._id,
    recordLabel: category.name,
    previousValue: previous,
    newValue: next,
    details: `Category status changed to ${next}.`,
    ipAddress: getRequestIp(req),
  });

  return res.json({
    success: true,
    message: req.body.isActive ? 'Category activated.' : 'Category deactivated.',
    data: { category: category.toClientObject() },
  });
});
