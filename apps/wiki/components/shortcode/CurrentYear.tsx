export default function CurrentYear() {
  const currentYear = new Date().getFullYear();

  return <span>{currentYear}</span>;
}
