import ComingSoon from '../components/common/ComingSoon';

const TITLES = {
  complaints: {
    title: 'Complaints',
    description: 'Complaint review and assignment workflows will be available here soon.',
  },
  'ob-records': {
    title: 'OB Records',
    description: 'OB record management tools will be available here soon.',
  },
  reports: {
    title: 'Reports',
    description: 'Operational and performance reports will be available here soon.',
  },
  notifications: {
    title: 'Notifications',
    description: 'System notification management will be available here soon.',
  },
  'audit-logs': {
    title: 'Audit Logs',
    description: 'Administrative audit trail visibility will be available here soon.',
  },
};

export default function ComingSoonPage({ moduleKey }) {
  const content = TITLES[moduleKey] || {
    title: 'Coming Soon',
    description: 'This module is under development and will be available in a future release.',
  };

  return <ComingSoon title={content.title} description={content.description} />;
}
