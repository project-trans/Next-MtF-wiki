import type { ShortCodeCompProps } from './types';

export default function Telephone({ attrs }: ShortCodeCompProps) {
  const phoneNumber = attrs[0] || '';
  // console.log("phoneNumber: ", JSON.stringify(attrs, null, 2));
  const cleanNumber = phoneNumber.replace(/[ -]/g, '');

  return (
    <a href={`tel:${cleanNumber}`} className="text-blue-600 hover:underline">
      {phoneNumber}
    </a>
  );
}
