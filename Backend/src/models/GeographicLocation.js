import mongoose from 'mongoose';

const geographicLocationSchema = new mongoose.Schema(
  {
    region: {
      type: String,
      required: [true, 'Region is required'],
      trim: true,
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
    },
    village: {
      type: String,
      trim: true,
      default: '',
    },
    area: {
      type: String,
      trim: true,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

geographicLocationSchema.index(
  { region: 1, district: 1, village: 1, area: 1 },
  { unique: true }
);

geographicLocationSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    region: this.region,
    district: this.district,
    village: this.village || '',
    area: this.area || '',
    isActive: this.isActive !== false,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

const GeographicLocation = mongoose.model('GeographicLocation', geographicLocationSchema);

export default GeographicLocation;
