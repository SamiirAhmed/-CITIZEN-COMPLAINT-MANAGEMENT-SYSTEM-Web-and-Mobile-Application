import { useSearchParams } from 'react-router-dom';
import PoliceOBRecordsPanel from './PoliceOBRecordsPanel';

export default function PoliceOBRecordsPage() {
  const [searchParams] = useSearchParams();

  return (
    <div className="page-stack">
      <PoliceOBRecordsPanel initialSearch={searchParams.get('search') || ''} />
    </div>
  );
}
