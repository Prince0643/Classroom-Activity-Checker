import { statusToTagClass } from '../../utils/helpers.js';

export default function StatusTag({ status }) {
  return <span className={`tag ${statusToTagClass(status)}`}>{status || 'Scheduled'}</span>;
}
