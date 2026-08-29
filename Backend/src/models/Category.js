import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      unique: true,
      maxlength: [60, 'Category name must be at most 60 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

categorySchema.methods.toClientObject = function toClientObject() {
  return {
    id: this._id.toString(),
    name: this.name,
    isActive: this.isActive !== false,
    description: this.description || '',
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const Category = mongoose.model('Category', categorySchema);

export default Category;
