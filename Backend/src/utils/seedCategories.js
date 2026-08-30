import Category from '../models/Category.js';
import { COMPLAINT_CATEGORIES } from '../models/Complaint.js';

export const seedComplaintCategories = async () => {
  for (const name of COMPLAINT_CATEGORIES) {
    const existing = await Category.findOne({ name });
    if (!existing) {
      await Category.create({
        name,
        isActive: true,
        description: `${name} complaint category`,
      });
      console.log(`Seeded complaint category: ${name}`);
    }
  }
};
